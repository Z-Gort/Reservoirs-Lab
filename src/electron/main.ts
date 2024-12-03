import { app, BrowserWindow } from "electron";
import {
  ipcMainHandleWithArgs,
  ipcMainHandle,
  ipcMainOn,
  isDev,
  ipcWebContentsSend,
} from "./util.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import pg from "pg";
import Store from "electron-store";
import { PythonShell } from "python-shell";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const { Client } = pg;
const store = new Store<{ connections: DatabaseConnection[] }>();

// -------------------
// Global Declarations
// -------------------
let popupWindow: BrowserWindow | null = null;
const databaseWindows = new Map<string, BrowserWindow>();
let dbWindow: BrowserWindow | null = null;

// -------------------
// Main Electron App Logic
// -------------------
app.on("ready", () => {
  const mainWindow = createMainWindow();
  setupIpcHandlers(mainWindow);
  pollResources(mainWindow);
  createTray(mainWindow);
  handleCloseEvents(mainWindow);
  createMenu(mainWindow);
});

// -------------------
// Window Management
// -------------------
function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    webPreferences: { preload: getPreloadPath() },
  });
  const url = isDev() ? "http://localhost:5123" : getUIPath();
  mainWindow.loadURL(url);
  return mainWindow;
}

function createPopupWindow(parentWindow: BrowserWindow): BrowserWindow {
  const popup = new BrowserWindow({
    width: 500,
    height: 550,
    parent: parentWindow,
    modal: true,
    resizable: false,
    webPreferences: { preload: getPreloadPath() },
  });
  if (isDev()) {
    // Development URL
    popup.loadURL("http://localhost:5123/#/popup");
  } else {
    // Production: Load the file
    popup.loadFile(getUIPath(), { hash: "#/popup" });
  }
  popup.on("closed", () => (popupWindow = null));
  return popup;
}

function createDatabaseWindow(
  connection: DatabaseConnection,
  mainWindow: BrowserWindow
): BrowserWindow {
  const dbWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    webPreferences: { preload: getPreloadPath(), contextIsolation: true },
  });

  const connectionParam = encodeURIComponent(JSON.stringify(connection));
  if (isDev()) {
    dbWindow.loadURL(
      `http://localhost:5123/#/database?connection=${connectionParam}`
    );
  } else {
    dbWindow.loadFile(getUIPath(), {
      hash: `#/database?connection=${connectionParam}`,
    });
  }

  dbWindow.on("closed", () => {
    databaseWindows.delete(connection.database);
    if (databaseWindows.size === 0) mainWindow?.show();
  });

  dbWindow.webContents.openDevTools();

  return dbWindow;
}

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

// -------------------
// IPC Handlers Setup
// -------------------
function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMainHandle("getStaticData", getStaticData);

  ipcMainOn("sendFrameAction", (payload) => {
    handleFrameAction(dbWindow!, payload);
  });

  ipcMainOn("openPopup", () => {
    if (!popupWindow) popupWindow = createPopupWindow(mainWindow);
  });

  ipcMainOn("connectToDatabase", async (connectionData) => {
    await handleDatabaseConnection(mainWindow, connectionData);
  });

  ipcMainHandle("getConnections", () => {
    return store.get("connections", []);
  });

  ipcMainOn("removeConnection", (connectionToRemove) => {
    handleRemoveConnection(mainWindow, connectionToRemove);
  });

  ipcMainOn("openDatabaseWindow", (connection: DatabaseConnection) => {
    dbWindow = openDatabaseWindow(mainWindow, connection);
  });

  ipcMainHandleWithArgs(
    "getSchemas",
    async (_, { connection }: { connection: DatabaseConnection }) => {
      return getSchemas(connection);
    }
  );

  ipcMainHandleWithArgs(
    "getTables",
    async (
      _,
      { connection, schema }: { connection: DatabaseConnection; schema: string }
    ) => {
      return getTables(connection, schema);
    }
  );

  ipcMainHandleWithArgs(
    "getVectorColumns",
    async (
      _,
      {
        connection,
        schema,
        table,
      }: { connection: DatabaseConnection; schema: string; table: string }
    ) => {
      console.log("getting vectors:", connection, schema, table);
      return getVectorColumns(connection, schema, table);
    }
  );

  ipcMainHandleWithArgs(
    "getVectorData",
    async (
      event,
      {
        connection,
        schema,
        table,
        column,
      }: {
        connection: DatabaseConnection;
        schema: string;
        table: string;
        column: string;
      }
    ) => {
      const clientConfig = {
        ...connection,
        port: parseInt(connection.port, 10),
      };
      const client = new Client(clientConfig);
      await client.connect();
  
      try {
        // Modify the query to fetch the desired metadata along with the vector column
        const query = `
          SELECT ${column}, * -- Replace * with specific columns if you know what to fetch
          FROM ${schema}.${table}
          LIMIT 5000; -- Fetch 5000 rows
        `;
        const res = await client.query(query);
  
        // Map each row to include both the vector and metadata
        const vectorsWithMetadata = res.rows.map((row) => {
          const vector = row[column]; // Extract vector
          const metadata = { ...row }; // Extract all other row data as metadata
          delete metadata[column]; // Remove the vector from metadata
          return { vector, metadata };
        });
  
        console.log(
          "GOTTEN VECTORS WITH METADATA:",
          JSON.stringify(vectorsWithMetadata).substring(0, 5000) + "..."
        );
  
        // Extract vectors for dimensionality reduction
        const vectors = vectorsWithMetadata.map((item) => item.vector);
  
        // Run dimensionality reduction
        const reducedVectors = await runDimensionalityReduction(vectors);
  
        console.log(
          "REDUCED VECTORS:",
          JSON.stringify(reducedVectors).substring(0, 500) + "..."
        );
  
        // Combine reduced vectors with metadata
        const results = reducedVectors.map((vector, index) => ({
          vector,
          metadata: vectorsWithMetadata[index].metadata,
        }));
  
        return results; // Return combined [x, y] points and metadata
      } catch (error) {
        console.error("Error fetching vector data:", error);
        throw error;
      } finally {
        client.end();
      }
    }
  );  

  // Python helper function for dimensionality reduction
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  async function runDimensionalityReduction(
    vectors: string[]
  ): Promise<number[][]> {
    try {
      const parsedVectors = vectors.map((vectorString) =>
        JSON.parse(vectorString)
      );
      const scriptPath = path.join(
        process.cwd(),
        "src/electron/scripts/reduceDimension.py"
      );

      const serializedVectors = parsedVectors
        .map((row) => row.join(","))
        .join(";");

      const tempFilePath = join(tmpdir(), `vectors_${Date.now()}.txt`);
      writeFileSync(tempFilePath, serializedVectors);

      const results = await new Promise<number[][]>((resolve, reject) => {
        const shell = new PythonShell(scriptPath, {
          args: [tempFilePath],
          pythonPath: "./venv/bin/python3", 
          pythonOptions: ["-u"], 
        });

        const output: number[][] = [];
        shell.on("message", (message) => {
          output.push(...JSON.parse(message));
        });

        shell.end((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(output);
          }
        });
      });

      if (!results || results.length === 0) {
        throw new Error("No results returned from the Python script.");
      }

      return results; // Return the 2D embeddings
    } catch (err) {
      console.error("Error running dimensionality reduction:", err);
      throw err;
    }
  }

  // -------------------
  // Helper Functions
  // -------------------
  function handleFrameAction(window: BrowserWindow, payload: string) {
    switch (payload) {
      case "CLOSE":
        window.close();
        break;
      case "MAXIMIZE":
        // Toggle maximize and restore
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
        break;
      case "MINIMIZE":
        window.minimize();
        break;
      default:
        console.warn(`Unknown frame action: ${payload}`);
    }
  }

  async function handleDatabaseConnection(
    mainWindow: BrowserWindow,
    connectionData: DatabaseConnection
  ) {
    const client = new Client({
      ...connectionData,
      port: parseInt(connectionData.port, 10),
    });

    try {
      await client.connect();
      const connections: DatabaseConnection[] = store.get("connections", []);
      if (
        !connections.some(
          (conn) => JSON.stringify(conn) === JSON.stringify(connectionData)
        )
      ) {
        store.set("connections", [...connections, connectionData]);
        mainWindow.webContents.send(
          "connectionsUpdated",
          store.get("connections")
        );
      }
      ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
        success: true,
      });
    } catch (error) {
      console.error("Failed to connect to the database", error);
      ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
        success: false,
      });
    } finally {
      client.end();
    }
  }

  function handleRemoveConnection(
    mainWindow: BrowserWindow,
    connectionToRemove: DatabaseConnection
  ) {
    const connections: DatabaseConnection[] = store.get("connections", []);
    store.set(
      "connections",
      connections.filter(
        (conn) => JSON.stringify(conn) !== JSON.stringify(connectionToRemove)
      )
    );
    mainWindow.webContents.send("connectionsUpdated", store.get("connections"));
  }

  async function getSchemas(connection: DatabaseConnection): Promise<string[]> {
    const client = new Client({
      ...connection,
      port: parseInt(connection.port, 10),
    });
    await client.connect();
    try {
      const res = await client.query(
        "SELECT schema_name FROM information_schema.schemata"
      );
      return res.rows.map((row) => row.schema_name);
    } finally {
      client.end();
    }
  }

  async function getTables(
    connection: DatabaseConnection,
    schema: string
  ): Promise<string[]> {
    const client = new Client({
      ...connection,
      port: parseInt(connection.port, 10),
    });
    await client.connect();
    try {
      const res = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = $1",
        [schema]
      );
      return res.rows.map((row) => row.table_name);
    } finally {
      client.end();
    }
  }

  async function getVectorColumns(
    connection: DatabaseConnection,
    schema: string,
    table: string
  ): Promise<
    { column_name: string; has_index: boolean; index_type: string | null }[]
  > {
    const client = new Client({
      ...connection,
      port: parseInt(connection.port, 10),
    });
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
        AND t.typname = 'vector';
    `;
      const res = await client.query(query, [`${schema}.${table}`]);
      return res.rows.map((row) => ({
        column_name: row.column_name,
        has_index: !!row.index_name,
        index_type: row.index_type || null,
      }));
    } finally {
      client.end();
    }
  }

  function openDatabaseWindow(
    mainWindow: BrowserWindow,
    connection: DatabaseConnection
  ) {
    const existingWindow = databaseWindows.get(connection.database);
    if (existingWindow) {
      existingWindow.focus();
    return existingWindow
    } else {
      const dbWindow = createDatabaseWindow(connection, mainWindow);
      databaseWindows.set(connection.database, dbWindow);
      dbWindow.on("closed", () => {
        databaseWindows.delete(connection.database);
        if (databaseWindows.size === 0) mainWindow.show();
      });
      return dbWindow
    }
  }

}
