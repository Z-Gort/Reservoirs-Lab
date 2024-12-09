import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import LeftSidebar from "./LeftSidebar";
import VectorPlot from "./VectorPlot";
import Frame from "./Frame";

const DatabaseLayout: React.FC<{ connection: DatabaseConnection }> = ({
  connection,
}) => {
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [hoveredMetadata, setHoveredMetadata] = useState<Record<
    string,
    any
  > | null>(null);
  const [pointCount, setPointCount] = useState<number>(100);
  const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false);
  const [selectedPointData, setSelectedPointData] = useState<
    { column: string; correlation: number; pValue: number }[] | null
  >(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  const handleRefresh = (newPointCount: number) => {
    setPointCount(newPointCount); 
    setRefreshTrigger((prev) => !prev); 
  };

  const handlePointClick = async (selectedID: string, rowIDs: string[]) => {
    if (!selectedSchema || !selectedTable || !selectedColumn) return;

    try {
      const correlations = await window.electron.getTopCorrelations({
        connection,
        schema: selectedSchema,
        table: selectedTable,
        column: selectedColumn,
        selectedID,
        rowIDs,
      });

      setSelectedPointData(correlations); // Pass this data to LeftSidebar
    } catch (error) {
      console.error("Failed to fetch correlations:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column", 
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative", 
      }}
    >
      {/* Error Overlay */}
      {databaseError && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center", 
            alignItems: "center", 
            backdropFilter: "blur(2px)", 
            zIndex: 10, 
            backgroundColor: "rgba(255, 255, 255, 0.4)", 
            padding: 2, 
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              border: "1px solid",
              borderColor: "error.main",
              bgcolor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "8px", 
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", 
              maxWidth: "400px", 
              width: "100%",
            }}
          >
            <Typography variant="body1" color="error">
              {databaseError}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          filter: databaseError ? "blur(0.15px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
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
          selectedPointData={selectedPointData}
          onError={setDatabaseError}
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
              onPointClick={handlePointClick}
            />
          ) : (
            <div>
              Please select a schema, table, and column to display the plot.
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DatabaseLayout;
