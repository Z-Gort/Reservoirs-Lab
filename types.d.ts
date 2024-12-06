type Statistics = {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
};

type StaticData = {
  totalStorage: number;
  cpuModel: string;
  totalMemoryGB: number;
};

type View = "CPU" | "RAM" | "STORAGE";

type FrameWindowAction = "CLOSE" | "MAXIMIZE" | "MINIMIZE";

type EventPayloadMapping = {
  statistics: Statistics;
  changeView: View;
  sendFrameAction: FrameWindowAction;
  openPopup: undefined;
  connectToDatabase: {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  };
  databaseConnectionStatus: {
    success: boolean;
    error?: string;
  };
  getConnections: DatabaseConnection[];
  connectionsUpdated: DatabaseConnection[];
  removeConnection: DatabaseConnection;
  openDatabaseWindow: DatabaseConnection;
  getSchemas: { connection: DatabaseConnection };
  getTables: { connection: DatabaseConnection; schema: string };
  getVectorColumns: {
    connection: DatabaseConnection;
    schema: string;
    table: string;
  };
  getVectorData: {
    connection: DatabaseConnection;
    schema: string;
    table: string;
    column: string;
    selectedID?: string;
    limit: number;
  };
  getTopCorrelations: {
    connection: DatabaseConnection;
    schema: string;
    table: string;
    column: string;
    selectedID: string;
    rowIDs: string[];
  };
  results: {
    getTopCorrelations: { column: string; correlation: number; pValue: number }[];
    getSchemas: string[];
    getTables: string[];
    getVectorColumns: {
      column_name: string;
      has_index: boolean;
      index_type: string | null;
    }[];
    getVectorData: { vector: number[]; metadata: Record<string, any> }[];
  };
};

type DatabaseConnection = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    subscribeStatistics: (
      callback: (statistics: Statistics) => void
    ) => UnsubscribeFunction;
    subscribeChangeView: (
      callback: (view: View) => void
    ) => UnsubscribeFunction;
    sendFrameAction: (payload: FrameWindowAction) => void;

    send: <Key extends keyof EventPayloadMapping>(
      key: Key,
      payload: EventPayloadMapping[Key]
    ) => void;
    on: <Key extends keyof EventPayloadMapping>(
      key: Key,
      callback: (payload: EventPayloadMapping[Key]) => void
    ) => () => void;
    getConnections: () => Promise<DatabaseConnection[]>;
    getSchemas: (connection: DatabaseConnection) => Promise<string[]>;
    getTables: (args: {
      connection: DatabaseConnection;
      schema: string;
    }) => Promise<string[]>;
    getVectorColumns: (args: {
      connection: DatabaseConnection;
      schema: string;
      table: string;
    }) => Promise<
      {
        column_name: string;
        has_index: boolean;
        index_type: string | null;
      }[]
    >;
    getVectorData: (args: {
      connection: DatabaseConnection;
      schema: string;
      table: string;
      column: string;
      selectedID?: string;
      limit: number;
    }) => Promise<{ vector: number[]; metadata: Record<string, any> }[]>;
    getTopCorrelations: (args: {
      connection: DatabaseConnection;
      schema: string;
      table: string;
      column: string;
      selectedID: string;
      rowIDs: string[];
    }) => Promise<{ column: string; correlation: number; pValue: number }[]>;
  };
}
