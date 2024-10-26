import React from "react";
import ReactDOM from "react-dom/client";
import App from "../components/App";
import { ToastProvider } from "../components/ToastContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);
