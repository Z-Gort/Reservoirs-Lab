import React from "react";
import { Grid } from "@mui/material";
import ConnectionCard from "./ConnectionCard";

interface ConnectionsGridProps {
  connections: DatabaseConnection[];
  onOpenDatabase: (connection: DatabaseConnection) => void; // Add the callback prop
}

const ConnectionsGrid: React.FC<ConnectionsGridProps> = ({
  connections,
  onOpenDatabase, // Destructure the callback prop
}) => (
  <Grid
    container
    spacing={2}
    sx={{
      flex: 1, // Takes up remaining space
      padding: "1rem",
      overflowY: "auto", // Scroll if grid overflows
    }}
  >
    {connections.map((connection, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <ConnectionCard
          connection={connection}
          onOpenDatabase={() => onOpenDatabase(connection)} // Pass the callback to the card
        />
      </Grid>
    ))}
  </Grid>
);

export default ConnectionsGrid;



