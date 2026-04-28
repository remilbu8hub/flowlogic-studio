import { useEffect, useMemo, useRef, useState } from "react";
import { THEME } from "../config/theme";
import { getTransportTypeConfig } from "../config/transportTypes";
import { money } from "../ui/formatters";
import { computeNodeDepths, stageRank } from "../sim/graphHelpers";

const LINE_STYLE = "diagonal";
const CHART_PADDING_LEFT = 76;
const CHART_PADDING_RIGHT = 40;
const CHART_PADDING_TOP = 56;
const CHART_PADDING_BOTTOM = 132;
const GRID_LINE_COUNT = 5;
const MIN_CHART_WIDTH = 720;
const MIN_CHART_HEIGHT = 360;

function safeNum(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function compactMoney(value) {
  const amount = safeNum(value);

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return money(amount);
}

function shortenLabel(label, maxLength = 18) {
  const text = String(label ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function splitLabel(label, maxLineLength = 16) {
  const shortened = shortenLabel(label, maxLineLength * 2);
  const words = shortened.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    if (shortened.length <= maxLineLength) return [shortened];
    return [shortened.slice(0, maxLineLength), shortened.slice(maxLineLength)];
  }

  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxLineLength || !current) {
      current = candidate;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 2);
}

function compareNodesForSequence(nodeA, nodeB, depths) {
  const depthA = depths[nodeA.id] ?? Infinity;
  const depthB = depths[nodeB.id] ?? Infinity;

  if (depthA !== depthB) return depthA - depthB;

  const stageA = stageRank(nodeA.type);
  const stageB = stageRank(nodeB.type);
  if (stageA !== stageB) return stageA - stageB;

  const yA = safeNum(nodeA.y);
  const yB = safeNum(nodeB.y);
  if (yA !== yB) return yA - yB;

  const nameCompare = String(nodeA.name ?? "").localeCompare(String(nodeB.name ?? ""));
  if (nameCompare !== 0) return nameCompare;

  return String(nodeA.id).localeCompare(String(nodeB.id));
}

function compareEdgesForSequence(edgeA, edgeB, nodeById, depths) {
  const toNodeA = nodeById.get(edgeA.to);
  const toNodeB = nodeById.get(edgeB.to);

  if (toNodeA && toNodeB) {
    return compareNodesForSequence(toNodeA, toNodeB, depths);
  }

  return String(edgeA.id).localeCompare(String(edgeB.id));
}

function buildCostSequence(nodes, edges, result) {
  const depths = computeNodeDepths(nodes, edges);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const rowById = new Map((result?.perNode ?? []).map((row) => [row.id, row]));
  const laneCostById = new Map(
    (result?.laneTransportCostDetails ?? []).map((row) => [row.edgeId, row])
  );
  const outgoingEdgesByNodeId = new Map();

  edges.forEach((edge) => {
    const outgoing = outgoingEdgesByNodeId.get(edge.from) ?? [];
    outgoing.push(edge);
    outgoingEdgesByNodeId.set(edge.from, outgoing);
  });

  const orderedNodes = [...nodes].sort((nodeA, nodeB) =>
    compareNodesForSequence(nodeA, nodeB, depths)
  );

  const items = [];

  orderedNodes.forEach((node) => {
    const row = rowById.get(node.id);

    items.push({
      id: node.id,
      type: "node",
      label: node.name,
      shortLabel: node.name,
      cost: safeNum(row?.totalValue),
      color: THEME.colors.primary,
      note: "Inventory-driven cost",
      isPending: false,
      isProxy: false,
    });

    const orderedOutgoingEdges = [...(outgoingEdgesByNodeId.get(node.id) ?? [])].sort(
      (edgeA, edgeB) => compareEdgesForSequence(edgeA, edgeB, nodeById, depths)
    );

    orderedOutgoingEdges.forEach((edge) => {
      const laneDetail = laneCostById.get(edge.id);
      const transport = getTransportTypeConfig(edge.transportType);
      const explicitLaneCost = safeNum(edge.effectiveCost, safeNum(edge.transportCost));
      const hasExplicitLaneCost = explicitLaneCost > 0;
      const proxyLaneCost = safeNum(laneDetail?.laneTransportCost);
      const isProxy = !hasExplicitLaneCost && proxyLaneCost > 0;
      const isPending = !hasExplicitLaneCost && proxyLaneCost <= 0;
      const laneCost = hasExplicitLaneCost ? explicitLaneCost : proxyLaneCost;

      items.push({
        id: edge.id,
        type: "lane",
        label: `${nodeById.get(edge.from)?.name ?? edge.from} -> ${
          nodeById.get(edge.to)?.name ?? edge.to
        }`,
        shortLabel: transport.label,
        cost: laneCost,
        color: transport.color,
        note: hasExplicitLaneCost
          ? "Lane transport cost"
          : isProxy
            ? "Lane transport proxy"
            : "Lane cost proxy pending",
        isPending,
        isProxy,
      });
    });
  });

  let cumulative = 0;
  return items.map((item) => {
    cumulative += item.cost;
    return {
      ...item,
      cumulative,
    };
  });
}

function buildYAxisTicks(maxValue) {
  const ticks = [];

  for (let index = 0; index < GRID_LINE_COUNT; index += 1) {
    const ratio = index / (GRID_LINE_COUNT - 1);
    ticks.push({
      ratio,
      value: maxValue * (1 - ratio),
    });
  }

  return ticks;
}

export default function CostAccumulationView({ nodes, edges, result, embedded = false }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({
    width: MIN_CHART_WIDTH,
    height: MIN_CHART_HEIGHT,
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    function updateSize() {
      const nextWidth = Math.max(MIN_CHART_WIDTH, Math.round(element.clientWidth || 0));
      const nextHeight = Math.max(MIN_CHART_HEIGHT, Math.round(element.clientHeight || 0));

      setContainerSize((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    }

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const items = useMemo(() => buildCostSequence(nodes, edges, result), [nodes, edges, result]);
  const finalTotal = items.length
    ? safeNum(items[items.length - 1].cumulative)
    : safeNum(result?.totalSupplyChainCost);
  const maxCumulative = Math.max(1, ...items.map((item) => safeNum(item.cumulative)));
  const significantLaneThreshold = Math.max(finalTotal * 0.08, maxCumulative * 0.05, 1);
  const yAxisTicks = buildYAxisTicks(maxCumulative);
  const width = containerSize.width;
  const height = containerSize.height;
  const chartHeight = height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  const baselineY = height - CHART_PADDING_BOTTOM;
  const chartStartX = CHART_PADDING_LEFT;
  const chartEndX = width - CHART_PADDING_RIGHT;
  const availableWidth = Math.max(1, chartEndX - chartStartX);
  const availableHeight = Math.max(1, chartHeight);
  const stepX =
    items.length > 1 ? availableWidth / (items.length - 1) : availableWidth / 2;

  let pathD = "";
  let areaD = "";
  let lastPoint = null;

  const plottedItems = items.map((item, index) => {
    const x = chartStartX + (items.length > 1 ? index * stepX : availableWidth / 2);
    const y = baselineY - (safeNum(item.cumulative) / maxCumulative) * availableHeight;
    const isMajorLane = item.type === "lane" && item.cost >= significantLaneThreshold;
    const labelLines =
      item.type === "node"
        ? splitLabel(item.shortLabel, 14)
        : isMajorLane
          ? [item.shortLabel, item.isProxy ? "Proxy" : "Lane"]
          : [];

    if (index === 0) {
      if (LINE_STYLE === "diagonal") {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${baselineY} L ${x} ${y}`;
      } else {
        pathD = `M ${x} ${baselineY} L ${x} ${y}`;
        areaD = `M ${x} ${baselineY} L ${x} ${y}`;
      }
    } else if (LINE_STYLE === "diagonal") {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${lastPoint?.y ?? y} L ${x} ${y}`;
      areaD += ` L ${x} ${lastPoint?.y ?? y} L ${x} ${y}`;
    }

    lastPoint = { x, y };

    return {
      ...item,
      x,
      y,
      isMajorLane,
      labelLines,
    };
  });

  if (lastPoint != null) {
    areaD += ` L ${lastPoint.x} ${baselineY} Z`;
  }

  const finalPoint = plottedItems[plottedItems.length - 1] ?? null;

  return (
    <div
      style={{
        border: embedded ? "none" : `1px solid ${THEME.colors.border}`,
        borderRadius: embedded ? 0 : THEME.radius.lg,
        padding: embedded ? 16 : 16,
        background: THEME.colors.surface,
        boxShadow: embedded ? "none" : THEME.shadow.card,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: embedded ? "100%" : "auto",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {!embedded ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: THEME.colors.textPrimary }}>Cost Accumulation View</h2>
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: THEME.colors.textMuted,
                maxWidth: 760,
              }}
            >
              Cumulative cost rises in supply chain order. Node values are inventory-driven cost,
              and lane values use explicit transport cost when available or an honestly labeled
              proxy.
            </p>
          </div>

          <div
            style={{
              border: `1px solid ${THEME.colors.border}`,
              borderRadius: THEME.radius.md,
              padding: "10px 12px",
              background: THEME.colors.background,
              minWidth: 220,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: THEME.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              Total Supply Chain Cost
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: THEME.colors.textPrimary }}>
              {money(finalTotal)}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: THEME.colors.textPrimary }}>
              Cost Accumulation View
            </div>
            <div style={{ marginTop: 6, color: THEME.colors.textMuted, fontSize: 14 }}>
              Diagonal cumulative path with explicit transport cost or honestly labeled proxies.
            </div>
          </div>
          <div
            style={{
              border: `1px solid ${THEME.colors.border}`,
              borderRadius: THEME.radius.md,
              padding: "10px 12px",
              background: THEME.colors.background,
              minWidth: 220,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: THEME.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              Total Supply Chain Cost
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.colors.textPrimary }}>
              {money(finalTotal)}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: embedded ? 10 : 14,
          color: THEME.colors.textMuted,
          fontSize: embedded ? 12 : 13,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: THEME.colors.primary,
              display: "inline-block",
            }}
          />
          <span>
            <b style={{ color: THEME.colors.textPrimary }}>Node cost</b> = inventory-driven cost
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: THEME.colors.secondary,
              display: "inline-block",
            }}
          />
          <span>
            <b style={{ color: THEME.colors.textPrimary }}>Lane cost</b> = transport or proxy cost
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              border: `2px solid ${THEME.colors.secondary}`,
              background: THEME.colors.surface,
              display: "inline-block",
            }}
          />
          <span>
            <b style={{ color: THEME.colors.textPrimary }}>Pending lane cost</b> = muted marker
          </span>
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${THEME.colors.border}`,
          borderRadius: THEME.radius.lg,
          overflow: "hidden",
          overflowY: "hidden",
          background: THEME.colors.background,
          padding: 8,
          width: "100%",
          flex: embedded ? "1 1 auto" : "0 0 auto",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: embedded ? "100%" : "clamp(420px, 62vh, 640px)",
            flex: 1,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
            }}
          >
            {yAxisTicks.map((tick, index) => {
              const y = CHART_PADDING_TOP + tick.ratio * chartHeight;
              return (
                <g key={index}>
                  <line
                    x1={chartStartX}
                    y1={y}
                    x2={chartEndX}
                    y2={y}
                    stroke={index === yAxisTicks.length - 1 ? THEME.colors.border : THEME.colors.secondary}
                    strokeOpacity={index === yAxisTicks.length - 1 ? 0.7 : 0.18}
                    strokeWidth="1"
                  />
                  <text
                    x={chartStartX - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill={THEME.colors.textMuted}
                  >
                    {compactMoney(tick.value)}
                  </text>
                </g>
              );
            })}

            <line
              x1={chartStartX}
              y1={CHART_PADDING_TOP}
              x2={chartStartX}
              y2={baselineY}
              stroke={THEME.colors.border}
              strokeWidth="1"
            />

            {finalPoint ? (
              <line
                x1={chartStartX}
                y1={finalPoint.y}
                x2={chartEndX}
                y2={finalPoint.y}
                stroke={THEME.colors.primary}
                strokeOpacity="0.18"
                strokeDasharray="6 6"
                strokeWidth="1"
              />
            ) : null}

            {plottedItems.length > 0 ? (
              <>
                <path d={areaD} fill={THEME.colors.primary} opacity="0.06" />
                <path
                  d={pathD}
                  fill="none"
                  stroke={THEME.colors.primary}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </>
            ) : null}

            {plottedItems.map((item) => (
              <g key={item.id}>
                <title>{`${item.label}: ${money(item.cost)} | ${item.note}`}</title>

                {item.type === "node" ? (
                  <>
                    <line
                      x1={item.x}
                      y1={baselineY}
                      x2={item.x}
                      y2={item.y}
                      stroke={THEME.colors.primary}
                      strokeOpacity="0.12"
                      strokeWidth="2"
                    />
                    <circle
                      cx={item.x}
                      cy={item.y}
                      r="8"
                      fill={THEME.colors.surface}
                      stroke={item.color}
                      strokeWidth="4"
                    />
                  </>
                ) : item.isPending ? (
                  <circle
                    cx={item.x}
                    cy={item.y}
                    r="4.5"
                    fill={THEME.colors.surface}
                    stroke={THEME.colors.secondary}
                    strokeWidth="2"
                    opacity="0.9"
                  />
                ) : (
                  <rect
                    x={item.x - (item.isMajorLane ? 4.5 : 3.5)}
                    y={item.y - (item.isMajorLane ? 4.5 : 3.5)}
                    width={item.isMajorLane ? 9 : 7}
                    height={item.isMajorLane ? 9 : 7}
                    rx="2"
                    fill={item.color}
                    opacity={item.isProxy ? 0.72 : 0.9}
                  />
                )}

                {(item.type === "node" || item.isMajorLane) && (
                  <text
                    x={item.x}
                    y={item.y - 16}
                    textAnchor="middle"
                    fontSize={item.type === "node" ? "12" : "11"}
                    fontWeight={item.type === "node" ? "700" : "600"}
                    fill={THEME.colors.textPrimary}
                  >
                    {compactMoney(item.cumulative)}
                  </text>
                )}

                {item.labelLines.map((line, index) => (
                  <text
                    key={`${item.id}_${index}`}
                    x={item.x}
                    y={baselineY + 28 + index * 15}
                    textAnchor="middle"
                    fontSize={item.type === "node" ? "12" : "11"}
                    fontWeight={item.type === "node" ? "700" : "600"}
                    fill={item.type === "node" ? THEME.colors.textPrimary : THEME.colors.textMuted}
                  >
                    {line}
                  </text>
                ))}
              </g>
            ))}

            {finalPoint ? (
              <>
                <circle
                  cx={finalPoint.x}
                  cy={finalPoint.y}
                  r="11"
                  fill={THEME.colors.surface}
                  stroke={THEME.colors.primary}
                  strokeWidth="4"
                />
                <text
                  x={chartEndX}
                  y={Math.max(18, CHART_PADDING_TOP - 18)}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="700"
                  fill={THEME.colors.textMuted}
                >
                  Total Supply Chain Cost
                </text>
                <text
                  x={chartEndX}
                  y={CHART_PADDING_TOP + 2}
                  textAnchor="end"
                  fontSize={embedded ? "17" : "19"}
                  fontWeight="700"
                  fill={THEME.colors.textPrimary}
                >
                  {money(finalTotal)}
                </text>
              </>
            ) : null}
          </svg>
        </div>
      </div>

      <div
        style={{
          marginTop: embedded ? 10 : 12,
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          color: THEME.colors.textMuted,
          fontSize: embedded ? 13 : 14,
        }}
      >
        <div>
          <b style={{ color: THEME.colors.textPrimary }}>Nodes:</b> visually emphasized
        </div>
        <div>
          <b style={{ color: THEME.colors.textPrimary }}>Lanes:</b>{" "}
          {result?.laneTransportCostModel === "proxy"
            ? "explicit cost or honest proxy"
            : "pending when cost is unavailable"}
        </div>
        <div>
          <b style={{ color: THEME.colors.textPrimary }}>Final total:</b> {money(finalTotal)}
        </div>
        <div>
          <b style={{ color: THEME.colors.textPrimary }}>Items plotted:</b> {items.length}
        </div>
      </div>
    </div>
  );
}
