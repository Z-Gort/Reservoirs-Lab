import { app, BrowserWindow, Menu } from "electron";
import { ipcMainHandleWithArgs, ipcMainHandle, ipcMainOn, isDev, ipcWebContentsSend } from "./util.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import pg from "pg";
import Store from "electron-store";

const { Client } = pg;
const store = new Store<{
  connections: DatabaseConnection[];
}>();

let popupWindow: BrowserWindow | null = null; //Declare popupWindow as global--if used then must have been reassigned
const databaseWindows = new Map<string, BrowserWindow>();

app.on("ready", () => {
  process.on("unhandledRejection", (reason) => {
    //catch any potential issues from app quit->promise rejection
    console.warn("Unhandled Promise Rejection:", reason);
  });

  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  pollResources(mainWindow);

  ipcMainHandle("getStaticData", () => {
    return getStaticData();
  });

  ipcMainOn("sendFrameAction", (payload) => {
    switch (payload) {
      case "CLOSE":
        mainWindow.close();
        break;
      case "MAXIMIZE":
        mainWindow.maximize();
        break;
      case "MINIMIZE":
        mainWindow.minimize();
        break;
    }
  });

  // Handle popup window creation
  ipcMainOn("openPopup", () => {
    openPopup(mainWindow); // Pass `mainWindow` as a parameter
  });

  /*Connect to database and relay success/failure to front end?*/
  ipcMainOn("connectToDatabase", async (connectionData) => {
    const { host, port, user, password, database } = connectionData;

    const client = new Client({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database,
    });

    try {
      await client.connect();
      console.log("Connected to the database successfully!");

      // Retrieve existing connections from the store
      const connections: DatabaseConnection[] = store.get("connections", []);

      // Check if the connection already exists
      const connectionExists = connections.some(
        (connection) =>
          connection.host === connectionData.host &&
          connection.port === connectionData.port &&
          connection.user === connectionData.user &&
          connection.database === connectionData.database &&
          connection.password === connectionData.password // Optional: This is sensitive; consider not comparing passwords
      );

      if (!connectionExists) {
        // Add the new connection to the store
        store.set("connections", [...connections, connectionData]);

        // Notify the main window about the updated connections
        mainWindow.webContents.send(
          "connectionsUpdated",
          store.get("connections")
        );
      } else {
        console.log(
          "Connection already exists in the store. No update required."
        );
      }

      ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
        success: true,
      });

      client.end();
    } catch {
      console.error("Failed to connect to the database");

      ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
        success: false,
      });
    }
  });

  ipcMainHandle("getConnections", () => {
    // Retrieve the connections from electron-store
    const connections = store.get("connections", []);
    return connections; // Send the connections back to the renderer process
  });

  ipcMainOn("removeConnection", (connectionToRemove) => {
    console.log("Removing connection:", connectionToRemove);

    // Get existing connections
    const connections: DatabaseConnection[] = store.get("connections", []);

    // Filter out the connection to remove
    const updatedConnections = connections.filter(
      (connection) =>
        !(
          connection.host === connectionToRemove.host &&
          connection.port === connectionToRemove.port &&
          connection.user === connectionToRemove.user &&
          connection.database === connectionToRemove.database
        )
    );

    // Update the store
    store.set("connections", updatedConnections);

    // Notify the mainWindow of the updated connections
    mainWindow.webContents.send("connectionsUpdated", updatedConnections);

    console.log("Connection removed successfully.");
  });

  ipcMainOn("openDatabaseWindow", (connection: DatabaseConnection) => {
    const existingWindow = databaseWindows.get(connection.database);

    if (existingWindow && !existingWindow.isDestroyed()) {
      existingWindow.focus(); // Focus on the existing window
    } else {
      // Create a new window
      const dbWindow = createDatabaseWindow(connection);

      // Store the reference
      databaseWindows.set(connection.database, dbWindow);

      dbWindow.on("closed", () => {
        databaseWindows.delete(connection.database); // Remove from map
  
        // Show the main window if no database windows are open
        if (databaseWindows.size === 0) {
          mainWindow.show();
        }
      });
    }

    // Hide the main window
    mainWindow.hide();
  });

  ipcMainHandleWithArgs(
    "getSchemas",
    async (event, { connection }: { connection: DatabaseConnection }) => {
      const clientConfig = {
        ...connection,
        port: parseInt(connection.port, 10), // Convert port to a number
      };
      const client = new Client(clientConfig);
      await client.connect();
  
      try {
        const res = await client.query("SELECT schema_name FROM information_schema.schemata");
        return res.rows.map((row) => row.schema_name); // Return array of schema names
      } catch (error) {
        console.error("Error fetching schemas:", error);
        throw error;
      } finally {
        client.end();
      }
    }
  );
  
  

  ipcMainHandleWithArgs("getTables", async (event, { connection, schema }: { connection: DatabaseConnection; schema: string }) => {
    // Convert port to a number to match ClientConfig requirements
    const clientConfig = {
      ...connection,
      port: parseInt(connection.port, 10), // Ensure port is a number
    };
  
    const client = new Client(clientConfig);
    await client.connect();
  
    try {
      const res = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = $1",
        [schema]
      );
      return res.rows.map((row) => row.table_name); // Return an array of table names
    } catch (error) {
      console.error("Error fetching tables:", error);
      throw error; // Forward the error to the renderer process
    } finally {
      client.end();
    }
  });  

  ipcMainHandleWithArgs("getVectorColumns", async (event, { connection, schema, table }: { connection: DatabaseConnection; schema: string; table: string }) => {
    // Ensure the port is a number
    const clientConfig = {
      ...connection,
      port: parseInt(connection.port, 10),
    };
  
    const client = new Client(clientConfig);
    await client.connect();
  
    try {
      const query = `
        SELECT 
          a.attname AS column_name,
          t.typname AS column_type,
          c.relname AS index_name,
          am.amname AS index_type
        FROM pg_attribute a
        JOIN pg_type t ON a.atttypid = t.oid
        LEFT JOIN pg_index i ON a.attnum = ANY(i.indkey) AND i.indrelid = a.attrelid
        LEFT JOIN pg_class c ON i.indexrelid = c.oid
        LEFT JOIN pg_am am ON c.relam = am.oid
        WHERE a.attrelid = $1::regclass
          AND t.typname = 'vector'; -- Only fetch vector columns
      `;
  
      // Format schema and table for querying
      const fullTableName = `${schema}.${table}`;
  
      // Execute query
      const res = await client.query(query, [fullTableName]);
  
      // Map query results to the desired format
      return res.rows.map((row) => ({
        column_name: row.column_name,
        has_index: !!row.index_name, // True if the column has an index
        index_type: row.index_type || null, // Index type (e.g., 'ivfflat') if available
      }));
    } catch (error) {
      console.error("Error fetching vector columns:", error);
      throw error; // Forward error to the renderer process
    } finally {
      client.end();
    }
  });  

  createTray(mainWindow);
  handleCloseEvents(mainWindow);
  createMenu(mainWindow);
});

function handleCloseEvents(mainWindow: BrowserWindow) {
  let willClose = false;

  mainWindow.on("close", (e) => {
    if (willClose) {
      return;
    }
    e.preventDefault();
    mainWindow.hide();
    if (app.dock) {
      app.dock.hide();
    }
  });

  app.on("before-quit", () => {
    willClose = true;
  });

  mainWindow.on("show", () => {
    willClose = false;
  });
}

function createPopupWindow(parentWindow: BrowserWindow) {
  const popupWindow = new BrowserWindow({
    width: 500, // Retain the specified width
    height: 550, // Retain the specified height
    parent: parentWindow, // Ensure it's a child of the main window
    modal: true, // Block interaction with the main window
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    popupWindow.loadURL("http://localhost:5123/#/popup"); // Use hash route in development
  } else {
    popupWindow.loadFile(getUIPath(), { hash: "#/popup" }); // Use hash route in production
  }

  // Cleanup logic for when the popup window is closed
  popupWindow.on("closed", () => {
    // Perform any necessary cleanup actions
    console.log("Popup window closed. Cleaning up resources...");
  });

  return popupWindow; // Return the popup window for further use if needed
}

function openPopup(parentWindow: BrowserWindow) {
  if (!popupWindow) {
    popupWindow = createPopupWindow(parentWindow);
    popupWindow.on("closed", () => {
      popupWindow = null; // Clear reference when closed
    });
  }
}

function createDatabaseWindow(connection: DatabaseConnection) {
  if (!connection || !connection.database) {
    throw new Error("Invalid connection data");
  }

  const dbWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
    },
  });

  const connectionParam = encodeURIComponent(JSON.stringify(connection));

  if (isDev()) {
    dbWindow.loadURL(`http://localhost:5123/#/database?connection=${connectionParam}`);
  } else {
    dbWindow.loadFile(getUIPath(), {
      hash: `#/database?connection=${connectionParam}`,
    });
  }

  return dbWindow;
}


