import { app, BrowserWindow, Menu } from "electron";
import { ipcMainHandle, ipcMainOn, isDev, ipcWebContentsSend } from "./util.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import pg from 'pg';
const { Client } = pg;

let popupWindow: BrowserWindow | null = null; //Declare popupWindow as global--if used then must have been reassigned

app.on("ready", () => {
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
  })

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