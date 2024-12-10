import path from "path";
import { app } from "electron";
import { isDev } from "./toFrontUtils.js";

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/preload.cjs"
  );
}

export function getUIPath() {
  const indexPath = path.join(app.getAppPath(), "dist-react", "index.html");
  return isDev() ? indexPath : `file://${indexPath}`;
}

export function getAssetPath() {
  return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/assets");
}
