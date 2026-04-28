import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AppModeProvider } from "./state/appModeContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppModeProvider>
      <App />
      <Analytics />
      <SpeedInsights />
    </AppModeProvider>
  </StrictMode>
);