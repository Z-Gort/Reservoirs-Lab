import { ipcMain, WebContents, WebFrameMain } from 'electron';
import { getUIPath } from './pathResolver.js';

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
  ) => Promise<any> 
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
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  const uiPath = getUIPath().toString();

  if (isDev() && new URL(frame.url).host === 'localhost:5123') {
    return;
  }

  if (!frame.url.startsWith(uiPath)) {
    throw new Error('Malicious event');
  }
}