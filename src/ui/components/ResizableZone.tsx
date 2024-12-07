import React, { useRef } from "react";
import { Box, useTheme } from "@mui/material";

interface ResizableZoneProps {
  topContent: React.ReactNode;
  bottomContent: React.ReactNode;
}

const ResizableZone: React.FC<ResizableZoneProps> = ({
  topContent,
  bottomContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topHeightRef = useRef(50); // Store top height in percentage
  const isResizingRef = useRef(false);
  const theme = useTheme();

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !containerRef.current) return;

    const containerHeight = containerRef.current.offsetHeight;
    const newTopHeight = (e.clientY / containerHeight) * 100;
    topHeightRef.current = Math.max(10, Math.min(newTopHeight, 90));

    containerRef.current.style.setProperty(
      "--top-height",
      `${topHeightRef.current}%`
    );
    containerRef.current.style.setProperty(
      "--bottom-height",
      `${100 - topHeightRef.current}%`
    );
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        "--top-height": "50%", // Default top height
        "--bottom-height": "50%", // Default bottom height
      }}
    >
      {/* Top Zone */}
      <Box
        sx={{
          height: "var(--top-height)", // Use CSS variable for dynamic height
          overflow: "auto",
          backgroundColor: theme.palette.secondary.dark,
          borderBottom: "none", // Removed default border
        }}
      >
        {topContent}
      </Box>

      {/* Resizer */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          height: "5px", // Draggable area size
          cursor: "row-resize", // Resize cursor
          backgroundColor: "transparent", // Transparent draggable zone
          display: "flex",
          alignItems: "center", // Center the black line vertically
        }}
      >
        <Box
          sx={{
            height: "1px", // Black line thickness
            width: "100%", // Stretch across the resizer
            backgroundColor: "black", // Black line color
          }}
        />
      </Box>

      {/* Bottom Zone */}
      <Box
        sx={{
          height: "var(--bottom-height)", // Use CSS variable for dynamic height
          overflow: "auto",
          backgroundColor: theme.palette.secondary.dark,
        }}
      >
        {bottomContent}
      </Box>
    </Box>
  );
};

export default ResizableZone;
