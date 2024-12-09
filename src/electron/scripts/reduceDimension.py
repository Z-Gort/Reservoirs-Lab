import sys
import numpy as np
import umap
import json

def main():
    temp_file_path = sys.argv[1]
    
    with open(temp_file_path, 'r') as f:
        serialized_vectors = f.read()
    
    vectors = np.array([list(map(float, row.split(','))) for row in serialized_vectors.split(';')])

    reducer = umap.UMAP(n_components=2, random_state=42)

    embeddings = reducer.fit_transform(vectors)

    print(json.dumps(embeddings.tolist()))


if __name__ == "__main__":
    main()