import React from "react";
import { Typography } from "@mui/material";

interface HeaderProps {
  text: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  align?: "left" | "center" | "right";
  color?: string;
}

const Header: React.FC<HeaderProps> = ({
  text,
  variant = "h3",
  align = "center",
  color = "#ffffff",
}) => {
  return (
    <Typography
      variant={variant}
      align={align}
      sx={{
        color: color,
        margin: 0,
        fontFamily: "'Tahoma', sans-serif",

        fontSize: "1.8rem",
      }}
    >
      {text}
    </Typography>
  );
};

export default Header;
