import React from "react";
import ReactDOM from "react-dom/client";
import Plot from "../components/Plotter";
import { ToastProvider } from "../components/ToastContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>    
      <Plot />
    </ToastProvider>
  </React.StrictMode>,
);
