import React from "react";
import { TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface TextFieldWithLabelProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}

const TextFieldWithLabel: React.FC<TextFieldWithLabelProps> = ({
  label,
  name,
  type = "text",
  required = false,
}) => {
  const theme = useTheme(); // Access the MUI theme

  return (
    <TextField
      label={label}
      name={name}
      type={type}
      variant="outlined"
      fullWidth
      required={required}
      sx={{
        backgroundColor: theme.palette.background.paper, // Use the theme's background color
        input: { color: theme.palette.text.primary }, // Use the theme's primary text color
        label: { color: theme.palette.text.secondary }, // Use the theme's secondary text color
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: theme.palette.divider, // Use the theme's divider color
          },
          "&:hover fieldset": {
            borderColor: theme.palette.text.primary, // Highlight with the primary text color
          },
          "&.Mui-focused fieldset": {
            borderColor: theme.palette.primary.main, // Use the primary color when focused
          },
        },
      }}
    />
  );
};

export default TextFieldWithLabel;