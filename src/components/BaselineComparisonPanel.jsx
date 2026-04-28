// src/components/BaselineComparisonPanel.jsx

import { buttonStyle, cardStyle, money, num } from "./formatters";

function metricTone(delta, invert = false) {
  if (Math.abs(delta) < 0.0001) {
    return {
      bg: "#f6f8fa",
      border: "#d0d7de",
      text: "#57606a",
      deltaPrefix: "±",
    };
  }

  const good = invert ? delta > 0 : delta < 0;

  if (good) {
    return {
      bg: "#edf7ed",
      border: "#b7dfb9",
      text: "#1a7f37",
      deltaPrefix: "▼",
    };
  }

  return {
    bg: "#fff1f0",
    border: "#f3c1bc",
    text: "#cf222e",
    deltaPrefix: "▲",
  };
}

function compareBlock({ label, current, baseline, delta, format, invert = false }) {
  const tone = metricTone(delta, invert);

  return (
    <div
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 12,
        padding: 12,
        background: tone.bg,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 12, color: "#57606a", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05, color: "#1f2328" }}>
        {format(current)}
      </div>
      <div style={{ fontSize: 12, color: "#57606a", marginTop: 4 }}>
        Baseline: {format(baseline)}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: tone.text,
          marginTop: 8,
        }}
      >
        {tone.deltaPrefix} {format(Math.abs(delta))}
      </div>
    </div>
  );
}

export default function BaselineComparisonPanel({ current, baseline, onPinBaseline }) {
  if (!current) return null;

  const panelStyle = {
    ...cardStyle(),
    background: "#fcfaf7",
    border: "1px solid #e8dfd1",
  };

  if (!baseline) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Baseline Comparison</h2>
            <div style={{ color: "#57606a", marginTop: 6 }}>
              Save the current design as a benchmark, then compare future changes against it.
            </div>
          </div>

          <button type="button" onClick={onPinBaseline} style={buttonStyle("primary")}>
            Save Current as Baseline
          </button>
        </div>
      </div>
    );
  }

  const deltaCost = Number(current.totalSupplyChainCost || 0) - Number(baseline.totalSupplyChainCost || 0);
  const deltaInventory = Number(current.totalInventory || 0) - Number(baseline.totalInventory || 0);
  const deltaResponse = Number(current.totalResponseTime || 0) - Number(baseline.totalResponseTime || 0);
  const deltaRisk = Number(current.aggregateRiskScore || 0) - Number(baseline.aggregateRiskScore || 0);

  const overallScore =
    (deltaCost <= 0 ? 1 : -1) +
    (deltaInventory <= 0 ? 1 : -1) +
    (deltaResponse <= 0 ? 1 : -1) +
    (deltaRisk <= 0 ? 1 : -1);

  const overallLabel =
    overallScore >= 3
      ? "Better"
      : overallScore <= -3
        ? "Worse"
        : "Mixed";

  const overallTone =
    overallLabel === "Better"
      ? { bg: "#edf7ed", color: "#1a7f37", border: "#b7dfb9" }
      : overallLabel === "Worse"
        ? { bg: "#fff1f0", color: "#cf222e", border: "#f3c1bc" }
        : { bg: "#f6f8fa", color: "#57606a", border: "#d0d7de" };

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Baseline Comparison</h2>
          <div style={{ color: "#57606a", marginTop: 6 }}>
            Quick read on whether the current design improved the network.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              border: `1px solid ${overallTone.border}`,
              background: overallTone.bg,
              color: overallTone.color,
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.03em",
            }}
          >
            Overall Impact: {overallLabel}
          </div>

          <button type="button" onClick={onPinBaseline} style={buttonStyle()}>
            Replace Baseline
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {compareBlock({
          label: "Total supply chain cost",
          current: current.totalSupplyChainCost,
          baseline: baseline.totalSupplyChainCost,
          delta: deltaCost,
          format: money,
          invert: false,
        })}

        {compareBlock({
          label: "Total inventory",
          current: current.totalInventory,
          baseline: baseline.totalInventory,
          delta: deltaInventory,
          format: money,
          invert: false,
        })}

        {compareBlock({
          label: "Response time",
          current: current.totalResponseTime,
          baseline: baseline.totalResponseTime,
          delta: deltaResponse,
          format: (value) => `${num(value, 1)} days`,
          invert: false,
        })}

        {compareBlock({
          label: "Aggregate risk",
          current: current.aggregateRiskScore,
          baseline: baseline.aggregateRiskScore,
          delta: deltaRisk,
          format: (value) => `${num(value, 2)} (${value < 1.67 ? "Low" : value < 2.34 ? "Medium" : "High"})`,
          invert: false,
        })}
      </div>
    </div>
  );
}