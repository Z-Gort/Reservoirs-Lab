import { BrowserWindow } from "electron";
import {
  ipcMainHandleWithArgs,
  ipcMainHandle,
  ipcMainOn,
} from "./toFrontUtils.js";
import {
  handleDatabaseConnection,
  handleRemoveConnection,
  getSchemas,
  getTables,
  getVectorColumns,
  getRandomRows,
  getUuidColumn,
} from "./dbUtils.js";
import { windowManager } from "./windowManager.js";
import pg from "pg";
import { storeManager } from "./storeManager.js";
import { computeCosineSimilarity, computeCorrelations } from "./mathUtils.js";
import { runDimensionalityReduction } from "./pythonUtils.js";

const { Client } = pg;

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMainOn("openPopup", () => {
    windowManager.createPopupWindow(mainWindow);
  });

  ipcMainOn("connectToDatabase", async (connectionData) => {
    await handleDatabaseConnection(mainWindow, connectionData);
  });

  ipcMainHandle("getConnections", () => {
    return storeManager.getConnections();
  });

  ipcMainOn("removeConnection", (connectionToRemove) => {
    handleRemoveConnection(mainWindow, connectionToRemove);
  });

  ipcMainOn("openDatabaseWindow", (connection: DatabaseConnection) => {
    windowManager.openDatabaseWindow(connection);
  });

  ipcMainHandleWithArgs(
    "getSchemas",
    async (_, { connection }: { connection: DatabaseConnection }) => {
      try {
        return await getSchemas(connection);
      } catch (err) {
        throw new Error("Error in IPC handler: Failed to fetch schemas.");
      }
    }
  );
  

  ipcMainHandleWithArgs(
    "getTables",
    async (
      _,
      { connection, schema }: { connection: DatabaseConnection; schema: string }
    ) => {
      return getTables(connection, schema);
    }
  );

  ipcMainHandleWithArgs(
    "getVectorColumns",
    async (
      _,
      {
        connection,
        schema,
        table,
      }: { connection: DatabaseConnection; schema: string; table: string }
    ) => {
      return getVectorColumns(connection, schema, table);
    }
  );

  ipcMainHandleWithArgs(
    "getVectorData",
    async (event, { connection, schema, table, column, limit, selectedID }) => {
      const clientConfig = {
        ...connection,
        port: parseInt(connection.port, 10),
      };
      const client = new Client(clientConfig);
      await client.connect();

      try {
        let centerPoint: string | undefined;

        const uuidColumn = await getUuidColumn(client, schema, table);
        if (!uuidColumn) {
          throw new Error(`No uuidColumn found for ${schema}.${table}`);
        }


        if (selectedID) {
          const centerQuery = `
          SELECT "${column}"
          FROM ${schema}."${table}" 
          WHERE "${uuidColumn}" = $1; -- Assuming 'id' is the primary key
        `;

          const centerRes = await client.query(centerQuery, [selectedID]);

          if (centerRes.rows.length > 0) {
            centerPoint = centerRes.rows[0][column];
          } else {
            throw new Error(`No vector found for selectedID: ${selectedID}`);
          }
        }

        const rows = await getRandomRows(client, schema, table, column, limit);

        const vectorsWithMetadata = rows.map((row) => {
          const vector = row[column];
          const metadata = { ...row };
          delete metadata[column];
          return { vector, metadata };
        });
        const vectors = vectorsWithMetadata.map((item) => item.vector);
        let reducedVectors;
        if (selectedID) {
          reducedVectors = await runDimensionalityReduction(
            vectors,
            centerPoint
          );
        } else {
          reducedVectors = await runDimensionalityReduction(vectors);
        }

        const results = reducedVectors.map((vector, index) => ({
          vector,
          metadata: vectorsWithMetadata[index].metadata,
        }));

        return results;
      } catch (error) {
        console.error("Error fetching vector data:", error);
        throw error;
      } finally {
        client.end();
      }
    }
  );

  ipcMainHandleWithArgs(
    "getTopCorrelations",
    async (
      event,
      {
        connection,
        schema,
        table,
        column,
        selectedID,
        rowIDs, 
      }: {
        connection: DatabaseConnection;
        schema: string;
        table: string;
        column: string;
        selectedID: string;
        rowIDs: string[];
      }
    ) => {
      const clientConfig = {
        ...connection,
        port: parseInt(connection.port, 10),
      };
      const client = new Client(clientConfig);
      await client.connect();
      const uuidColumn = await getUuidColumn(client, schema, table);
      try {
        const vectorQuery = `
          SELECT ${column}
          FROM ${schema}.${table}
          WHERE ${uuidColumn} = $1;
        `;
        const vectorRes = await client.query(vectorQuery, [selectedID]);
        if (vectorRes.rows.length === 0) {
          throw new Error(`No vector found for selectedID: ${selectedID}`);
        }
        let selectedVector = vectorRes.rows[0][column];
        selectedVector = JSON.parse(selectedVector);

        const subsetQuery = `
          SELECT ${uuidColumn}, ${column}, * -- Replace * with specific columns if necessary
          FROM ${schema}.${table}
          WHERE ${uuidColumn} = ANY($1::uuid[]);
        `;
        const subsetRes = await client.query(subsetQuery, [rowIDs]);
        const vectorsWithMetadata = subsetRes.rows.map((row) => {
          const vector = row[column];
          const metadata = { ...row };
          delete metadata[column];
          return { vector, metadata };
        });

        const cosineSimilarities = vectorsWithMetadata.map(({ vector }) => {
          vector = JSON.parse(vector);
          return computeCosineSimilarity(selectedVector, vector);
        });

        const topCorrelations = computeCorrelations(
          vectorsWithMetadata,
          cosineSimilarities
        );

        return topCorrelations;
      } catch (error) {
        console.error("Error fetching top correlations:", error);
        throw error;
      } finally {
        client.end();
      }
    }
  );

  ipcMainHandleWithArgs(
    "getUuid",
    async (
      event,
      {
        connection,
        schema,
        table,
      }: {
        connection: DatabaseConnection;
        schema: string;
        table: string;
      }
    ) => {
      const client = new Client({
        ...connection,
        port: parseInt(connection.port, 10),
      });

      try {
        await client.connect();

        const uuidColumn = await getUuidColumn(client, schema, table);

        return uuidColumn;
      } catch (error) {
        console.error("Error fetching UUID column:", error);
        throw error;
      } finally {
        await client.end();
      }
    }
  );
}
