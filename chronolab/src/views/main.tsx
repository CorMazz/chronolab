import React from "react";
import ReactDOM from "react-dom/client";
import App from "../components/App";
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FluentProvider theme={webLightTheme}>
    <App />
  </FluentProvider>,
);
