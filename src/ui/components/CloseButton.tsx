import React from "react";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface CloseButtonProps {
  onClick: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => {
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "0.5rem", // Adjust closer to the top
        left: "0.5rem", // Move to the right corner
        width: "1.5rem", // Smaller size
        height: "1.5rem", // Smaller size
        padding: 0, // Remove extra padding
        backgroundColor: "transparent", // No background
        color: "red", // Chrome-style red
        "&:hover": {
          backgroundColor: "rgba(255, 0, 0, 0.1)", // Light red hover effect
        },
      }}
    >
      <CloseIcon
        sx={{
          fontSize: "1rem", // Smaller icon size
        }}
      />
    </IconButton>
  );
};

export default CloseButton;