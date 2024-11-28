import React from "react";
import { Grid } from "@mui/material";
import ConnectionCard from "./ConnectionCard";

interface ConnectionsGridProps {
  connections: DatabaseConnection[];
}

const ConnectionsGrid: React.FC<ConnectionsGridProps> = ({ connections }) => (
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
        <ConnectionCard connection={connection} />
      </Grid>
    ))}
  </Grid>
);

export default ConnectionsGrid;


