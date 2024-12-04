import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

interface BottomContentProps {
  onRefresh: (pointCount: number) => void;
}

const BottomContent: React.FC<BottomContentProps> = ({ onRefresh }) => {
  const [pointCount, setPointCount] = useState<number>(100); // Default to 100 points

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value) || value < 0) {
      value = 0;
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
    </Box>
  );
};

export default BottomContent;