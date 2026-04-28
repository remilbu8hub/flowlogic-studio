// src/components/DisruptionDeck.jsx

import { THEME } from "../config/theme";
import DisruptionCard from "./DisruptionCard";
import { buttonStyle, cardStyle } from "./formatters";

export default function DisruptionDeck({
  drawPile = [],
  discardPile = [],
  activeCard = null,
  onDraw,
  onReset,
}) {
  const top = discardPile.length ? discardPile[discardPile.length - 1] : null;

  return (
    <div
      style={{
        ...cardStyle(),
        alignSelf: "start",
        display: "grid",
        gap: 16,
        width: "100%",
        maxWidth: 320,
        minWidth: 0,
      }}
    >
      <div>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Disruption Lab</h2>
        <div style={{ color: THEME.colors.textMuted, lineHeight: 1.5 }}>
          Draw a scenario shock to test how resilient the current supply chain really is.
          The top card in the discard pile is the active disruption affecting the model.
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: THEME.colors.textMuted,
          background: THEME.colors.background,
          border: `1px solid ${THEME.colors.border}`,
          borderRadius: 10,
          padding: "10px 12px",
          lineHeight: 1.45,
        }}
      >
        <div>
          Cards remaining in draw pile: <b>{drawPile.length}</b>
        </div>
        <div style={{ marginTop: 4 }}>
          Active card: <b>{activeCard?.title ?? "None"}</b>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: THEME.colors.textMuted,
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          DRAW PILE
        </div>
        <DisruptionCard isBack accent={THEME.colors.primary} onClick={onDraw} />
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: THEME.colors.textMuted,
            letterSpacing: "0.04em",
            marginBottom: 8,
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
              borderRadius: 18,
              minHeight: 260,
              background: THEME.colors.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: THEME.colors.textMuted,
              padding: 20,
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

      <div style={{ display: "grid", gap: 8 }}>
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
