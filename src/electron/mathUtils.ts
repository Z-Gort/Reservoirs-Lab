// @ts-ignore
import jstat from "jstat";

export function computeCosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b ** 2, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; 
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

function computePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error("Arrays must have the same length");
  }

  const n = x.length;
  const meanX = x.reduce((sum, xi) => sum + xi, 0) / n;
  const meanY = y.reduce((sum, yi) => sum + yi, 0) / n;

  const numerator = x.reduce(
    (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
    0
  );
  const denominator = Math.sqrt(
    x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0) *
      y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0)
  );

  if (denominator === 0) {
    return 0; 
  }

  return numerator / denominator;
}

export const computeCorrelations = (
  vectorsWithMetadata: { vector: number[]; metadata: Record<string, any> }[],
  cosineSimilarities: number[]
) => {
  const correlations: {
    column: string;
    correlation: number;
    pValue: number;
  }[] = [];
  const metadataKeys = Object.keys(vectorsWithMetadata[0].metadata);

  for (const key of metadataKeys) {
    const values = vectorsWithMetadata.map(({ metadata }) => metadata[key]);

    const isColumnNumeric = values.every((v) => {
      if (typeof v === "number") {
        return true;
      }
      if (typeof v === "string") {
        const trimmedValue = v.trim();
        const parsedValue = parseFloat(trimmedValue);
        return !isNaN(parsedValue) && !isNaN(Number(trimmedValue));
      }
      return false;
    });

    if (isColumnNumeric) {
      const numericValues = values.map((v) =>
        typeof v === "number" ? v : parseFloat(v as string)
      );

      const correlation = computePearsonCorrelation(
        cosineSimilarities,
        numericValues
      );

      const n = numericValues.length; 
      const tStatistic =
        correlation * Math.sqrt((n - 2) / (1 - correlation ** 2));
      const degreesOfFreedom = n - 2;

      const pValue = computePValueFromTStatistic(tStatistic, degreesOfFreedom);

      correlations.push({ column: key, correlation, pValue });
    } else {
    }
  }

  // Sort by absolute correlation and return the top 5
  const sortedCorrelations = correlations
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 5);

  return sortedCorrelations;
};

const computePValueFromTStatistic = (
  t: number,
  degreesOfFreedom: number
): number => {
  const p = 2 * (1 - jstat.studentt.cdf(Math.abs(t), degreesOfFreedom));
  return p;
};
