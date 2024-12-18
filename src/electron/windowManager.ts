import { app, BrowserWindow } from "electron";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { isDev } from "./toFrontUtils.js";

class WindowManager {
  private popupWindow: BrowserWindow | null = null;
  private databaseWindows = new Map<string, BrowserWindow>();
  private mainWindow: BrowserWindow | null = null;

  public createMainWindow(): BrowserWindow {
    if (this.mainWindow) return this.mainWindow;
  
    this.mainWindow = new BrowserWindow({
      webPreferences: { preload: getPreloadPath() },
    });
  
    const url = isDev() ? "http://localhost:5123" : getUIPath();
  
    this.mainWindow.loadURL(url).catch((error) => {
    });
  
    this.handleCloseEvents(this.mainWindow);
  
    return this.mainWindow;
  }

  public createPopupWindow(parentWindow: BrowserWindow): BrowserWindow {
    if (this.popupWindow) return this.popupWindow;

    this.popupWindow = new BrowserWindow({
      width: 500,
      height: 550,
      parent: parentWindow,
      modal: true,
      resizable: false,
      webPreferences: { preload: getPreloadPath() },
    });

    const url = isDev()
      ? "http://localhost:5123/#/popup"
      : `${getUIPath()}#popup`;

    this.popupWindow.loadURL(url);

    this.popupWindow.on("closed", () => {
      this.popupWindow = null;
    });

    return this.popupWindow;
  }

  public getPopupWindow(): BrowserWindow | null {
    return this.popupWindow;
  }

  public createDatabaseWindow(connection: DatabaseConnection): BrowserWindow {
    const existingWindow = this.databaseWindows.get(connection.database);
    if (existingWindow) {
      existingWindow.focus();
      return existingWindow;
    }

    const dbWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: { preload: getPreloadPath(), contextIsolation: true },
    });

    const connectionParam = encodeURIComponent(JSON.stringify(connection));
    const url = isDev()
      ? `http://localhost:5123/#/database?connection=${connectionParam}`
      : `${getUIPath()}#database?connection=${connectionParam}`;

    dbWindow.loadURL(url);

    dbWindow.on("closed", () => {
      this.databaseWindows.delete(connection.database);
      if (this.databaseWindows.size === 0) {
        this.mainWindow?.show();
      }
    });

    this.databaseWindows.set(connection.database, dbWindow);
    return dbWindow;
  }

  public openDatabaseWindow(connection: DatabaseConnection): BrowserWindow {
    const existingWindow = this.databaseWindows.get(connection.database);
    if (existingWindow) {
      existingWindow.focus();
      return existingWindow;
    }
  
    const dbWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: { preload: getPreloadPath(), contextIsolation: true },
    });
  
    const connectionParam = encodeURIComponent(JSON.stringify(connection));
    const url = isDev()
      ? `http://localhost:5123/#/database?connection=${connectionParam}`
      : `${getUIPath()}#database?connection=${connectionParam}`;
  
    dbWindow.loadURL(url);
  
    dbWindow.on("closed", () => {
      this.databaseWindows.delete(connection.database);
      if (this.databaseWindows.size === 0) {
        this.mainWindow?.show(); 
      }
    });

  
    this.databaseWindows.set(connection.database, dbWindow); 
    return dbWindow;
  }
  
  public closeDatabaseWindow(database: string): void {
    const dbWindow = this.databaseWindows.get(database);
    if (dbWindow) {
      dbWindow.close();
      this.databaseWindows.delete(database);
    }
  }

  private handleCloseEvents(mainWindow: BrowserWindow): void {
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

  public getAllDatabaseWindows(): BrowserWindow[] {
    return Array.from(this.databaseWindows.values());
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public closeMainWindow(): void {
    this.mainWindow?.close();
    this.mainWindow = null;
  }
}

export const windowManager = new WindowManager();
