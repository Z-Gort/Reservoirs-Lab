import React from "react";
import { Box } from "@mui/material";
import LeftSidebar from "./LeftSidebar";

interface DatabaseLayoutProps {
  connection: DatabaseConnection;
}

const DatabaseLayout: React.FC<DatabaseLayoutProps> = ({ connection }) => {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh", // Full height of the viewport
        width: "100vw", // Full width of the viewport
        overflow: "hidden",
      }}
    >
      {/* Left Sidebar */}
      <LeftSidebar connection={connection} />

      {/* Plot Area */}
      <Box
        sx={{
          flex: 1, // Take up remaining space
          backgroundColor: "#ffffff", // Background for plot area
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div>Plot goes here</div>
      </Box>
    </Box>
  );
};

export default DatabaseLayout;
