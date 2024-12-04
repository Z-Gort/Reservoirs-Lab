import sys
import numpy as np
import umap
import json

def cosine_distance(vectors, center_point):
    """Calculate cosine distances from the center_point."""
    dot_products = np.dot(vectors, center_point)
    magnitudes = np.linalg.norm(vectors, axis=1) * np.linalg.norm(center_point)
    return 1 - (dot_products / magnitudes)

def calculate_weights(distances):
    """Convert distances into weights."""
    return 1 / (1 + distances)

def normalize_embeddings(embeddings, center_index):
    """Normalize embeddings to center the center_point at (0, 0)."""
    center_embedding = embeddings[center_index]
    return embeddings - center_embedding

def main():
    temp_file_path = sys.argv[1]
    center_point = np.array([float(x) for x in sys.argv[2].split(',')])
    
    # Read vectors from file
    with open(temp_file_path, 'r') as f:
        serialized_vectors = f.read()

    vectors = np.array([list(map(float, row.split(','))) for row in serialized_vectors.split(';')])

    # Compute cosine distances and weights
    distances = cosine_distance(vectors, center_point)
    weights = calculate_weights(distances)

    # Apply weights to the vectors
    weighted_vectors = vectors * weights[:, np.newaxis]

    # Find the index of the center_point
    center_index = np.argmin(distances)  # Closest point to center_point

    # Perform dimensionality reduction with UMAP
    reducer = umap.UMAP(n_components=2, random_state=42, metric="cosine")
    embeddings = reducer.fit_transform(weighted_vectors)

    # Normalize embeddings relative to the center_point
    normalized_embeddings = normalize_embeddings(embeddings, center_index)

    # Output the normalized embeddings
    print(json.dumps(normalized_embeddings.tolist()))

if __name__ == "__main__":
    main()