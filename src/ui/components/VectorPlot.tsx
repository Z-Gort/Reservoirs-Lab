import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import React, { useEffect, useState, useCallback } from "react";
import Plot from "react-plotly.js";

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
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
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
      } catch (err) {
        console.error("Error fetching vector data:", err);
        setError("Failed to fetch vector data.");
      }
    };

    fetchData();
  }, [connection, schema, table, column, pointCount, refreshTrigger]);

  const handleHover = useCallback(
    (event: any) => {
      const pointIndex = event.points[0].pointIndex;
      const x = event.points[0].x;
      const y = event.points[0].y;
      const metadata = parsedVectors[pointIndex]?.metadata || null;

      if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
        console.error("Invalid x or y value for hover:", { x, y });
        return;
      }

      onHoverChange(metadata);
      const newAnnotation = {
        x,
        y,
        text: "Click on point to see insights",
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
      } catch (err) {
        console.error("Error refetching vector data:", err);
        setError("Failed to refetch vector data.");
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
        width: "100%", // Full width of the parent container
        height: "100%", // Full height of the parent container
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
              color: "blue",
              opacity: 0.8,
            },
            hoverinfo: "none",
          },
        ]}
        layout={{
          autosize: true,
          paper_bgcolor: theme.palette.background.paper, // Themed paper background
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
        }}
        onHover={handleHover}
        onUnhover={handleUnhover}
        onClick={handleClick}
        useResizeHandler={true} // Enables resize handling
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  );
};

export default VectorPlot;
