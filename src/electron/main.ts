import { app } from "electron";
import { createMenu } from "./menu.js";
import { windowManager } from "./windowManager.js";
import { setupIpcHandlers } from "./ipcHandlers.js";



app.on("ready", () => {
  const mainWindow = windowManager.createMainWindow();
  setupIpcHandlers(mainWindow);
  createMenu(mainWindow);
});



