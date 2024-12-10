import sys
import numpy as np
import umap
import json
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
log = logging.getLogger()

def main():
    log.info("Script started")

    # Record start time
    start_time = time.time()

    # Checkpoint: Temp file path received
    temp_file_path = sys.argv[1]
    log.info(f"Temp file path received: {temp_file_path}")

    # Checkpoint: Reading the temp file
    with open(temp_file_path, 'r') as f:
        serialized_vectors = f.read()
    log.info("Temp file read successfully")

    # Checkpoint: Parsing vectors
    vectors = np.array([list(map(float, row.split(','))) for row in serialized_vectors.split(';')])
    log.info(f"Vectors parsed successfully: {len(vectors)} rows")

    # Checkpoint: Starting UMAP reduction
    log.info("Starting UMAP dimensionality reduction")
    reducer = umap.UMAP(n_components=2, random_state=42)
    embeddings = reducer.fit_transform(vectors)
    log.info("UMAP dimensionality reduction completed")

    # Checkpoint: Serializing results
    result = json.dumps(embeddings.tolist())
    log.info("Results serialized successfully")

    # Output results
    print(result)
    log.info(f"Script completed in {time.time() - start_time:.2f} seconds")

if __name__ == "__main__":
    main()