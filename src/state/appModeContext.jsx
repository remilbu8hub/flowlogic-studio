import { createContext, useContext, useMemo, useState } from "react";
import { APP_MODES, DEFAULT_APP_MODE, getAppModeConfig } from "../config/appModes";

const AppModeContext = createContext(null);

export function AppModeProvider({ children }) {
  const [mode, setMode] = useState(DEFAULT_APP_MODE);

  const value = useMemo(() => {
    return {
      mode,
      setMode,
      modeConfig: getAppModeConfig(mode),
      modes: APP_MODES,
    };
  }, [mode]);

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  const context = useContext(AppModeContext);

  if (!context) {
    throw new Error("useAppMode must be used within an AppModeProvider.");
  }

  return context;
}
