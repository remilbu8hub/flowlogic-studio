// src/components/CollapsibleSection.jsx

function cardStyle() {
  return {
    border: "1px solid #d0d7de",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
}

function headerButtonStyle() {
  return {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 0,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
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
        ...cardStyle(),
        marginBottom: defaultMarginBottom,
      }}
    >
      <button type="button" onClick={onToggle} style={headerButtonStyle()}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>{title}</h2>
        <span style={{ fontSize: 28, fontWeight: 700 }}>
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? (
        <div style={{ marginTop: 12 }}>
          {description ? (
            <p style={{ marginTop: 0, color: "#57606a" }}>{description}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}