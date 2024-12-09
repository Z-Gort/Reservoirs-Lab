import React from "react";
import { Box, useTheme } from "@mui/material";

interface HoverableQuestionMarkProps {
  tooltipText: string;
}

const HoverableQuestionMark: React.FC<HoverableQuestionMarkProps> = ({
  tooltipText,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        backgroundColor: theme.palette.grey[400],
        color: theme.palette.text.primary,
        fontSize: "0.75rem",
        fontWeight: "normal",
        textAlign: "center",
        position: "relative",
        "&:hover": {
          cursor: "pointer",
        },
      }}
    >
      ?
      <Box
        sx={{
          visibility: "hidden",
          opacity: 0,
          transition: "opacity 0.2s ease-in-out",
          position: "absolute",
          top: "120%", // Position below the question mark
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          padding: theme.spacing(1),
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[1],
          fontSize: "0.75rem",
          whiteSpace: "normal",
          wordWrap: "break-word",
          width: "200px", // Set fixed width
          zIndex: 10,
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-6px",
            left: "50%",
            transform: "translateX(-50%)",
            borderWidth: "6px",
            borderStyle: "solid",
            borderColor: `transparent transparent ${theme.palette.background.paper} transparent`,
          },
        }}
        className="tooltip"
      >
        {tooltipText}
      </Box>
      <style>
        {`
          div:hover > .tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>
    </Box>
  );
};

export default HoverableQuestionMark;