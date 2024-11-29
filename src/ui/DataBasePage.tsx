import React from "react";
import { useLocation } from "react-router-dom";
import DatabaseLayout from "./components/DataBaseLayout";

const DatabasePage: React.FC = () => {
  const location = useLocation();

  // Parse connection data from URL query parameters
  const params = new URLSearchParams(location.search);
  const connection = params.get("connection")
    ? JSON.parse(decodeURIComponent(params.get("connection")!)) as DatabaseConnection
    : null;

  if (!connection) {
    return <div>Error: No connection data provided.</div>;
  }

  return <DatabaseLayout connection={connection} />;
};

export default DatabasePage;