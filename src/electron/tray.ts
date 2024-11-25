import { BrowserWindow, Menu, Tray, app } from 'electron';
import { getAssetPath } from './pathResolver.js';
import path from 'path';

export function createTray(mainWindow: BrowserWindow) {
  const tray = new Tray(
    path.join(
      getAssetPath(),
      process.platform === 'darwin' ? 'trayIconTemplate.png' : 'trayIcon.png'
    )
  );

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          mainWindow.show();
          if (app.dock) {
            app.dock.show();
          }
        },
      },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ])
  );
}