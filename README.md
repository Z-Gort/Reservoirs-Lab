# Vector Visualizer: Postgres VectorDB GUI and Data Insights 🐘✨

## Overview
Vector Visualizer is a lightweight Electron app designed to connect directly to a Postgres database and visualize high-dimensional vector embeddings stored alongside structured data. It allows users to explore their data interactively and see correlations between metadata and semantic similarity of vector embeddings.

## Features
- **Postgres Integration**: Connect directly to your Postgres database via a connection string. 🛠️
- **Vector Visualization**: Plot and explore high-dimensional vectors interactively. 📊
- **Neighborhood Exploration**: Click on a data point to view points in cosine similarity from point (while original clustering). 🔍
- **Lightweight and Local**: Runs locally on your machine, keeping your data private. 🖥️


## Installation

### Prerequisites
- Node.js and npm installed on your machine.

### Running the App Locally
1. Clone this repository:
   ```bash
   [git clone https://github.com/yourusername/vector-visualizer.git](https://github.com/Z-Gort/Reservoirs-Lab.git)
   ```
2. Navigate to the project directory:
   ```bash
   cd reservoirs-lab
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm run dev 
   ```

## Usage
1. **Connect to Your Database**:
   - Enter your Postgres database connection string in the app's connection window.
2. **Visualize Vectors**:
   - View an interactive plot of your vector data.
   - Zoom in, pan, and filter data based on metadata columns.
3. **Explore Neighborhoods**:
   - Click on a point to view similar data points and their associated metadata.
4. **Filter and Query**:
   - Use metadata filters to explore correlations and relationships within your data.

![res-labs-gif](https://github.com/user-attachments/assets/6efe0ff6-9dba-4254-b5eb-79e2a742448a)

