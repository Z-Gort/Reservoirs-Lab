import React, { useState } from "react";
import { Box } from "@mui/material";
import ResizableZone from "./ResizableZone";
import SchemaAndTableSelector from "./SchemaAndTableSelector";

interface LeftSidebarProps {
  connection: DatabaseConnection; // Define the connection prop
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ connection }) => {
  const [sidebarWidth, setSidebarWidth] = useState(300); // Initial width of the sidebar
  const [isResizing, setIsResizing] = useState(false); // Track resizing state

  const handleMouseMove = (e: MouseEvent) => {
    const newWidth = e.clientX;
    setSidebarWidth(Math.max(100, Math.min(newWidth, 600)));
    console.log("Resizing without isResizing:", newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false); // Stop resizing
    document.removeEventListener("mousemove", handleMouseMove); // Remove listeners
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    setIsResizing(true); // Start resizing
    document.addEventListener("mousemove", handleMouseMove); // Add listeners
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: `${sidebarWidth}px`, // Dynamic width
        height: "100vh", // Full height
        backgroundColor: "#f5f5f5",
        borderRight: "1px solid #ddd",
        position: "relative", // Required for the resizer
        overflow: "hidden",
      }}
    >
      {/* Resizable Zones */}
      <ResizableZone
        topContent={<SchemaAndTableSelector connection={connection} />}
        bottomContent={<div>Insights/Metadata</div>}
      />

      {/* Resizer */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          position: "absolute",
          top: 0,
          right: 0, // Resizer on the right side
          width: "5px",
          height: "100%",
          cursor: "col-resize", // Horizontal resize cursor
          backgroundColor: "#ddd",
        }}
      />
    </Box>
  );
};

export default LeftSidebar;
