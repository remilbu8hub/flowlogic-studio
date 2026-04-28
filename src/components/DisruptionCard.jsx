// src/components/DisruptionCard.jsx

export default function DisruptionCard({
  title,
  category,
  description,
  accent = "#57606a",
  isBack = false,
  onClick,
}) {
  if (isBack) {
    return (
      <button
        onClick={onClick}
        type="button"
        style={{
          width: "100%",
          minHeight: 260,
          borderRadius: 18,
          padding: 20,
          background: `linear-gradient(135deg, ${accent} 0%, #1f2328 100%)`,
          color: "#fff",
          cursor: "pointer",
          border: "2px solid rgba(255,255,255,0.18)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              opacity: 0.9,
              marginBottom: 14,
            }}
          >
            DISRUPTION DECK
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Draw Card
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.45,
              opacity: 0.95,
              maxWidth: 220,
            }}
          >
            Reveal the next disruption and stress test the current supply chain.
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            opacity: 0.95,
          }}
        >
          Click to activate
        </div>
      </button>
    );
  }

  return (
    <div
      style={{
        border: `3px solid ${accent}`,
        borderRadius: 18,
        minHeight: 260,
        background: "#ffffff",
        padding: 20,
        boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.04em",
            color: accent,
            background: `${accent}16`,
            borderRadius: 999,
            padding: "6px 10px",
            marginBottom: 14,
          }}
        >
          {category}
        </div>

        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 14,
            color: "#1f2328",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#57606a",
            lineHeight: 1.5,
            fontSize: 15,
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 12,
          fontWeight: 700,
          color: accent,
        }}
      >
        Active disruption
      </div>
    </div>
  );
}