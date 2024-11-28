import React from "react";
import { TextField } from "@mui/material";

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
  return (
    <TextField
      label={label}
      name={name}
      type={type}
      variant="outlined"
      fullWidth
      required={required}
      sx={{
        backgroundColor: "#424242",
        input: { color: "#ffffff" },
        label: { color: "#bdbdbd" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#bdbdbd",
          },
          "&:hover fieldset": {
            borderColor: "#ffffff",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#ffffff",
          },
        },
      }}
    />
  );
};

export default TextFieldWithLabel;