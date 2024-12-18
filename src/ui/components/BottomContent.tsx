import React, { useState } from "react";
import { Box, Button, TextField, Tooltip, useTheme } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HoverableQuestionMark from "./HoverableQuestionMark"; 


interface BottomContentProps {
  onRefresh: (pointCount: number) => void;
  selectedPointData:
    | { column: string; correlation: number; pValue: number }[]
    | null;
}

const BottomContent: React.FC<BottomContentProps> = ({
  onRefresh,
  selectedPointData,
}) => {
  const [pointCount, setPointCount] = useState<number | string>(100);
  // Default to 100 points
  const theme = useTheme();

  const handleRefreshClick = () => {
    const validatedPointCount =
      typeof pointCount === "string" ? parseInt(pointCount, 10) : pointCount;

    if (!isNaN(validatedPointCount)) {
      onRefresh(validatedPointCount);
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2) }}
    >
      {/* Input and Refresh Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.spacing(1),
          marginLeft: theme.spacing(2),
        }}
      >
        <TextField
          label="Number of Points"
          type="number"
          value={pointCount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (/^\d*$/.test(value)) {
              setPointCount(value === "" ? "" : parseInt(value, 10)); // Allow empty string for intermediate states
            }
          }}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
              setPointCount(Math.max(4, Math.min(1500, value))); // Apply clamping on blur
            } else {
              setPointCount(4); // Default to minimum if invalid
            }
          }}
          sx={{
            width: "180px", // Explicitly set width
            flexShrink: 0, // Prevent shrinking
            "& .MuiInputBase-root": {
              height: "36px", // Match the height of Select and Button
            },
          }}
        />

        <Tooltip title="Get new points" arrow>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRefreshClick}
            sx={{
              padding: theme.spacing(1), // Keep the button size as is
              minWidth: "50px", // Ensure the button width is consistent
            }}
          >
            <RefreshIcon />
          </Button>
        </Tooltip>
      </Box>

      {/* Top Correlations Section */}
      {selectedPointData && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1), // Reduced gap between elements
            fontSize: "0.85rem", // Smaller overall text size
            marginLeft: theme.spacing(2), // Add a small margin from the left wall
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: theme.spacing(1), // Small gap between the text and the question mark
            }}
          >
            <h4 style={{ margin: 0, fontSize: "1rem", display: "inline" }}>
              Correlated Metadata
            </h4>
            <HoverableQuestionMark tooltipText="Pearson correlation between cosine distance and metadata column (only supported for numerical metadata currently)" />
          </Box>

          <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
            {selectedPointData.map(({ column, correlation, pValue }) => (
              <li
                key={column}
                style={{
                  marginBottom: "4px", // Minimal spacing between items
                  fontSize: "0.85rem",
                  fontStyle: pValue <= 0.05 ? "italic" : "normal", // Italicize significant correlations
                  color: theme.palette.text.primary, // Consistent text color
                }}
              >
                <strong>{column}:</strong> {correlation.toFixed(3)}{" "}
                {" (p-value: "}
                {pValue.toFixed(3)}
                {")"} {/* Display p-value as fixed-point */}
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
};

export default BottomContent;
