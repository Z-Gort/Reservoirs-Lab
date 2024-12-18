import { useEffect, useMemo, useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { useStatistics } from "./useStatistics";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { Box, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import logoImage from "./assets/logo.png";
import ConnectionsGrid from "./components/ConnectionsGrid";

function App() {
  const openPopup = () => {
    window.electron.send("openPopup", undefined); 
  };
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);

  useEffect(() => {
    window.electron.getConnections().then((initialConnections) => {
      setConnections(initialConnections);
    });

    const unsubscribe = window.electron.on(
      "connectionsUpdated",
      (updatedConnections) => {
        setConnections(updatedConnections);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "space-between",
        position: "relative", // For floating button positioning
      }}
    >
      {/* Top Header Section */}
      <img
        src={logoImage}
        alt="App Logo"
        style={{
          height: "80px",
        }}
      />

      {/* Connections Grid */}
      <ConnectionsGrid
        connections={connections}
        onOpenDatabase={(connection) => {
          window.electron.send("openDatabaseWindow", connection); // Send event to open a new database window
        }}
      />

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={openPopup}
        sx={{
          position: "absolute",
          bottom: "2rem",
          right: "2rem",
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default App;
