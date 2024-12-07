import React, { useState } from "react";
import { Box, Button, TextField, Tooltip, useTheme } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh"; // Import refresh icon

interface BottomContentProps {
  onRefresh: (pointCount: number) => void;
  selectedPointData:
    | { column: string; correlation: number; pValue: number }[]
    | null; // New prop
}

const BottomContent: React.FC<BottomContentProps> = ({
  onRefresh,
  selectedPointData,
}) => {
  console.log("BottomContent - selectedPointData:", selectedPointData);
  const [pointCount, setPointCount] = useState<number | string>(100); // Allow number or string
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
              setPointCount(Math.max(4, Math.min(100, value))); // Apply clamping on blur
            } else {
              setPointCount(4); // Default to minimum if invalid
            }
          }}
          sx={{
            width: "180px", // Explicitly set a smaller width for the input box
            flexShrink: 0, // Prevent it from shrinking further
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
            gap: theme.spacing(2),
          }}
        >
          <h3>Top Correlations</h3>
          <ul>
            {selectedPointData.map(({ column, correlation, pValue }) => (
              <li key={column}>
                <strong>{column}:</strong> {correlation.toFixed(3)}
                {" (p-value: "}
                {pValue.toExponential(3)}{" "}
                {/* Display p-value in exponential format */}
                {")"}
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
};

export default BottomContent;
