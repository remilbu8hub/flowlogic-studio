// src/components/MetricCards.jsx

import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { cardStyle, money, num, riskColor } from "../ui/formatters";

function MetricCard({ label, value, subtext, valueColor = THEME.colors.textPrimary }) {
  return (
    <div style={cardStyle()}>
      <div
        style={{
          fontSize: scaleNum(13),
          color: THEME.colors.textMuted,
          marginBottom: scaleNum(6),
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: scaleNum(30),
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {subtext ? (
        <div
          style={{
            marginTop: scaleNum(8),
            fontSize: scaleNum(13),
            color: THEME.colors.textMuted,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

export default function MetricCards({ result, layoutTier = "medium" }) {
  const columns =
    layoutTier === "large"
      ? "repeat(5, minmax(0, 1fr))"
      : layoutTier === "medium"
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(2, minmax(0, 1fr))";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: scaleNum(14),
        marginBottom: scaleNum(8),
        minWidth: 0,
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
