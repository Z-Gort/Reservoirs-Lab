import React, { useState } from "react";
import { Box } from "@mui/material";
import LeftSidebar from "./LeftSidebar";
import VectorPlot from "./VectorPlot";
import Frame from "./Frame";

const DatabaseLayout: React.FC<{ connection: DatabaseConnection }> = ({ connection }) => {
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [hoveredMetadata, setHoveredMetadata] = useState<Record<string, any> | null>(null);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column", // Ensure header is at the top
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Frame />
      {/* Main Content */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar */}
        <LeftSidebar
          connection={connection}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          selectedColumn={selectedColumn}
          setSelectedColumn={setSelectedColumn}
          hoveredMetadata={hoveredMetadata} // Pass hovered metadata
        />

        {/* Plot Area */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {selectedSchema && selectedTable && selectedColumn ? (
            <VectorPlot
              connection={connection}
              schema={selectedSchema}
              table={selectedTable}
              column={selectedColumn}
              onHoverChange={setHoveredMetadata} // Pass setter for hovered metadata
            />
          ) : (
            <div>Please select a schema, table, and column to display the plot.</div>
          )}
        </Box>
      </Box>
    </Box>
  );
};



export default DatabaseLayout;