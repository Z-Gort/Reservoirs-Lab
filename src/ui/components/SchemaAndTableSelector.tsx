import React from "react";
import { Box, MenuItem, Select, Typography } from "@mui/material";

interface SchemaAndTableSelectorProps {
  connection: DatabaseConnection;
  selectedSchema: string | null;
  setSelectedSchema: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTable: string | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>;
  selectedColumn: string | null;
  setSelectedColumn: React.Dispatch<React.SetStateAction<string | null>>;
}

const SchemaAndTableSelector: React.FC<SchemaAndTableSelectorProps> = ({
  connection,
  selectedSchema,
  setSelectedSchema,
  selectedTable,
  setSelectedTable,
  selectedColumn,
  setSelectedColumn,
}) => {
  const [schemas, setSchemas] = React.useState<string[]>([]);
  const [tables, setTables] = React.useState<string[]>([]);
  const [columns, setColumns] = React.useState<{ column_name: string; has_index: boolean }[]>([]);

  // Fetch schemas on load
  React.useEffect(() => {
    window.electron.getSchemas(connection).then(setSchemas).catch(console.error);
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
        .getVectorColumns({ connection, schema: selectedSchema!, table: selectedTable })
        .then(setColumns)
        .catch(console.error);
    }
  }, [selectedTable, selectedSchema, connection, setSelectedColumn]);

  return (
    <Box>
      <Typography>Select Schema:</Typography>
      <Select
        value={selectedSchema || ""}
        onChange={(e) => setSelectedSchema(e.target.value || null)}
        fullWidth
      >
        <MenuItem value="" disabled>
          Select a Schema
        </MenuItem>
        {schemas.map((schema) => (
          <MenuItem key={schema} value={schema}>
            {schema}
          </MenuItem>
        ))}
      </Select>

      <Typography>Select Table:</Typography>
      <Select
        value={selectedTable || ""}
        onChange={(e) => setSelectedTable(e.target.value || null)}
        fullWidth
        disabled={!selectedSchema}
      >
        <MenuItem value="" disabled>
          Select a Table
        </MenuItem>
        {tables.map((table) => (
          <MenuItem key={table} value={table}>
            {table}
          </MenuItem>
        ))}
      </Select>

      <Typography>Select Column:</Typography>
      <Select
        value={selectedColumn || ""}
        onChange={(e) => setSelectedColumn(e.target.value || null)}
        fullWidth
        disabled={!selectedTable}
      >
        <MenuItem value="" disabled>
          Select a Column
        </MenuItem>
        {columns.map((column) => (
          <MenuItem key={column.column_name} value={column.column_name}>
            {column.column_name} {column.has_index ? "🟢" : "🔴"}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default SchemaAndTableSelector;