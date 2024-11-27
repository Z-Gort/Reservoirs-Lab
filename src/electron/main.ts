import { app, BrowserWindow, Menu } from "electron";
import { ipcMainHandle, ipcMainOn, isDev } from "./util.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";

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
    createPopupWindow(mainWindow); // Pass `mainWindow` as a parameter
  })

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
    width: 500, // Set an appropriate width
    height: 550, // Set an appropriate height
    parent: parentWindow, // Ensure it's a child of the main window
    modal: true, // Block interaction with the main window
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    popupWindow.loadURL("http://localhost:5123/#/popup"); // Use hash route
  } else {
    popupWindow.loadFile(getUIPath(), { hash: "#/popup" });
  }


  popupWindow.on("closed", () => {
    // Cleanup is handled automatically as `popupWindow` is scoped to this function
  });
}