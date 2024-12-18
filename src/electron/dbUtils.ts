import { BrowserWindow } from "electron";
import pg from "pg";
import { ipcWebContentsSend } from "./toFrontUtils.js";
import { windowManager } from "./windowManager.js";
import { storeManager } from "./storeManager.js";

const { Client } = pg;

export async function handleDatabaseConnection(
  mainWindow: BrowserWindow,
  connectionData: DatabaseConnection
) {
  const client = new Client({
    ...connectionData,
    port: parseInt(connectionData.port, 10),
  });

  try {
    await client.connect();
    const connections: DatabaseConnection[] = storeManager.getConnections();
    if (
      !connections.some(
        (conn) => JSON.stringify(conn) === JSON.stringify(connectionData)
      )
    ) {
      storeManager.addConnection(connectionData);
      mainWindow.webContents.send(
        "connectionsUpdated",
        storeManager.getConnections()
      );
    }
    const popupWindow = windowManager.getPopupWindow();
    ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
      success: true,
    });
  } catch (error) {
    console.error("Failed to connect to the database", error);
    const popupWindow = windowManager.getPopupWindow();
    ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
      success: false,
    });
  } finally {
    client.end();
  }
}

export function handleRemoveConnection(
  mainWindow: BrowserWindow,
  connectionToRemove: DatabaseConnection
) {
  const connections: DatabaseConnection[] = storeManager.getConnections();
  storeManager.removeConnection(connectionToRemove);
  mainWindow.webContents.send("connectionsUpdated", storeManager.getConnections());
}

export async function getSchemas(connection: DatabaseConnection): Promise<string[]> {
  const client = new Client({
    ...connection,
    port: parseInt(connection.port, 10),
  });

  await client.connect();

  try {
    const res = await client.query(
      "SELECT schema_name FROM information_schema.schemata"
    );
    return res.rows.map((row) => row.schema_name);
  } catch (err) {
    throw new Error("Failed to retrieve schemas from the database.");
  } finally {
    client.end();
  }
}

export async function getTables(
  connection: DatabaseConnection,
  schema: string
): Promise<string[]> {
  const client = new Client({
    ...connection,
    port: parseInt(connection.port, 10),
  });
  await client.connect();
  try {
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = $1",
      [schema]
    );
    return res.rows.map((row) => row.table_name);
  } finally {
    client.end();
  }
}

export async function getVectorColumns(
  connection: DatabaseConnection,
  schema: string,
  table: string
): Promise<
  { column_name: string; has_index: boolean; index_type: string | null }[]
> {
  const client = new Client({
    ...connection,
    port: parseInt(connection.port, 10),
  });
  await client.connect();
  try {
    const query = `
    SELECT 
      a.attname AS column_name,
      t.typname AS column_type,
      c.relname AS index_name,
      am.amname AS index_type
    FROM pg_attribute a
    JOIN pg_type t ON a.atttypid = t.oid
    LEFT JOIN pg_index i ON a.attnum = ANY(i.indkey) AND i.indrelid = a.attrelid
    LEFT JOIN pg_class c ON i.indexrelid = c.oid
    LEFT JOIN pg_am am ON c.relam = am.oid
    WHERE a.attrelid = $1::regclass
      AND t.typname = 'vector';
  `;
    const res = await client.query(query, [`${schema}.${table}`]);
    return res.rows.map((row) => ({
      column_name: row.column_name,
      has_index: !!row.index_name,
      index_type: row.index_type || null,
    }));
  } finally {
    client.end();
  }
}

export const getRandomRows = async (
  client: pg.Client,
  schema: string,
  table: string,
  column: string,
  limit: number
) => {
  const countQuery = `SELECT COUNT(*) AS total_rows FROM ${schema}.${table};`;
  const countRes = await client.query(countQuery);
  const totalRows = countRes.rows[0].total_rows;
  const oversampleFactor = 1.5;

  if (totalRows === 0) {
    throw new Error("The table is empty. No rows to sample.");
  }

  const oversamplePercentage = Math.min(
    ((limit * oversampleFactor) / totalRows) * 100,
    100
  );

  const sampleQuery = `
  WITH sampled_rows AS (
    SELECT ${column}, * -- Replace * with specific columns if necessary
    FROM ${schema}.${table}
    TABLESAMPLE BERNOULLI(${oversamplePercentage})
  )
  SELECT *
  FROM sampled_rows
  LIMIT $1; -- Ensure exact limit
`;
  const sampleRes = await client.query(sampleQuery, [limit]);

  return sampleRes.rows; 
};

export const getUuidColumn = async (
  client: pg.Client,
  schema: string,
  table: string
): Promise<string | null> => {
  const uuidQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2 AND data_type = 'uuid';
  `;

  const uuidResult = await client.query(uuidQuery, [schema, table]);

  if (uuidResult.rows.length > 0) {
    const uuidColumn = uuidResult.rows[0].column_name;
    return uuidColumn;
  } else {
    return null
  }
};
