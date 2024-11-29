import React, { useState } from "react";
import { Card, CardContent, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import CloseButton from "./CloseButton";

const fontStyle = "'Libre Caslon Text', serif";

interface ConnectionCardProps {
  connection: DatabaseConnection;
  onOpenDatabase: (connection: DatabaseConnection) => void; // Add `onOpenDatabase` callback
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onOpenDatabase, }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to the card
    window.electron.send("removeConnection", connection);
    setIsDialogOpen(false); // Close the dialog after confirming
  };

  const openDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Stop the click event from propagating
    }
    setIsDialogOpen(true);
  };

  const closeDialog = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to the card
    setIsDialogOpen(false);
  };

  const handleOpenDatabase = () => {
    onOpenDatabase(connection); // Invoke the callback passed as a prop
  };

  return (
    <Card
      onClick={handleOpenDatabase} // Add click handler to open database
      sx={{
        position: "relative",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "1rem",
        cursor: "pointer", // Make it visually clear that the card is clickable
        "&:hover": {
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", // Highlight on hover
        },
      }}
    >
      {/* CloseButton */}
      <CloseButton onClick={openDialog} />

      {/* Card Content */}
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontFamily: fontStyle,
          }}
        >
          {connection.database}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: fontStyle,
          }}
        >
          {connection.host}:{connection.port}
        </Typography>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDialog}>
        <DialogTitle
          sx={{
            fontFamily: fontStyle,
          }}
        >
          Are you sure you want to remove this connection?
        </DialogTitle>
        <DialogActions>
          <Button
            onClick={closeDialog}
            color="primary"
            sx={{
              fontFamily: fontStyle,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            sx={{
              fontFamily: fontStyle,
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ConnectionCard;