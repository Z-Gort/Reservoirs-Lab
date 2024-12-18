import { fileURLToPath } from "url";
import { join } from "path";
import path from "path";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { PythonShell } from "python-shell";

// Python helper function for dimensionality reduction
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDimensionalityReduction(
  vectors: string[],
  centerPoint?: string 
): Promise<number[][]> {
  try {
    let parsedCenterPoint: number[] | undefined;
    if (centerPoint) {
      try {
        parsedCenterPoint = JSON.parse(centerPoint);
      } catch (error) {
        console.error("Failed to parse centerPoint:", centerPoint, error);
        throw new Error("Invalid centerPoint format");
      }
    }

    const parsedVectors = vectors.map((vectorString) =>
      JSON.parse(vectorString)
    );
    const scriptPath = parsedCenterPoint
      ? path.join(
          process.cwd(),
          "src/electron/scripts/reduceDimensionWithCenter.py"
        )
      : path.join(process.cwd(), "src/electron/scripts/reduceDimension.py");

    const serializedVectors = parsedVectors
      .map((row) => row.join(","))
      .join(";");

    const tempFilePath = join(tmpdir(), `vectors_${Date.now()}.txt`);
    writeFileSync(tempFilePath, serializedVectors);

    const args = [tempFilePath]; 

    if (parsedCenterPoint) {
      const serializedCenterPoint = parsedCenterPoint.join(",");
      args.push(serializedCenterPoint);
    }

    const results = await new Promise<number[][]>((resolve, reject) => {
      const shell = new PythonShell(scriptPath, {
        args: args,
        pythonPath: "./venv/bin/python3",
        pythonOptions: ["-u"],
      });

      const output: number[][] = [];
      shell.on("message", (message) => {
        output.push(...JSON.parse(message));
      });

      shell.end((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });

    if (!results || results.length === 0) {
      throw new Error("No results returned from the Python script.");
    }

    return results; 
  } catch (err) {
    console.error("Error running dimensionality reduction:", err);
    throw err;
  }
}