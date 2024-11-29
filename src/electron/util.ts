import { ipcMain, WebContents, WebFrameMain } from 'electron';
import { getUIPath } from './pathResolver.js';
import { pathToFileURL } from 'url';

/*
Functions for sending events from main to renderer
*/
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, (event) => {
    validateEventFrame(event.senderFrame);
    return handler();
  });
}

export function ipcMainHandleWithArgs<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    payload: EventPayloadMapping[Key]
  ) => Promise<any> // Adjust return type if needed
) {
  ipcMain.handle(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    return handler(event, payload);
  });
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: EventPayloadMapping[Key]) => void
) {
  ipcMain.on(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    return handler(payload);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  console.log("sending", key, payload)
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  const uiPath = pathToFileURL(getUIPath()).toString();

  // Allow localhost in development
  if (isDev() && new URL(frame.url).host === 'localhost:5123') {
    return;
  }

  // Allow hash-based routes or slight variations
  if (!frame.url.startsWith(uiPath)) {
    throw new Error('Malicious event');
  }
}