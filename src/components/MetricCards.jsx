// src/components/MetricCards.jsx

import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { cardStyle, money, num, riskColor } from "../ui/formatters";

function MetricCard({
  label,
  value,
  subtext,
  valueColor = THEME.colors.textPrimary,
  isSelectedKpi = false,
}) {
  return (
    <div
      style={{
        ...cardStyle(),
        border: `1px solid ${isSelectedKpi ? THEME.colors.primary : THEME.colors.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: scaleNum(8),
          marginBottom: scaleNum(6),
        }}
      >
        <div
          style={{
            fontSize: scaleNum(13),
            color: THEME.colors.textMuted,
          }}
        >
          {label}
        </div>
        {isSelectedKpi ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
              borderRadius: 999,
              background: THEME.colors.surfaceRow ?? THEME.colors.background,
              color: THEME.colors.primary,
              fontSize: scaleNum(11),
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Selected KPI
          </span>
        ) : null}
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

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: scaleNum(13),
        fontWeight: 700,
        color: THEME.colors.textMuted,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

export default function MetricCards({
  result,
  layoutTier = "medium",
  isBusinessMode = false,
  selectedKpis = [],
  serviceLevel = 0.95,
}) {
  const columns =
    layoutTier === "large"
      ? "repeat(5, minmax(0, 1fr))"
      : layoutTier === "medium"
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(2, minmax(0, 1fr))";

  const cards = [
    {
      id: "totalCost",
      label: "Total Supply Chain Cost",
      value: money(result?.totalSupplyChainCost),
      subtext:
        result?.totalLaneTransportCost != null
          ? `Inventory + node cost + ${money(result.totalLaneTransportCost)} lane transport proxy`
          : "Inventory carrying cost + node added cost",
    },
    {
      id: "inventoryCost",
      label: "Total Inventory Cost",
      value: money(result?.totalInventory),
      subtext: "Safety stock + pipeline inventory",
    },
    {
      id: "transportCost",
      label: "Lane Transport Cost",
      value: money(result?.totalLaneTransportCost),
      subtext:
        result?.laneTransportCostModel === "proxy"
          ? "Current transport proxy across all lanes"
          : "Current transport cost across all lanes",
    },
    {
      id: "serviceLevel",
      label: "Service Level Target",
      value: `${num(serviceLevel * 100, 0)}%`,
      subtext: "Current service objective used in the simulation",
    },
    {
      id: "responseTime",
      label: "Total Response Time",
      value: `${num(result?.totalResponseTime, 1)} days`,
      subtext: "Approximate customer-facing delay",
    },
    {
      id: "aggregateRisk",
      label: "Aggregate Risk",
      value: result?.aggregateRiskLabel ?? "N/A",
      valueColor: riskColor(result?.aggregateRiskLabel),
      subtext: `Score: ${num(result?.aggregateRiskScore, 2)}`,
    },
    {
      id: "highestRiskNode",
      label: "Highest Risk Node",
      value: result?.maxRiskNode?.name ?? "N/A",
      valueColor: riskColor(result?.maxRiskNode?.label),
      subtext:
        result?.maxRiskNode?.score != null
          ? `${result.maxRiskNode.label} (${num(result.maxRiskNode.score, 2)})`
          : "No result yet",
    },
  ];

  const selectedBusinessCards = cards.filter((card) => selectedKpis.includes(card.id));
  const supportingBusinessCards = cards.filter((card) => !selectedKpis.includes(card.id));

  function renderGrid(metricCards, emphasizedIds = []) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns,
          gap: scaleNum(14),
          minWidth: 0,
        }}
      >
        {metricCards.map((card) => (
          <MetricCard
            key={card.id}
            label={card.label}
            value={card.value}
            subtext={card.subtext}
            valueColor={card.valueColor}
            isSelectedKpi={emphasizedIds.includes(card.id)}
          />
        ))}
      </div>
    );
  }

  if (isBusinessMode) {
    return (
      <div
        style={{
          display: "grid",
          gap: scaleNum(14),
          marginBottom: scaleNum(8),
          minWidth: 0,
        }}
      >
        <div style={{ display: "grid", gap: scaleNum(8), minWidth: 0 }}>
          <SectionLabel>Decision KPIs</SectionLabel>
          {renderGrid(selectedBusinessCards, selectedKpis)}
        </div>

        {supportingBusinessCards.length > 0 ? (
          <div style={{ display: "grid", gap: scaleNum(8), minWidth: 0 }}>
            <SectionLabel>Supporting Metrics</SectionLabel>
            {renderGrid(supportingBusinessCards)}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: scaleNum(8), minWidth: 0 }}>
      {renderGrid(cards)}
    </div>
  );
}
