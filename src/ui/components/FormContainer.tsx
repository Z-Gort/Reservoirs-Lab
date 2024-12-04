import React from "react";
import { Box } from "@mui/material";

interface FormContainerProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}

const FormContainer: React.FC<FormContainerProps> = ({ children, onSubmit }) => {
  return (
    <Box
      component="form"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem", // Add spacing between fields
        width: "100%", // Ensure the form takes full width
        maxWidth: "400px", // Ensure form elements don't exceed container
        alignItems: "center", // Center the form contents horizontally
      }}
      onSubmit={onSubmit}
    >
      {children}
    </Box>
  );
};

export default FormContainer;