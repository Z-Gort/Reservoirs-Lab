const electron = require("electron");

/*
Functions for sending events from rendered back to main
*/
electron.contextBridge.exposeInMainWorld("electron", {
  subscribeStatistics: (callback) =>
    ipcOn("statistics", (stats) => {
      callback(stats);
    }),
  subscribeChangeView: (callback) =>
    ipcOn("changeView", (view) => {
      callback(view);
    }),
  getStaticData: () => ipcInvoke("getStaticData"),
  sendFrameAction: (payload) => ipcSend("sendFrameAction", payload),

  send: ipcSend,
  on: ipcOn,
  getConnections: () => ipcInvoke("getConnections"),
  getSchemas: (connection: DatabaseConnection) =>
    ipcInvokeWithArgs<
      "getSchemas",
      { connection: DatabaseConnection },
      string[]>("getSchemas", { connection }), // Explicitly define the arguments and result types

  getTables: ({
    connection,
    schema,
  }: {
    connection: DatabaseConnection;
    schema: string;
  }) => ipcInvokeWithArgs("getTables", { connection, schema }),

  getVectorColumns: (args: { connection: DatabaseConnection; schema: string; table: string }) =>
    ipcInvokeWithArgs<
      "getVectorColumns",
      { connection: DatabaseConnection; schema: string; table: string },
      { column_name: string; has_index: boolean; index_type: string | null }[]
    >("getVectorColumns", args),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload?: EventPayloadMapping[Key] extends undefined
    ? never
    : EventPayloadMapping[Key]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, payload);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  console.log(`ipcOn triggered for event: ${key}`, callback);

  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key]
) {
  electron.ipcRenderer.send(key, payload);
}

function ipcInvokeWithArgs<
  Key extends keyof EventPayloadMapping,
  Args = EventPayloadMapping[Key],
  Result = EventPayloadMapping[Key]
>(key: Key, payload: Args): Promise<Result> {
  return electron.ipcRenderer.invoke(key, payload);
}
