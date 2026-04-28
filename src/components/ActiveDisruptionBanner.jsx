// src/components/ActiveDisruptionBanner.jsx

import { buttonStyle } from "./formatters";

export default function ActiveDisruptionBanner({ activeCard, onClear }) {
  if (!activeCard) return null;

  return (
    <div
      style={{
        border: `2px solid ${activeCard.accent || "#57606a"}`,
        borderRadius: 14,
        background: "#ffffff",
        padding: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.05em",
            color: activeCard.accent || "#57606a",
            marginBottom: 6,
          }}
        >
          ACTIVE DISRUPTION
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#1f2328",
            marginBottom: 6,
          }}
        >
          {activeCard.title}
        </div>

        <div
          style={{
            color: "#57606a",
            lineHeight: 1.45,
            maxWidth: 760,
          }}
        >
          {activeCard.description}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        style={buttonStyle()}
      >
        Clear Active Disruption
      </button>
    </div>
  );
}