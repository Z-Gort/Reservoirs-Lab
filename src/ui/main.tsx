import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material"; // Import ThemeProvider and CssBaseline
import theme from "./theme"; // Import your custom theme
import "./index.css";
import App from "./App.tsx";
import Popup from "./Popup.tsx";
import DatabasePage from "./DataBasePage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Adds consistent baseline styles */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/popup" element={<Popup />} />
          <Route path="/database" element={<DatabasePage />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>
);