// src/components/CollapsibleSection.jsx

import { THEME } from "../config/theme";

function shellStyle() {
  return {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.lg,
    background: THEME.colors.surface,
    boxShadow: THEME.shadow.card,
    overflow: "hidden",
  };
}

function headerButtonStyle() {
  return {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    background: THEME.colors.surfacePanel ?? THEME.colors.background,
    border: "none",
    borderBottom: `1px solid ${THEME.colors.border}`,
    cursor: "pointer",
    textAlign: "left",
    color: THEME.colors.textPrimary,
  };
}

export default function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  description,
  defaultMarginBottom = 24,
}) {
  return (
    <div
      style={{
        ...shellStyle(),
        marginBottom: defaultMarginBottom,
      }}
    >
      <button type="button" onClick={onToggle} style={headerButtonStyle()}>
        <h2
          style={{
            margin: 0,
            color: THEME.colors.textPrimary,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: THEME.colors.textMuted,
            lineHeight: 1,
          }}
        >
          {isOpen ? "-" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div
          style={{
            marginTop: 0,
            padding: "14px 16px 16px 16px",
            background: THEME.colors.surfaceRow ?? THEME.colors.surfacePanel,
          }}
        >
          {description ? (
            <p style={{ marginTop: 0, marginBottom: 14, color: THEME.colors.textMuted }}>
              {description}
            </p>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
