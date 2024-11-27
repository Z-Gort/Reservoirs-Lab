import React from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

function Popup() {
  return (
    <Box
      sx={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <Typography variant="h4" component="h2" gutterBottom>
        Database Connection
      </Typography>
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "400px",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          // Handle form submission logic
        }}
      >
        <TextField
          label="Host"
          name="host"
          variant="outlined"
          fullWidth
          required
        />
        <TextField
          label="Port"
          name="port"
          type="number"
          variant="outlined"
          fullWidth
          required
        />
        <TextField
          label="User"
          name="user"
          variant="outlined"
          fullWidth
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          variant="outlined"
          fullWidth
          required
        />
        <TextField
          label="Database"
          name="database"
          variant="outlined"
          fullWidth
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Connect
        </Button>
      </Box>
    </Box>
  );
}

export default Popup;