import React, { useState } from "react";
import { Box, useTheme } from "@mui/material";
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
  selectedPointData:
    | { column: string; correlation: number; pValue: number }[]
    | null;
  onError: (error: string | null) => void;
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
  selectedPointData,
  onError
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const theme = useTheme();

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
    if (value === null) {
      // Handle null values explicitly
      return "null";
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
        borderRight: "1px solid black", // Thin black line as the border
        position: "relative",
        overflow: "hidden",
        backgroundColor: theme.palette.secondary.dark, // Sidebar background color
      }}
    >
      {/* Resizable Zones */}
      <ResizableZone
        topContent={
          <Box
            sx={{
              padding: theme.spacing(2), // Use theme spacing
              backgroundColor: theme.palette.secondary.dark, // Use theme paper background
              color: theme.palette.text.primary, // Use theme text color
              overflowY: "auto",
            }}
          >
            <SchemaAndTableSelector
              connection={connection}
              selectedSchema={selectedSchema}
              setSelectedSchema={setSelectedSchema}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              selectedColumn={selectedColumn}
              setSelectedColumn={setSelectedColumn}
              onError={onError}
            />
            {/* Metadata Display in Top Zone */}
            <Box sx={{ marginTop: theme.spacing(2) }}>
              {hoveredMetadata && selectedColumn ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing(0.5),
                  }}
                >
                  {Object.entries(hoveredMetadata).map(([key, value]) => (
                    <Box
                      key={key}
                      sx={{
                        fontSize: "0.75rem", // Smaller text
                        lineHeight: 1.2, // Tighter line spacing
                        color: theme.palette.text.primary, // Primary text color
                      }}
                    >
                      <strong>{key}:</strong> {formatMetadataValue(value)}
                    </Box>
                  ))}
                </Box>
              ) : selectedColumn ? (
                <p
                  style={{
                    color: theme.palette.text.secondary, // Use a lighter shade for the text
                    margin: 0,
                    fontSize: "0.85rem", // Smaller text
                  }}
                >
                  Hover a point to see details.
                </p>
              ) : null}
            </Box>
          </Box>
        }
        bottomContent={
          <Box sx={{ marginTop: "16px" }}>
            {" "}
            {/* Adjust margin as needed */}
            <BottomContent
              onRefresh={onRefresh}
              selectedPointData={selectedPointData}
            />
          </Box>
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
          backgroundColor: theme.palette.secondary.dark, // Use theme divider color
        }}
      />
    </Box>
  );
};

export default LeftSidebar;
