import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

interface BottomContentProps {
  onRefresh: (pointCount: number) => void;
  selectedPointData: { column: string; correlation: number, pValue: number }[] | null; // New prop
}

const BottomContent: React.FC<BottomContentProps> = ({
  onRefresh,
  selectedPointData,
}) => {
  console.log("BottomContent - selectedPointData:", selectedPointData);
  const [pointCount, setPointCount] = useState<number>(100); // Default to 100 points

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value) || value < 4) {
      value = 4;
    }
    setPointCount(Math.min(value, 100)); // Cap the number at 100
  };

  const handleRefreshClick = () => {
    onRefresh(pointCount); // Trigger refresh with the current point count
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <TextField
        label="Number of Points"
        type="number"
        value={pointCount}
        onChange={handleInputChange}
        inputProps={{ min: 0, max: 100 }}
        fullWidth
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleRefreshClick}
        sx={{ alignSelf: "flex-start" }}
      >
        Refresh
      </Button>

      {selectedPointData && (
  <Box
    sx={{
      backgroundColor: "background.paper",
      color: "text.primary",
      marginTop: "20px",
      padding: "10px",
    }}
  >
    <h3>Top Correlations</h3>
    <ul>
      {selectedPointData.map(({ column, correlation, pValue }) => (
        <li key={column}>
          <strong>{column}:</strong> {correlation.toFixed(3)} 
          {" (p-value: "}
          {pValue.toExponential(3)} {/* Display p-value in exponential format */}
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
