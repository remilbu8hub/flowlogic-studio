// src/components/DashboardHeader.jsx

import { THEME } from "../config/theme";
import { scaleClamp, scaleMin, scaleNum } from "../theme/uiScale";

function topButtonStyle(variant = "default") {
  const base = {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.md,
    padding: `${scaleMin(8, 6)}px ${scaleMin(12, 10)}px`,
    fontSize: scaleMin(13, 12),
    fontWeight: 600,
    cursor: "pointer",
    background: THEME.colors.surface,
    color: THEME.colors.textPrimary,
    whiteSpace: "nowrap",
  };

  if (variant === "danger") {
    return {
      ...base,
      background: THEME.colors.danger,
      color: THEME.colors.surface,
      border: `1px solid ${THEME.colors.danger}`,
    };
  }

  if (variant === "primary") {
    return {
      ...base,
      background: THEME.colors.primary,
      color: THEME.colors.surface,
      border: `1px solid ${THEME.colors.primary}`,
    };
  }

  return base;
}

function navButtonStyle(isActive) {
  return {
    border: `1px solid ${isActive ? THEME.colors.primary : THEME.colors.border}`,
    borderRadius: THEME.radius.md,
    padding: `${scaleMin(7, 6)}px ${scaleMin(11, 10)}px`,
    fontSize: scaleMin(13, 12),
    fontWeight: 700,
    cursor: "pointer",
    background: isActive ? THEME.colors.primary : THEME.colors.surface,
    color: isActive ? THEME.colors.surface : THEME.colors.textPrimary,
    whiteSpace: "nowrap",
  };
}

export default function DashboardHeader({
  title = "FlowLogic Studio",
  subtitle = "An interactive supply chain design sandbox for exploring flow, cost, risk, and response time.",
  modeLabel = "Educator",
  currentView = "simulator",
  onChangeView,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: scaleNum(14),
        width: "100%",
        marginBottom: scaleNum(18),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: scaleClamp(12, 1.6, 20),
          flexWrap: "wrap",
          minWidth: 0,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleClamp(10, 1.4, 16),
            flexWrap: "wrap",
            minWidth: 0,
            flex: "1 1 420px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: scaleNum(8),
              padding: `${scaleMin(5, 5)}px ${scaleMin(9, 9)}px`,
              borderRadius: 999,
              background: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.secondary,
              fontSize: scaleMin(11, 11),
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {modeLabel} Mode
          </div>

          <div
            style={{
              display: "flex",
              gap: scaleNum(8),
              flexWrap: "wrap",
              alignItems: "center",
              minWidth: 0,
              flex: "1 1 auto",
            }}
          >
            <button
              type="button"
              onClick={() => onChangeView?.("simulator")}
              style={navButtonStyle(currentView === "simulator")}
            >
              Simulator
            </button>
            <button
              type="button"
              onClick={() => onChangeView?.("about")}
              style={navButtonStyle(currentView === "about")}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => onChangeView?.("support")}
              style={navButtonStyle(currentView === "support")}
            >
              Support
            </button>
          </div>
        </div>

      </div>

      <div
        style={{
          display: "grid",
          gap: scaleNum(10),
          minWidth: 0,
          paddingTop: scaleNum(4),
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: scaleClamp(28, 3.4, 40),
            lineHeight: 1.05,
            color: THEME.colors.textPrimary,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: scaleClamp(14, 1.3, 16),
            color: THEME.colors.textMuted,
            maxWidth: 900,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
