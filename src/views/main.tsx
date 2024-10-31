import React from "react";
import ReactDOM from "react-dom/client";
import App from "../components/App";
import { ToastProvider } from "../components/ToastContext";
import '../../node_modules/react-grid-layout/css/styles.css';
import '../../node_modules/react-grid-layout/css/styles.css';
import { ThemeProvider } from '../themes/ThemeContext'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
