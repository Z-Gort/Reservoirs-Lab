import { app, BrowserWindow, Menu } from "electron";
import { ipcMainHandle, ipcMainOn, isDev, ipcWebContentsSend } from "./util.js";
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

app.on("ready", () => {
  process.on("unhandledRejection", (reason) => {
    //catch any potential issues from app quit->promise rejection
    console.warn("Unhandled Promise Rejection:", reason);
  });

  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
    // disables default system frame (dont do this if you want a proper working menu bar)
    frame: false,
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
