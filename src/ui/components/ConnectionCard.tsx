import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
} from "@mui/material";
import CloseButton from "./CloseButton";
import PowerIcon from "@mui/icons-material/Power";

interface ConnectionCardProps {
  connection: DatabaseConnection;
  onOpenDatabase: (connection: DatabaseConnection) => void; // Add `onOpenDatabase` callback
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onOpenDatabase,
}) => {
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
      sx={(theme) => ({
        position: "relative",
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
        padding: theme.spacing(2),
        cursor: "pointer",
        "&:hover": {
          boxShadow: theme.shadows[4],
        },
      })}
    >
      <Box
        sx={(theme) => ({
          position: "absolute", // Position it in the top-right corner
          top: theme.spacing(1), // Distance from the top
          right: theme.spacing(1), // Distance from the right
          color: theme.palette.primary.main, // Use theme's primary color
        })}
      >
        <PowerIcon />
      </Box>
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
        <DialogTitle>
          Are you sure you want to remove this connection?
        </DialogTitle>
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
