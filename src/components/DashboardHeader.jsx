// src/components/DashboardHeader.jsx

import { THEME } from "../config/theme";

function topButtonStyle(variant = "default") {
  const base = {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.md,
    padding: "10px 14px",
    fontSize: 14,
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
    padding: "8px 12px",
    fontSize: 14,
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
  showParameters = true,
  onOpenSaveScenario,
  onOpenParameters,
  onOpenLearning,
  onOpenLeaderboard,
  onResetScenario,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        width: "100%",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "clamp(12px, 1.6vw, 20px)",
          flexWrap: "wrap",
          minWidth: 0,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(10px, 1.4vw, 16px)",
            flexWrap: "wrap",
            minWidth: 0,
            flex: "1 1 420px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: THEME.colors.surface,
              border: `1px solid ${THEME.colors.border}`,
              color: THEME.colors.secondary,
              fontSize: 12,
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
              gap: 10,
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

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
            minWidth: 0,
            marginLeft: "auto",
            flex: "0 1 auto",
          }}
        >
          <button
            type="button"
            onClick={onOpenSaveScenario}
            style={topButtonStyle("primary")}
          >
            Save Scenario
          </button>

          {showParameters ? (
            <button type="button" onClick={onOpenParameters} style={topButtonStyle()}>
              Parameters
            </button>
          ) : null}

          <button type="button" onClick={onOpenLearning} style={topButtonStyle()}>
            Learning
          </button>

          <button type="button" onClick={onOpenLeaderboard} style={topButtonStyle()}>
            Leaderboard
          </button>

          <button type="button" onClick={onResetScenario} style={topButtonStyle("danger")}>
            Reset Scenario
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          minWidth: 0,
          paddingTop: 4,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.05,
            color: THEME.colors.textPrimary,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "clamp(15px, 1.6vw, 18px)",
            color: THEME.colors.textMuted,
            maxWidth: 900,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
