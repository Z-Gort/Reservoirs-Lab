import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom"; // Use HashRouter
import "./index.css";
import App from "./App.tsx";
import Popup from "./Popup.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/popup" element={<Popup />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);