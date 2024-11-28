import React, { useState } from "react";
import { Card, CardContent, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import CloseButton from "./CloseButton";

interface ConnectionCardProps {
  connection: DatabaseConnection;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = () => {
    window.electron.send("removeConnection", connection);
    setIsDialogOpen(false); // Close the dialog after confirming
  };

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <Card
      sx={{
        position: "relative",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "1rem",
      }}
    >
      {/* CloseButton */}
      <CloseButton onClick={openDialog} />

      {/* Card Content */}
      <CardContent>
        <Typography variant="h6">{connection.database}</Typography>
        <Typography variant="body2">
          {connection.host}:{connection.port}
        </Typography>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDialog}>
        <DialogTitle>Are you sure you want to remove this connection?</DialogTitle>
        <DialogContent>
          <DialogContentText>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ConnectionCard;