import React, { useState, useEffect } from "react";
import { Box, MenuItem, Select, Typography, ListItemIcon } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

const SchemaAndTableSelector: React.FC<{ connection: DatabaseConnection }> = ({ connection }) => {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<{ column_name: string; has_index: boolean }[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  // Fetch schemas on component load
  useEffect(() => {
    window.electron.getSchemas(connection)
      .then(setSchemas)
      .catch(console.error);
  }, [connection]);
  
  useEffect(() => {
    if (selectedSchema) {
      window.electron
        .getTables({ connection, schema: selectedSchema })
        .then(setTables)
        .catch(console.error);
    }
  }, [selectedSchema, connection]);

  useEffect(() => {
    if (selectedSchema && selectedTable) {
      window.electron
        .getVectorColumns({ connection, schema: selectedSchema, table: selectedTable })
        .then(setColumns)
        .catch(console.error);
    }
  }, [selectedSchema, selectedTable, connection]);

  return (
    <Box sx={{ padding: "1rem" }}>
      {/* Schema Selector */}
      <Typography variant="body1" gutterBottom>
        Select Schema:
      </Typography>
      <Select
        value={selectedSchema}
        onChange={(e) => setSelectedSchema(e.target.value)}
        fullWidth
        displayEmpty
        sx={{ marginBottom: "1rem" }}
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

      {/* Table Selector */}
      <Typography variant="body1" gutterBottom>
        Select Table:
      </Typography>
      <Select
        value={selectedTable}
        onChange={(e) => setSelectedTable(e.target.value)}
        fullWidth
        displayEmpty
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

      <Typography variant="body1" gutterBottom>
        Select Vector Column:
      </Typography>
      <Select
        value={selectedColumn}
        onChange={(e) => setSelectedColumn(e.target.value)}
        fullWidth
        displayEmpty
      >
        <MenuItem value="" disabled>
          Select a Column
        </MenuItem>
        {columns.map(({ column_name, has_index }) => (
          <MenuItem key={column_name} value={column_name}>
            <ListItemIcon>
              <CircleIcon sx={{ color: has_index ? "green" : "red", fontSize: "small" }} />
            </ListItemIcon>
            {column_name}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default SchemaAndTableSelector;