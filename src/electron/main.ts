import { app, BrowserWindow } from "electron";
import {
  ipcMainHandleWithArgs,
  ipcMainHandle,
  ipcMainOn,
  isDev,
  ipcWebContentsSend,
} from "./util.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import pg from "pg";
import Store from "electron-store";
import { PythonShell } from "python-shell";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
// @ts-ignore
import jstat from "jstat";

const { Client } = pg;
const store = new Store<{ connections: DatabaseConnection[] }>();

// -------------------
// Global Declarations
// -------------------
let popupWindow: BrowserWindow | null = null;
const databaseWindows = new Map<string, BrowserWindow>();
let dbWindow: BrowserWindow | null = null;

// -------------------
// Main Electron App Logic
// -------------------
app.on("ready", () => {
  const mainWindow = createMainWindow();
  setupIpcHandlers(mainWindow);
  pollResources(mainWindow);
  createTray(mainWindow);
  handleCloseEvents(mainWindow);
  createMenu(mainWindow);
});

// -------------------
// Window Management
// -------------------
function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    webPreferences: { preload: getPreloadPath() },
  });
  const url = isDev() ? "http://localhost:5123" : getUIPath();
  mainWindow.loadURL(url);
  return mainWindow;
}

function createPopupWindow(parentWindow: BrowserWindow): BrowserWindow {
  const popup = new BrowserWindow({
    width: 500,
    height: 550,
    parent: parentWindow,
    modal: true,
    resizable: false,
    webPreferences: { preload: getPreloadPath() },
  });
  if (isDev()) {
    // Development URL
    popup.loadURL("http://localhost:5123/#/popup");
  } else {
    // Production: Load the file
    popup.loadFile(getUIPath(), { hash: "#/popup" });
  }
  popup.on("closed", () => (popupWindow = null));
  return popup;
}

function createDatabaseWindow(
  connection: DatabaseConnection,
  mainWindow: BrowserWindow
): BrowserWindow {
  const dbWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: { preload: getPreloadPath(), contextIsolation: true },
  });

  const connectionParam = encodeURIComponent(JSON.stringify(connection));
  if (isDev()) {
    dbWindow.loadURL(
      `http://localhost:5123/#/database?connection=${connectionParam}`
    );
  } else {
    dbWindow.loadFile(getUIPath(), {
      hash: `#/database?connection=${connectionParam}`,
    });
  }

  dbWindow.on("closed", () => {
    databaseWindows.delete(connection.database);
    if (databaseWindows.size === 0) mainWindow?.show();
  });

  dbWindow.webContents.openDevTools({ mode: "detach" }); // Use 'detach' to open DevTools in a separate window

  return dbWindow;
}

function handleCloseEvents(mainWindow: BrowserWindow) {
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

// -------------------
// IPC Handlers Setup
// -------------------
function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMainHandle("getStaticData", getStaticData);

  ipcMainOn("sendFrameAction", (payload) => {
    handleFrameAction(dbWindow!, payload);
  });

  ipcMainOn("openPopup", () => {
    if (!popupWindow) popupWindow = createPopupWindow(mainWindow);
  });

  ipcMainOn("connectToDatabase", async (connectionData) => {
    await handleDatabaseConnection(mainWindow, connectionData);
  });

  ipcMainHandle("getConnections", () => {
    return store.get("connections", []);
  });

  ipcMainOn("removeConnection", (connectionToRemove) => {
    handleRemoveConnection(mainWindow, connectionToRemove);
  });

  ipcMainOn("openDatabaseWindow", (connection: DatabaseConnection) => {
    dbWindow = openDatabaseWindow(mainWindow, connection);
  });

  ipcMainHandleWithArgs(
    "getSchemas",
    async (_, { connection }: { connection: DatabaseConnection }) => {
      return getSchemas(connection);
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
      console.log("getting vectors:", connection, schema, table);
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

        // Fetch the high-dimensional vector if selectedID is provided
        if (selectedID) {
          console.log("PASSED IN SELECTEDID", selectedID);
          const centerQuery = `
          SELECT ${column} 
          FROM ${schema}.${table} 
          WHERE ${uuidColumn} = $1; -- Assuming 'id' is the primary key
        `;

          const centerRes = await client.query(centerQuery, [selectedID]);

          if (centerRes.rows.length > 0) {
            centerPoint = centerRes.rows[0][column];
          } else {
            throw new Error(`No vector found for selectedID: ${selectedID}`);
          }
        }

        const rows = await getRandomRows(client, schema, table, column, limit);

        // Step 3: Extract vectors and metadata
        const vectorsWithMetadata = rows.map((row) => {
          const vector = row[column];
          const metadata = { ...row };
          delete metadata[column];
          return { vector, metadata };
        });
        const vectors = vectorsWithMetadata.map((item) => item.vector);
        let reducedVectors;
        if (selectedID) {
          // Run dimensionality reduction with weighting based on centerPoint
          console.log("RUNNING DIMENSIONALITY REDUCTION WITH CENTER POINT");
          reducedVectors = await runDimensionalityReduction(
            vectors,
            centerPoint
          );
        } else {
          // Run dimensionality reduction normally
          reducedVectors = await runDimensionalityReduction(vectors);
        }

        console.log(
          "REDUCED VECTORS: ",
          JSON.stringify(reducedVectors).slice(0, 50)
        );
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

  // Python helper function for dimensionality reduction
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  async function runDimensionalityReduction(
    vectors: string[],
    centerPoint?: string // Assume it's a JSON string
  ): Promise<number[][]> {
    try {
      // Parse centerPoint if it is provided
      let parsedCenterPoint: number[] | undefined;
      if (centerPoint) {
        try {
          parsedCenterPoint = JSON.parse(centerPoint);
        } catch (error) {
          console.error("Failed to parse centerPoint:", centerPoint, error);
          throw new Error("Invalid centerPoint format");
        }
      }

      const parsedVectors = vectors.map((vectorString) =>
        JSON.parse(vectorString)
      );
      const scriptPath = parsedCenterPoint
        ? path.join(
            process.cwd(),
            "src/electron/scripts/reduceDimensionWithCenter.py"
          )
        : path.join(process.cwd(), "src/electron/scripts/reduceDimension.py");

      const serializedVectors = parsedVectors
        .map((row) => row.join(","))
        .join(";");

      const tempFilePath = join(tmpdir(), `vectors_${Date.now()}.txt`);
      writeFileSync(tempFilePath, serializedVectors);

      const args = [tempFilePath]; // Common argument for all scripts

      if (parsedCenterPoint) {
        const serializedCenterPoint = parsedCenterPoint.join(",");
        args.push(serializedCenterPoint);
      }

      console.log("ABOUT TO RUN SCRIPT: ", scriptPath);

      const results = await new Promise<number[][]>((resolve, reject) => {
        const shell = new PythonShell(scriptPath, {
          args: args,
          pythonPath: "./venv/bin/python3",
          pythonOptions: ["-u"],
        });

        const output: number[][] = [];
        shell.on("message", (message) => {
          output.push(...JSON.parse(message));
        });

        shell.end((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(output);
          }
        });
      });

      if (!results || results.length === 0) {
        throw new Error("No results returned from the Python script.");
      }

      return results; // Return the 2D embeddings
    } catch (err) {
      console.error("Error running dimensionality reduction:", err);
      throw err;
    }
  }

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
        rowIDs, // Array of row IDs currently displayed in the plot
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
        // Step 1: Fetch the selected vector
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

        // Step 2: Fetch vectors and metadata for provided rowIDs
        const subsetQuery = `
          SELECT id, ${column}, * -- Replace * with specific columns if necessary
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

        // Step 3: Compute cosine similarities for the subset
        const cosineSimilarities = vectorsWithMetadata.map(({ vector }) => {
          vector = JSON.parse(vector);
          return computeCosineSimilarity(selectedVector, vector);
        });

        const topCorrelations = computeCorrelations(
          vectorsWithMetadata,
          cosineSimilarities
        );
        console.log("TOP CORRELATIONS: ", topCorrelations);
        return topCorrelations;
      } catch (error) {
        console.error("Error fetching top correlations:", error);
        throw error;
      } finally {
        client.end();
      }
    }
  );

  // -------------------
  // Helper Functions
  // -------------------
  function handleFrameAction(window: BrowserWindow, payload: string) {
    switch (payload) {
      case "CLOSE":
        window.close();
        break;
      case "MAXIMIZE":
        // Toggle maximize and restore
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
        break;
      case "MINIMIZE":
        window.minimize();
        break;
      default:
        console.warn(`Unknown frame action: ${payload}`);
    }
  }

  async function handleDatabaseConnection(
    mainWindow: BrowserWindow,
    connectionData: DatabaseConnection
  ) {
    const client = new Client({
      ...connectionData,
      port: parseInt(connectionData.port, 10),
    });

    try {
      await client.connect();
      const connections: DatabaseConnection[] = store.get("connections", []);
      if (
        !connections.some(
          (conn) => JSON.stringify(conn) === JSON.stringify(connectionData)
        )
      ) {
        store.set("connections", [...connections, connectionData]);
        mainWindow.webContents.send(
          "connectionsUpdated",
          store.get("connections")
        );
      }
      ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
        success: true,
      });
    } catch (error) {
      console.error("Failed to connect to the database", error);
      ipcWebContentsSend("databaseConnectionStatus", popupWindow!.webContents, {
        success: false,
      });
    } finally {
      client.end();
    }
  }

  function handleRemoveConnection(
    mainWindow: BrowserWindow,
    connectionToRemove: DatabaseConnection
  ) {
    const connections: DatabaseConnection[] = store.get("connections", []);
    store.set(
      "connections",
      connections.filter(
        (conn) => JSON.stringify(conn) !== JSON.stringify(connectionToRemove)
      )
    );
    mainWindow.webContents.send("connectionsUpdated", store.get("connections"));
  }

  async function getSchemas(connection: DatabaseConnection): Promise<string[]> {
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
    } finally {
      client.end();
    }
  }

  async function getTables(
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

  async function getVectorColumns(
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

  function openDatabaseWindow(
    mainWindow: BrowserWindow,
    connection: DatabaseConnection
  ) {
    const existingWindow = databaseWindows.get(connection.database);
    if (existingWindow) {
      existingWindow.focus();
      return existingWindow;
    } else {
      const dbWindow = createDatabaseWindow(connection, mainWindow);
      databaseWindows.set(connection.database, dbWindow);
      dbWindow.on("closed", () => {
        databaseWindows.delete(connection.database);
        if (databaseWindows.size === 0) mainWindow.show();
      });
      return dbWindow;
    }
  }
}

const getRandomRows = async (
  client: pg.Client,
  schema: string,
  table: string,
  column: string,
  limit: number
) => {
  // Step 1: Get total row count in the table
  const countQuery = `SELECT COUNT(*) AS total_rows FROM ${schema}.${table};`;
  const countRes = await client.query(countQuery);
  const totalRows = countRes.rows[0].total_rows;
  const oversampleFactor = 1.5;

  if (totalRows === 0) {
    throw new Error("The table is empty. No rows to sample.");
  }

  // Step 2: Calculate oversampling percentage
  const oversamplePercentage = Math.min(
    ((limit * oversampleFactor) / totalRows) * 100,
    100
  );

  // Step 3: Use TABLESAMPLE BERNOULLI to oversample rows
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

  return sampleRes.rows; // Return the sampled rows
};

function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b ** 2, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // Handle zero-magnitude vectors
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

function computePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error("Arrays must have the same length");
  }

  const n = x.length;
  const meanX = x.reduce((sum, xi) => sum + xi, 0) / n;
  const meanY = y.reduce((sum, yi) => sum + yi, 0) / n;

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
    0
  );
  const denominator = Math.sqrt(
    x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0) *
      y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0)
  );

  if (denominator === 0) {
    return 0; // Handle cases where the data has no variability
  }

  return numerator / denominator;
}

const computeCorrelations = (
  vectorsWithMetadata: { vector: number[]; metadata: Record<string, any> }[],
  cosineSimilarities: number[]
) => {
  const correlations: {
    column: string;
    correlation: number;
    pValue: number;
  }[] = [];
  const metadataKeys = Object.keys(vectorsWithMetadata[0].metadata);

  for (const key of metadataKeys) {
    const values = vectorsWithMetadata.map(({ metadata }) => metadata[key]);

    // Check if the column is numeric or convertible to numeric
    const isColumnNumeric = values.every(
      (v) =>
        typeof v === "number" ||
        (!isNaN(parseFloat(v as string)) && typeof v === "string")
    );

    if (isColumnNumeric) {
      // Convert all values to numbers (if needed)
      const numericValues = values.map((v) =>
        typeof v === "number" ? v : parseFloat(v as string)
      );

      // Compute the correlation
      const correlation = computePearsonCorrelation(
        cosineSimilarities,
        numericValues
      );

      // Compute the p-value
      const n = numericValues.length; // Number of samples
      const tStatistic =
        correlation * Math.sqrt((n - 2) / (1 - correlation ** 2));
      const degreesOfFreedom = n - 2;

      // Use a function to calculate p-value from the t-statistic
      const pValue = computePValueFromTStatistic(tStatistic, degreesOfFreedom);

      console.log(`P-value for ${key}:`, pValue);

      correlations.push({ column: key, correlation, pValue });
    } else {
      console.log(
        `Column ${key} is not numeric or cannot be converted to numeric.`
      );
    }
  }

  // Sort by absolute correlation and return the top 5
  const sortedCorrelations = correlations
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 5);

  console.log("Final sorted correlations:", sortedCorrelations);

  return sortedCorrelations;
};

const computePValueFromTStatistic = (
  t: number,
  degreesOfFreedom: number
): number => {
  const p = 2 * (1 - jstat.studentt.cdf(Math.abs(t), degreesOfFreedom));
  return p;
};

/**
 * Helper function to locate the UUID column in a given table schema.
 * @param client - The PostgreSQL client.
 * @param schema - The schema name.
 * @param table - The table name.
 * @returns The name of the UUID column if found; otherwise, throws an error.
 */
const getUuidColumn = async (
  client: pg.Client,
  schema: string,
  table: string
): Promise<string> => {
  const uuidQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2 AND data_type = 'uuid';
  `;

  const uuidResult = await client.query(uuidQuery, [schema, table]);

  if (uuidResult.rows.length > 0) {
    const uuidColumn = uuidResult.rows[0].column_name;
    console.log(`Found UUID column: ${uuidColumn}`);
    return uuidColumn;
  } else {
    throw new Error(
      `Table ${schema}.${table} must have a UUID column to locate the selected row.`
    );
  }
};
