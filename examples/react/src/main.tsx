import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "../../shared/style.css";

const root = document.getElementById("app");
if (!root) throw new Error("App element missing");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
