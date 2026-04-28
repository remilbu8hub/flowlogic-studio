import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AppModeProvider } from "./state/appModeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppModeProvider>
      <App />
    </AppModeProvider>
  </StrictMode>,
);
