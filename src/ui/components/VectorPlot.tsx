import { useTheme } from "@mui/material/styles";
import { Box, CircularProgress } from "@mui/material";
import React, { useEffect, useState, useCallback, useRef } from "react";
import Plot from "react-plotly.js";
import HoverableQuestionMark from "./HoverableQuestionMark";

const VectorPlot: React.FC<{
  connection: DatabaseConnection;
  schema: string;
  table: string;
  column: string;
  pointCount: number;
  refreshTrigger: boolean;
  onHoverChange: (metadata: Record<string, any> | null) => void;
  onPointClick: (selectedID: string, rowIDs: string[]) => void;
}> = ({
  connection,
  schema,
  table,
  column,
  onHoverChange,
  pointCount,
  refreshTrigger,
  onPointClick,
}) => {
  const [parsedVectors, setParsedVectors] = useState<
    { vector: number[]; metadata: Record<string, any> }[]
  >([]);
  const [vectors, setVectors] = useState<number[][]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSimilarityMode, setIsSimilarityMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const plotRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await window.electron.getVectorData({
          connection,
          schema,
          table,
          column,
          limit: pointCount,
        });
        const parsed = data.map(
          (item: { vector: number[]; metadata: any }) => ({
            vector: item.vector,
            metadata: item.metadata,
          })
        );
        setParsedVectors(parsed);
        setVectors(parsed.map((item) => item.vector));

        const defaultColors = Array(parsed.length).fill("blue");
        setColors(defaultColors);

        // Reset similarity mode on data fetch
        setIsSimilarityMode(false);
      } catch (err) {
        console.error("Error fetching vector data:", err);

        // Type guard: Ensure `err` is an object with a `message` property
        if (
          err instanceof Error &&
          err.message.includes("No uuidColumn found")
        ) {
          setError(
            "Table must contain a UUID column for vector visualization."
          );
        } else {
          setError("Failed to fetch vector data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [connection, schema, table, column, pointCount, refreshTrigger]);

  const handleHover = useCallback(
    (event: any) => {
      if (!event || !event.points || !event.points[0]) {
        console.warn("Invalid hover event structure:", event);
        return;
      }

      const point = event.points[0];
      const x = point.x;
      const y = point.y;
      const metadata = parsedVectors[point.pointIndex]?.metadata || null;

      if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
        console.error("Invalid x or y value for hover:", { x, y });
        return;
      }

      // Safely access axis information from the event
      const xaxis = event.xaxes?.[0];
      const yaxis = event.yaxes?.[0];

      if (!xaxis || !yaxis) {
        console.warn("Axis information is unavailable. Hover effect skipped.");
        return;
      }

      // Calculate pixel positions using axis conversion methods
      const xPixel = xaxis._offset + xaxis.l2p(x);
      const yPixel = yaxis._offset + yaxis.l2p(y); // Correct formula for yPixel

      // Get plot area boundaries in pixels
      const leftBoundary = xaxis._offset;
      const rightBoundary = xaxis._offset + xaxis._length;
      const topBoundary = yaxis._offset;

      console.log({
        xPixel,
        yPixel,
        leftBoundary,
        rightBoundary,
        topBoundary,
      });

      // Define a pixel margin for edge detection
      const horizontalMargin = 10; // Adjust as needed
      const topMargin = horizontalMargin / 2; // Top margin is half the size of the horizontal ones

      // Check if the point is near the edges (left, right, top)
      if (
        xPixel < leftBoundary + horizontalMargin || // Too close to the left
        xPixel > rightBoundary - horizontalMargin || // Too close to the right
        yPixel < topBoundary + topMargin // Too close to the top
      ) {
        console.warn("Point is too close to the edge. Hover effect skipped.");
        return;
      }

      // Call the onHoverChange handler
      onHoverChange(metadata);

      // Create a new annotation
      const newAnnotation = {
        x,
        y,
        text: "Click point for insights",
        showarrow: true,
        arrowhead: 2,
        ax: 0,
        ay: -30,
        font: {
          size: 12,
          color: "white",
        },
        align: "center",
        bgcolor: "black",
        bordercolor: "white",
      };

      // Set the new annotation
      setAnnotations([newAnnotation]);
    },
    [parsedVectors, onHoverChange]
  );

  const handleUnhover = useCallback(() => {
    onHoverChange(null);
    setAnnotations([]);
  }, [onHoverChange]);

  const handleClick = useCallback(
    async (event: any) => {
      const pointIndex = event.points[0].pointIndex; // Get clicked point's index
      const idColumn = await window.electron.getUuid({
        connection,
        schema,
        table,
      });

      if (!idColumn) {
        console.error("Table must contain a UUID column for point insights.");
        setError("Table must contain a UUID column for point insights.");
      }

      const selectedID = parsedVectors[pointIndex]?.metadata[idColumn!]; // Retrieve the clicked vector
      if (!selectedID) return;
      const rowIDs = parsedVectors.map((item) => item.metadata[idColumn!]);
      onPointClick(selectedID, rowIDs);
      setIsLoading(true);
      try {
        // Fetch data again, passing in the selected vector as the centerPoint
        const data = await window.electron.getVectorData({
          connection,
          schema,
          table,
          column,
          limit: pointCount,
          selectedID: selectedID, // Pass the selected vector as the centerPoint
        });

        const parsed = data.map(
          (item: { vector: number[]; metadata: any }) => ({
            vector: item.vector,
            metadata: item.metadata,
          })
        );
        setParsedVectors(parsed); // Update parsed vectors
        setVectors(parsed.map((item) => item.vector)); // Update vector positions

        // Optionally clear annotations or update with new insights
        setAnnotations([]);

        // Calculate distances and colors
        const distances = parsed.map(
          (item) => Math.sqrt(item.vector[0] ** 2 + item.vector[1] ** 2) // Distance from (0,0)
        );
        const maxDistance = Math.max(...distances); // Find the max distance for normalization
        const normalizedDistances = distances.map((d) => d / maxDistance); // Normalize to [0, 1]

        // Map distances to colors (e.g., red to blue)
        const newColors = normalizedDistances.map(
          (dist) => `rgba(${255 * dist}, 0, ${255 * (1 - dist)}, 1)` // Red to Blue gradient
        );

        setColors(newColors);
        setIsSimilarityMode(true);
      } catch (err) {
        console.error("Error refetching vector data:", err);
        setError("Failed to refetch vector data.");
      } finally {
        setIsLoading(false);
      }
    },
    [parsedVectors, connection, schema, table, column, onPointClick]
  );

  if (error) return <div>{error}</div>;

  const x = vectors.map((v) => v[0]);
  const y = vectors.map((v) => v[1]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%", // Full width of the parent container
        height: "100%", // Full height of the parent container
      }}
    >
      {isSimilarityMode && (
        <Box
          sx={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20, // Ensure it appears above other elements
            fontSize: "1rem",
            fontWeight: "bold",
            display: "flex",
            gap: theme.spacing(1),
            color: theme.palette.text.primary, // Match the theme's text color
          }}
        >
          Similarity View
          <HoverableQuestionMark tooltipText="Points plotted taking into account cosine distance from point of interest as well as natural groupings. Point of interest at (0,0)." />
        </Box>
      )}
      {/* Loader overlay */}
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.5)", // Slightly dim the background
            zIndex: 10,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Graph with blur effect when loading */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          filter: isLoading ? "blur(0.15px)" : "none", // Add blur effect if loading
          transition: "filter 0.3s ease", // Smooth transition for blur
        }}
      >
        <Plot
          data={[
            {
              x,
              y,
              mode: "markers",
              type: "scatter",
              marker: {
                size: 8,
                color: colors, // Apply the calculated colors
                opacity: 0.8,
              },
              hoverinfo: "none",
            },
          ]}
          layout={{
            autosize: true,
            paper_bgcolor: theme.palette.background.paper,
            uirevision: "preserve", // Themed paper background
            plot_bgcolor: theme.palette.background.paper, // Themed plot background
            xaxis: {
              zeroline: true, // Show the zero line
              showgrid: true, // Display grid lines
              showticklabels: true, // Display tick labels (numbers)
            },
            yaxis: {
              zeroline: true, // Show the zero line
              showgrid: true, // Display grid lines
              showticklabels: true, // Display tick labels (numbers)
            },
            showlegend: false,
            annotations,
          }}
          config={{
            displaylogo: false,
            scrollZoom: true,
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: [
              "toImage", // Remove "Save as PNG"
              "zoom2d", // Remove "Zoom"
              "resetScale2d", // Remove "Reset Axes"
              "hoverClosestCartesian", // Remove "Hover Closest"
              "hoverCompareCartesian", // Remove "Compare Data"
            ],
          }}
          onHover={handleHover}
          onUnhover={handleUnhover}
          onClick={handleClick}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      </Box>
    </Box>
  );
};

export default VectorPlot;
