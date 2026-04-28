// src/components/MetricCards.jsx

import { THEME } from "../config/theme";
import { cardStyle, money, num, riskColor } from "./formatters";

function MetricCard({ label, value, subtext, valueColor = THEME.colors.textPrimary }) {
  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 13, color: THEME.colors.textMuted, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtext ? (
        <div style={{ marginTop: 8, fontSize: 13, color: THEME.colors.textMuted }}>
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

export default function MetricCards({ result }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        marginBottom: 8,
      }}
    >
      <MetricCard
        label="Total Supply Chain Cost"
        value={money(result?.totalSupplyChainCost)}
        subtext={
          result?.totalLaneTransportCost != null
            ? `Inventory + node cost + ${money(result.totalLaneTransportCost)} lane transport proxy`
            : "Inventory carrying cost + node added cost"
        }
      />

      <MetricCard
        label="Total Inventory Cost"
        value={money(result?.totalInventory)}
        subtext="Safety stock + pipeline inventory"
      />

      <MetricCard
        label="Total Response Time"
        value={`${num(result?.totalResponseTime, 1)} days`}
        subtext="Approximate customer-facing delay"
      />

      <MetricCard
        label="Aggregate Risk"
        value={result?.aggregateRiskLabel ?? "N/A"}
        valueColor={riskColor(result?.aggregateRiskLabel)}
        subtext={`Score: ${num(result?.aggregateRiskScore, 2)}`}
      />

      <MetricCard
        label="Highest Risk Node"
        value={result?.maxRiskNode?.name ?? "N/A"}
        valueColor={riskColor(result?.maxRiskNode?.label)}
        subtext={
          result?.maxRiskNode?.score != null
            ? `${result.maxRiskNode.label} (${num(result.maxRiskNode.score, 2)})`
            : "No result yet"
        }
      />
    </div>
  );
}
