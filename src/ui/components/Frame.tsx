import { Box } from "@mui/material";

function Frame() {
  return (
    <Box
      sx={{
        height: "30px",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #ddd",
        padding: "0 10px",
        WebkitAppRegion: "drag", // Makes the header draggable
        userSelect: "none", // Prevent text selection in the header
      }}
    >
      {/* Red, Yellow, Green Buttons */}
      <Box
        sx={{
          display: "flex",
          gap: "8px",
          marginLeft: "10px",
          WebkitAppRegion: "no-drag", // Ensure buttons are not draggable
        }}
      >
        <button
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: "red",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => window.electron.sendFrameAction("CLOSE")}
        />
        <button
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: "yellow",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => window.electron.sendFrameAction("MINIMIZE")}
        />
        <button
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: "green",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => window.electron.sendFrameAction("MAXIMIZE")}
        />
      </Box>
    </Box>
  );
}

export default Frame;
