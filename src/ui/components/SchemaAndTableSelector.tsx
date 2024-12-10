import React from "react";
import { Box, MenuItem, Select, useTheme } from "@mui/material";

interface SchemaAndTableSelectorProps {
  connection: DatabaseConnection;
  selectedSchema: string | null;
  setSelectedSchema: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTable: string | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>;
  selectedColumn: string | null;
  setSelectedColumn: React.Dispatch<React.SetStateAction<string | null>>;
  onError: (error: string | null) => void;
}

const SchemaAndTableSelector: React.FC<SchemaAndTableSelectorProps> = ({
  connection,
  selectedSchema,
  setSelectedSchema,
  selectedTable,
  setSelectedTable,
  selectedColumn,
  setSelectedColumn,
  onError,
}) => {
  const [schemas, setSchemas] = React.useState<string[]>([]);
  const [tables, setTables] = React.useState<string[]>([]);
  const [columns, setColumns] = React.useState<
    { column_name: string; has_index: boolean }[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);
  const theme = useTheme();

  // Fetch schemas on load
  React.useEffect(() => {
    setError(null); // Reset error before making the request

    window.electron
      .getSchemas(connection)
      .then((fetchedSchemas) => {
        setSchemas(fetchedSchemas);
        if (fetchedSchemas.includes("public")) {
          setSelectedSchema("public");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch schemas:", err);
        onError("Connection failed... Check the connection then close and retry.");
      });
  }, [connection]);

  // Fetch tables when schema changes
  React.useEffect(() => {
    if (selectedSchema) {
      setTables([]);
      setSelectedTable(null);
      setColumns([]);
      setSelectedColumn(null);
      window.electron
        .getTables({ connection, schema: selectedSchema })
        .then(setTables)
        .catch(console.error);
    }
  }, [selectedSchema, connection, setSelectedTable, setSelectedColumn]);

  // Fetch columns when table changes
  React.useEffect(() => {
    if (selectedTable) {
      setColumns([]);
      setSelectedColumn(null);
      window.electron
        .getVectorColumns({
          connection,
          schema: selectedSchema!,
          table: selectedTable,
        })
        .then(setColumns)
        .catch(console.error);
    }
  }, [selectedTable, selectedSchema, connection, setSelectedColumn]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        backgroundColor: theme.palette.secondary.dark, // Ensure it matches the sidebar color
        color: theme.palette.text.primary, // Use text color consistent with the sidebar // Add some spacing for better layout
        borderRadius: theme.shape.borderRadius, // Optional: Add some rounding for aesthetics
      }}
    >
      {/* Schema Selector */}
      <Select
        value={selectedSchema || ""}
        onChange={(e) => setSelectedSchema(e.target.value || null)}
        fullWidth
        displayEmpty
        sx={{
          height: "36px", // Adjust the height of the Select field
          fontSize: "0.9rem", // Make the text slightly smaller
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: "200px", // Limit the height of the dropdown menu
              "& .MuiMenuItem-root": {
                minHeight: "32px", // Reduce the height of menu items
                fontSize: "0.9rem", // Match the font size of the Select
              },
            },
          },
        }}
      >
        <MenuItem value="" disabled>
          Select a Schema
        </MenuItem>
        {schemas.length === 0 ? (
          <MenuItem value="" disabled>
            Loading schemas...
          </MenuItem>
        ) : (
          schemas.map((schema) => (
            <MenuItem key={schema} value={schema}>
              {schema}
            </MenuItem>
          ))
        )}
      </Select>

      {/* Table Selector */}
      <Select
        value={selectedTable || ""}
        onChange={(e) => setSelectedTable(e.target.value || null)}
        fullWidth
        displayEmpty
        disabled={!selectedSchema}
        sx={{
          height: "36px", // Adjust the height of the Select field
          fontSize: "0.9rem", // Make the text slightly smaller
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: "200px", // Limit the height of the dropdown menu
              "& .MuiMenuItem-root": {
                minHeight: "32px", // Reduce the height of menu items
                fontSize: "0.9rem", // Match the font size of the Select
              },
            },
          },
        }}
      >
        <MenuItem value="" disabled>
          Select a Table
        </MenuItem>
        {tables.length === 0 ? (
          <MenuItem value="" disabled>
            No tables available
          </MenuItem>
        ) : (
          tables.map((table) => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))
        )}
      </Select>

      {/* Column Selector */}
      <Select
        value={selectedColumn || ""}
        onChange={(e) => setSelectedColumn(e.target.value || null)}
        fullWidth
        displayEmpty
        disabled={!selectedTable}
        sx={{
          height: "36px", // Adjust the height of the Select field
          fontSize: "0.9rem", // Make the text slightly smaller
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: "200px", // Limit the height of the dropdown menu
              "& .MuiMenuItem-root": {
                minHeight: "32px", // Reduce the height of menu items
                fontSize: "0.9rem", // Match the font size of the Select
              },
            },
          },
        }}
      >
        <MenuItem value="" disabled>
          Select a Column
        </MenuItem>
        {columns.length === 0 ? (
          <MenuItem value="" disabled>
            No columns available
          </MenuItem>
        ) : (
          columns.map((column) => (
            <MenuItem key={column.column_name} value={column.column_name}>
              {column.column_name}
            </MenuItem>
          ))
        )}
      </Select>
    </Box>
  );
};

export default SchemaAndTableSelector;
