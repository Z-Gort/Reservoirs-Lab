import React from "react";
import { Button } from "@mui/material";

interface SubmitButtonProps {
  label: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ label }) => {
  return (
    <Button
      type="submit"
      variant="contained"
      color="primary" // Leverages the theme's primary color
      fullWidth
      sx={{
        // Optional: Additional styles can refer to the theme for consistency
        textTransform: "none", // Prevents default uppercase styling
        fontWeight: "bold", // Example of using consistent typography styling
      }}
    >
      {label}
    </Button>
  );
};

export default SubmitButton;