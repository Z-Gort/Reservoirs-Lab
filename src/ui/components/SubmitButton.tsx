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
      color="primary"
      fullWidth
      sx={{
        backgroundColor: "#1976d2",
        color: "#ffffff",
        "&:hover": {
          backgroundColor: "#1565c0",
        },
      }}
    >
      {label}
    </Button>
  );
};

export default SubmitButton;
