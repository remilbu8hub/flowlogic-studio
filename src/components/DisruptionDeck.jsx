// src/components/DisruptionDeck.jsx

import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import DisruptionCard from "./DisruptionCard";
import { buttonStyle, cardStyle } from "../ui/formatters";

export default function DisruptionDeck({
  drawPile = [],
  discardPile = [],
  activeCard = null,
  onDraw,
  onReset,
  layoutTier = "medium",
}) {
  const top = discardPile.length ? discardPile[discardPile.length - 1] : null;
  const maxWidth =
    layoutTier === "large" ? 360 : layoutTier === "medium" ? 300 : "100%";

  return (
    <div
      style={{
        ...cardStyle(),
        alignSelf: "start",
        display: "grid",
        gap: scaleNum(16),
        width: "100%",
        maxWidth,
        minWidth: 0,
      }}
    >
      <div>
        <h2 style={{ marginTop: 0, marginBottom: scaleNum(6) }}>Disruption Lab</h2>
        <div style={{ color: THEME.colors.textMuted, lineHeight: 1.5 }}>
          Draw a scenario shock to test how resilient the current supply chain really is.
          The top card in the discard pile is the active disruption affecting the model.
        </div>
      </div>

      <div
        style={{
          fontSize: scaleNum(13),
          color: THEME.colors.textMuted,
          background: THEME.colors.background,
          border: `1px solid ${THEME.colors.border}`,
          borderRadius: scaleNum(10),
          padding: `${scaleNum(10)}px ${scaleNum(12)}px`,
          lineHeight: 1.45,
        }}
      >
        <div>
          Cards remaining in draw pile: <b>{drawPile.length}</b>
        </div>
        <div style={{ marginTop: scaleNum(4) }}>
          Active card: <b>{activeCard?.title ?? "None"}</b>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: scaleNum(12),
            fontWeight: 800,
            color: THEME.colors.textMuted,
            letterSpacing: "0.04em",
            marginBottom: scaleNum(8),
          }}
        >
          DRAW PILE
        </div>
        <DisruptionCard isBack accent={THEME.colors.primary} onClick={onDraw} />
      </div>

      <div>
        <div
          style={{
            fontSize: scaleNum(12),
            fontWeight: 800,
            color: THEME.colors.textMuted,
            letterSpacing: "0.04em",
            marginBottom: scaleNum(8),
          }}
        >
          ACTIVE DISRUPTION
        </div>
        {top ? (
          <DisruptionCard
            title={top.title}
            category={top.category}
            description={top.description}
            accent={top.accent}
          />
        ) : (
          <div
            style={{
              border: `2px dashed ${THEME.colors.border}`,
              borderRadius: scaleNum(18),
              minHeight: scaleNum(260),
              background: THEME.colors.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: THEME.colors.textMuted,
              padding: scaleNum(20),
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            No active disruption.
            <br />
            Draw a card to stress test the network.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: scaleNum(8) }}>
        <button type="button" onClick={onDraw} style={buttonStyle("primary")}>
          Draw Next Disruption
        </button>

        <button type="button" onClick={onReset} style={buttonStyle()}>
          Reset Deck
        </button>
      </div>
    </div>
  );
}
