// src/components/LeaderboardModal.jsx

import ModalShell from "../../ui/ModalShell";

function money(x) {
  return Number(x || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function num(x, digits = 2) {
  return Number(x || 0).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function riskColor(label) {
  const s = String(label || "").toLowerCase();
  if (s === "low") return "#1b5e20";
  if (s === "medium") return "#8a6d00";
  if (s === "high") return "#b71c1c";
  return "#333";
}

function sectionCardStyle() {
  return {
    border: "1px solid #d0d7de",
    borderRadius: 12,
    padding: 16,
    background: "#ffffff",
    marginBottom: 16,
  };
}

function tableStyle() {
  return {
    width: "100%",
    borderCollapse: "collapse",
    background: "#ffffff",
  };
}

function thStyle() {
  return {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #d8dee4",
    background: "#f6f8fa",
    fontSize: 13,
    color: "#57606a",
    whiteSpace: "nowrap",
  };
}

function tdStyle() {
  return {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f6",
    verticalAlign: "middle",
  };
}

function actionButtonStyle(variant = "default") {
  const base = {
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid #d0d7de",
    background: "#ffffff",
    color: "#1f2328",
  };

  if (variant === "primary") {
    return {
      ...base,
      background: "#0969da",
      color: "#ffffff",
      border: "1px solid #0969da",
    };
  }

  if (variant === "danger") {
    return {
      ...base,
      background: "#cf222e",
      color: "#ffffff",
      border: "1px solid #cf222e",
    };
  }

  return base;
}

function formatSavedAt(isoString) {
  if (!isoString) return "Unknown time";

  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "Unknown time";

  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function bestValue(entries, accessor, direction = "min") {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const numericValues = entries
    .map(accessor)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (numericValues.length === 0) return null;

  return direction === "max"
    ? Math.max(...numericValues)
    : Math.min(...numericValues);
}

function SummaryCard({ label, value, subtext, valueColor = "#1f2328" }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 12,
        padding: 14,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 13, color: "#57606a", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtext ? (
        <div style={{ marginTop: 6, fontSize: 13, color: "#57606a" }}>
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  leaderboardEntries,
  onClearLeaderboard,
}) {
  const entries = Array.isArray(leaderboardEntries) ? leaderboardEntries : [];

  const bestCost = bestValue(entries, (entry) => entry.totalSupplyChainCost, "min");
  const bestResponse = bestValue(entries, (entry) => entry.totalResponseTime, "min");
  const bestRisk = bestValue(entries, (entry) => entry.aggregateRiskScore, "min");
  const highestScore = entries.length;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Leaderboard"
      subtitle="Save notable supply chain designs here so you can compare whether you are improving cost, responsiveness, and resilience over time."
      size="xl"
    >
      <div style={sectionCardStyle()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Saved Iterations</h3>
            <div style={{ color: "#57606a" }}>
              {entries.length === 0
                ? "No runs saved yet."
                : `${entries.length} saved run${entries.length === 1 ? "" : "s"} available for comparison.`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClearLeaderboard}
              style={actionButtonStyle("danger")}
              disabled={entries.length === 0}
            >
              Clear Leaderboard
            </button>

            <button type="button" onClick={onClose} style={actionButtonStyle("primary")}>
              Done
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <SummaryCard
            label="Saved Runs"
            value={String(highestScore)}
            subtext="Total comparison points available"
          />

          <SummaryCard
            label="Best Total Cost"
            value={bestCost != null ? money(bestCost) : "N/A"}
            subtext="Lower is better"
          />

          <SummaryCard
            label="Best Response Time"
            value={bestResponse != null ? `${num(bestResponse, 1)} days` : "N/A"}
            subtext="Lower is better"
          />

          <SummaryCard
            label="Best Aggregate Risk"
            value={bestRisk != null ? num(bestRisk, 2) : "N/A"}
            subtext="Lower is better"
            valueColor={bestRisk != null ? riskColor(bestRisk < 1.67 ? "low" : bestRisk < 2.34 ? "medium" : "high") : "#1f2328"}
          />
        </div>
      </div>

      <div style={sectionCardStyle()}>
        <h3 style={{ marginTop: 0 }}>Detailed Results</h3>

        {entries.length === 0 ? (
          <div style={{ color: "#57606a" }}>
            Nothing saved yet. Once the main dashboard wires in save-to-leaderboard,
            each saved design will show up here for side-by-side review.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle()}>
              <thead>
                <tr>
                  <th style={thStyle()}>Saved</th>
                  <th style={thStyle()}>Name</th>
                  <th style={thStyle()}>Total Cost</th>
                  <th style={thStyle()}>Inventory Cost</th>
                  <th style={thStyle()}>Response Time</th>
                  <th style={thStyle()}>Aggregate Risk</th>
                  <th style={thStyle()}>Risk Label</th>
                  <th style={thStyle()}>Highest Risk Node</th>
                  <th style={thStyle()}>Nodes</th>
                  <th style={thStyle()}>Edges</th>
                  <th style={thStyle()}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={tdStyle()}>{formatSavedAt(entry.savedAt)}</td>
                    <td style={tdStyle()}>{entry.name || "Untitled run"}</td>
                    <td style={tdStyle()}>{money(entry.totalSupplyChainCost)}</td>
                    <td style={tdStyle()}>{money(entry.totalInventory)}</td>
                    <td style={tdStyle()}>{num(entry.totalResponseTime, 1)} days</td>
                    <td style={tdStyle()}>{num(entry.aggregateRiskScore, 2)}</td>
                    <td
                      style={{
                        ...tdStyle(),
                        color: riskColor(entry.aggregateRiskLabel),
                        fontWeight: 700,
                      }}
                    >
                      {entry.aggregateRiskLabel || "N/A"}
                    </td>
                    <td style={tdStyle()}>
                      {entry.maxRiskNodeName || entry.maxRiskNode?.name || "N/A"}
                    </td>
                    <td style={tdStyle()}>{entry.nodeCount ?? "—"}</td>
                    <td style={tdStyle()}>{entry.edgeCount ?? "—"}</td>
                    <td style={tdStyle()}>{entry.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
