# Reservoirs Lab: Postgres VectorDB GUI and Data Insights 🐘✨

## Overview
Reservoirs lab is a lightweight Electron app designed to connect directly to a Postgres database and visualize high-dimensional vector embeddings stored alongside structured data. It allows users to explore their data interactively and see correlations between metadata and semantic similarity of vector embeddings.

## Features
- **Postgres Integration**: Connect directly to your Postgres database via a connection string. 🛠️
- **Vector Visualization**: Plot and explore high-dimensional vectors interactively. 📊
- **Neighborhood Exploration**: Click on a data point to view points by cosine similarity from point (while maintaining clustering). 🔍
- **Lightweight and Local**: Runs locally on your machine, keeping your data private. 🖥️


## Installation

### Prerequisites
- Node.js and npm installed on your machine.

### Running the App Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/z-gort/reservoirs-lab.git
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
3. **Explore Neighborhoods**:
   - Click on a point to view data points by similarity and metadata correlated with semantic similarity to a point.

![res-labs-gif](https://github.com/user-attachments/assets/6efe0ff6-9dba-4254-b5eb-79e2a742448a)

