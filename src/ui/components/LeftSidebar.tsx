import React, { useState } from "react";
import { Box } from "@mui/material";
import ResizableZone from "./ResizableZone";
import SchemaAndTableSelector from "./SchemaAndTableSelector";
import BottomContent from "./BottomContent";

interface LeftSidebarProps {
  connection: DatabaseConnection;
  selectedSchema: string | null;
  setSelectedSchema: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTable: string | null;
  setSelectedTable: React.Dispatch<React.SetStateAction<string | null>>;
  selectedColumn: string | null;
  setSelectedColumn: React.Dispatch<React.SetStateAction<string | null>>;
  hoveredMetadata: Record<string, any> | null; // New prop
  onRefresh: (pointCount: number) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  connection,
  selectedSchema,
  setSelectedSchema,
  selectedTable,
  setSelectedTable,
  selectedColumn,
  setSelectedColumn,
  hoveredMetadata,
  onRefresh,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(300);

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = e.clientX;
    setSidebarWidth(Math.max(100, Math.min(newWidth, 600))); // Restrict width between 100px and 600px
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const formatMetadataValue = (value: any): string => {
    if (typeof value === "object" && value !== null) {
      // Convert objects/arrays to a JSON string
      return JSON.stringify(value, null, 2);
    }
    // Handle other types (string, number, boolean, etc.)
    return value.toString();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: `${sidebarWidth}px`,
        height: "100vh",
        backgroundColor: "#f5f5f5",
        borderRight: "1px solid #ddd",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Resizable Zones */}
      <ResizableZone
        topContent={
          <Box sx={{ padding: "10px", backgroundColor: "#ffffff", color: "#333", overflowY: "auto" }}>
            <SchemaAndTableSelector
              connection={connection}
              selectedSchema={selectedSchema}
              setSelectedSchema={setSelectedSchema}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              selectedColumn={selectedColumn}
              setSelectedColumn={setSelectedColumn}
            />
            {/* Metadata Display in Top Zone */}
            <Box sx={{ marginTop: "10px" }}>
              <h3>Point Details</h3>
              {hoveredMetadata ? (
                <ul>
                  {Object.entries(hoveredMetadata).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {formatMetadataValue(value)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Hover over a point to see details here.</p>
              )}
            </Box>
          </Box>
        }
        bottomContent={
          <BottomContent onRefresh={onRefresh} /> // Pass the onRefresh prop to BottomContent
        }
      />

      {/* Resizer */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "5px",
          height: "100%",
          cursor: "col-resize",
          backgroundColor: "#ddd",
        }}
      />
    </Box>
  );
};

export default LeftSidebar;