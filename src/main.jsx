import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AppModeProvider } from "./state/appModeContext";
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* your app */}
      <Analytics />
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppModeProvider>
      <App />
    </AppModeProvider>
  </StrictMode>,
);
