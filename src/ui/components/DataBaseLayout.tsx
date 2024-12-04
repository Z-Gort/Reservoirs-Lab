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
  const [pointCount, setPointCount] = useState<number>(100);
  const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false); // Add refresh trigger state

  const handleRefresh = (newPointCount: number) => {
    setPointCount(newPointCount); // Update the point count
    setRefreshTrigger((prev) => !prev); // Toggle the refresh trigger
    console.log(`Refreshing graph with ${newPointCount} points`);
  };

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
          hoveredMetadata={hoveredMetadata}
          onRefresh={handleRefresh}
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
              onHoverChange={setHoveredMetadata}
              pointCount={pointCount}
              refreshTrigger={refreshTrigger}
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