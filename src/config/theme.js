const BASE_RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

const BASE_SHADOW = {
  card: "0 1px 2px rgba(0,0,0,0.05)",
  focus: "0 0 0 4px rgba(37,99,235,0.12)",
};

export const THEME_PALETTES = {
  professional: {
    id: "professional",
    label: "Professional Neutral",
    colors: {
      background: "#E9EEF3",
      surface: "#FFFFFF",
      surfacePanel: "#F8FAFC",
      surfaceRow: "#EEF2F7",
      hover: "#E2E8F0",
      primary: "#2563EB",
      secondary: "#64748B",
      textPrimary: "#0F172A",
      textMuted: "#6B7280",
      border: "#D1D9E0",
      success: "#16A34A",
      warning: "#D97706",
      danger: "#DC2626",
      transport: {
        truck: "#16A34A",
        air: "#DC2626",
        ship: "#2563EB",
      },
    },
  },
  dark: {
    id: "dark",
    label: "Dark",
    colors: {
      background: "#0B1220",
      surface: "#111827",
      surfacePanel: "#1F2937",
      surfaceRow: "#273449",
      hover: "#334155",
      primary: "#7CB3FF",
      secondary: "#9CA3AF",
      textPrimary: "#E5E7EB",
      textMuted: "#6B7280",
      border: "#374151",
      success: "#22C55E",
      warning: "#F59E0B",
      danger: "#F87171",
      transport: {
        truck: "#22C55E",
        air: "#F87171",
        ship: "#7CB3FF",
      },
    },
  },
  forest: {
    id: "forest",
    label: "Forest",
    colors: {
      background: "#E8F0EA",
      surface: "#FDFEFC",
      surfacePanel: "#F4F8F4",
      surfaceRow: "#E4EEE7",
      hover: "#D4E3D8",
      primary: "#2F6B4F",
      secondary: "#5F7A67",
      textPrimary: "#173225",
      textMuted: "#617368",
      border: "#C7D8CD",
      success: "#2F855A",
      warning: "#B7791F",
      danger: "#C53030",
      transport: {
        truck: "#2F855A",
        air: "#C53030",
        ship: "#2B6CB0",
      },
    },
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    colors: {
      background: "#FFF1EB",
      surface: "#FFFDFB",
      surfacePanel: "#FFF5EF",
      surfaceRow: "#F8E5DB",
      hover: "#F1CBBF",
      primary: "#C2410C",
      secondary: "#9A6B5A",
      textPrimary: "#431407",
      textMuted: "#7C5E57",
      border: "#F1CBBF",
      success: "#15803D",
      warning: "#D97706",
      danger: "#DC2626",
      transport: {
        truck: "#15803D",
        air: "#DC2626",
        ship: "#C2410C",
      },
    },
  },
  mono: {
    id: "mono",
    label: "Mono",
    colors: {
      background: "#E5E7EB",
      surface: "#FFFFFF",
      surfacePanel: "#F3F4F6",
      surfaceRow: "#E5E7EB",
      hover: "#D1D5DB",
      primary: "#111827",
      secondary: "#4B5563",
      textPrimary: "#111827",
      textMuted: "#6B7280",
      border: "#9CA3AF",
      success: "#15803D",
      warning: "#C87900",
      danger: "#B91C1C",
      transport: {
        truck: "#374151",
        air: "#B91C1C",
        ship: "#6B7280",
      },
    },
  },
  atelier: {
    id: "atelier",
    label: "Atelier",
    colors: {
      background: "#EFE7DA",
      surface: "#FFFAF3",
      surfacePanel: "#F7EFE4",
      surfaceRow: "#EBDCCB",
      hover: "#D8C7B5",
      primary: "#B45309",
      secondary: "#6B7280",
      textPrimary: "#1C1917",
      textMuted: "#6F5E53",
      border: "#D8C7B5",
      success: "#3F7D58",
      warning: "#C87900",
      danger: "#B91C1C",
      transport: {
        truck: "#3F7D58",
        air: "#B91C1C",
        ship: "#2563EB",
      },
    },
  },
};

export const DEFAULT_THEME_PALETTE = "professional";
export const THEME_STORAGE_KEY = "flowlogic-studio-theme";

function cloneTransportColors(transport = {}) {
  return {
    truck: transport.truck,
    air: transport.air,
    ship: transport.ship,
  };
}

function paletteToTheme(palette) {
  return {
    colors: {
      ...palette.colors,
      transport: cloneTransportColors(palette.colors.transport),
    },
    radius: { ...BASE_RADIUS },
    shadow: { ...BASE_SHADOW },
  };
}

const initialTheme = paletteToTheme(THEME_PALETTES[DEFAULT_THEME_PALETTE]);

export const THEME = {
  colors: { ...initialTheme.colors, transport: cloneTransportColors(initialTheme.colors.transport) },
  radius: { ...initialTheme.radius },
  shadow: { ...initialTheme.shadow },
};

export function getThemePalette(paletteId) {
  return THEME_PALETTES[paletteId] ?? THEME_PALETTES[DEFAULT_THEME_PALETTE];
}

export function getThemePaletteEntries() {
  return Object.values(THEME_PALETTES);
}

export function applyThemePalette(paletteId) {
  const palette = getThemePalette(paletteId);
  const nextTheme = paletteToTheme(palette);

  Object.assign(THEME.colors, nextTheme.colors);
  THEME.colors.transport = cloneTransportColors(nextTheme.colors.transport);
  Object.assign(THEME.radius, nextTheme.radius);
  Object.assign(THEME.shadow, nextTheme.shadow);

  return palette.id;
}
