import React, { useEffect, useState, useCallback } from "react";
import Plot from "react-plotly.js";

const VectorPlot: React.FC<{
  connection: DatabaseConnection;
  schema: string;
  table: string;
  column: string;
  onHoverChange: (metadata: Record<string, any> | null) => void; // New prop
}> = ({ connection, schema, table, column, onHoverChange }) => {
  const [parsedVectors, setParsedVectors] = useState<
    { vector: number[]; metadata: Record<string, any> }[]
  >([]);
  const [vectors, setVectors] = useState<number[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await window.electron.getVectorData({
          connection,
          schema,
          table,
          column,
        });
        const parsed = data.map((item: { vector: number[]; metadata: any }) => ({
          vector: item.vector,
          metadata: item.metadata,
        }));
        setParsedVectors(parsed); // Store full parsed data
        setVectors(parsed.map((item) => item.vector)); // Store only vectors
      } catch (err) {
        console.error("Error fetching vector data:", err);
        setError("Failed to fetch vector data.");
      }
    };

    fetchData();
  }, [connection, schema, table, column]);

  // Memoize hover handlers to prevent re-renders
  const handleHover = useCallback(
    (event: any) => {
      const pointIndex = event.points[0].pointIndex;
      const metadata = parsedVectors[pointIndex]?.metadata || null; // Use parsedVectors
      onHoverChange(metadata); // Pass metadata to parent
    },
    [parsedVectors, onHoverChange]
  );

  const handleUnhover = useCallback(() => {
    onHoverChange(null); // Clear hover state
  }, [onHoverChange]);

  if (error) return <div>{error}</div>;

  const x = vectors.map((v) => v[0]);
  const y = vectors.map((v) => v[1]);

  return (
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
          hoverinfo: "none", // Disable hover info on the plot
        },
      ]}
      layout={{
        title: "Vector Plot",
        xaxis: { title: "X-Axis", zeroline: false },
        yaxis: { title: "Y-Axis", zeroline: false },
        showlegend: false,
      }}
      config={{
        displaylogo: false,
        scrollZoom: true, // Enable scroll zoom for better UX
      }}
      onHover={handleHover} // Use memoized hover handler
      onUnhover={handleUnhover} // Use memoized unhover handler
    />
  );
};

export default VectorPlot;