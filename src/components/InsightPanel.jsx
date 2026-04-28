// src/components/InsightPanel.jsx

import { useMemo, useState } from "react";
import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle, cardStyle, money, num } from "../ui/formatters";

function sumBy(rows = [], key) {
  return rows.reduce((acc, row) => acc + Number(row?.[key] || 0), 0);
}

function avgBy(rows = [], key) {
  if (!rows.length) return 0;
  return sumBy(rows, key) / rows.length;
}

function countBy(rows = [], predicate) {
  return rows.reduce((acc, row) => acc + (predicate(row) ? 1 : 0), 0);
}

function categoryStyle(category) {
  if (category === "cost") {
    return {
      border: "#F59E0B",
      bg: "rgba(245,158,11,0.15)",
      text: THEME.colors.textPrimary,
      label: "Cost",
    };
  }

  if (category === "flow") {
    return {
      border: "#3B82F6",
      bg: "rgba(59,130,246,0.15)",
      text: THEME.colors.textPrimary,
      label: "Flow",
    };
  }

  if (category === "risk") {
    return {
      border: "#22C55E",
      bg: "rgba(34,197,94,0.15)",
      text: THEME.colors.textPrimary,
      label: "Risk",
    };
  }

  return {
    border: THEME.colors.border,
    bg: THEME.colors.surfacePanel ?? THEME.colors.background,
    text: THEME.colors.textPrimary,
    label: "Structure",
  };
}

function makeInsight(category, text, priority = 1) {
  return { category, text, priority };
}

function compareNodeNames(currentRows = [], baselineRows = [], field, descending = true) {
  const currentSorted = [...currentRows].sort((a, b) =>
    descending
      ? Number(b?.[field] || 0) - Number(a?.[field] || 0)
      : Number(a?.[field] || 0) - Number(b?.[field] || 0)
  );
  const baselineSorted = [...baselineRows].sort((a, b) =>
    descending
      ? Number(b?.[field] || 0) - Number(a?.[field] || 0)
      : Number(a?.[field] || 0) - Number(b?.[field] || 0)
  );

  return {
    current: currentSorted[0]?.name ?? null,
    baseline: baselineSorted[0]?.name ?? null,
  };
}

function laneName(edge, nodeById) {
  return `${nodeById.get(edge?.from)?.name ?? edge?.from ?? "Unknown"} -> ${
    nodeById.get(edge?.to)?.name ?? edge?.to ?? "Unknown"
  }`;
}

function buildTransportFeatureInsights({ currentResult, currentNodes, currentEdges }) {
  const nodeById = new Map((currentNodes ?? []).map((node) => [node.id, node]));
  const laneCostDetails = currentResult?.laneTransportCostDetails ?? [];
  const laneCostById = new Map(laneCostDetails.map((row) => [row.edgeId, row]));
  const edges = currentEdges ?? [];
  const insights = [];

  const airEdges = edges.filter((edge) => String(edge?.transportType).toLowerCase() === "air");
  const shipEdges = edges.filter((edge) => String(edge?.transportType).toLowerCase() === "ship");
  const outsourcedEdges = edges.filter((edge) => Boolean(edge?.isOutsourced));
  const upstreamRetailNodes = (currentNodes ?? []).filter((node) => Boolean(node?.flags?.upstreamRetail));
  const highestVarianceEdge = [...edges]
    .sort((a, b) => Number(b?.s || 0) - Number(a?.s || 0))[0];
  const largestLaneJump = [...laneCostDetails]
    .sort((a, b) => Number(b?.laneTransportCost || 0) - Number(a?.laneTransportCost || 0))[0];

  if (airEdges.length > 0) {
    insights.push(
      makeInsight(
        "cost",
        `${airEdges.length} air lane${airEdges.length === 1 ? " is" : "s are"} buying speed at a higher transport cost.`,
        7
      )
    );
  }

  if (shipEdges.length > 0) {
    insights.push(
      makeInsight(
        "flow",
        `${shipEdges.length} ship lane${shipEdges.length === 1 ? " is" : "s are"} likely lengthening flow in exchange for lower transport cost.`,
        7
      )
    );
  }

  if (highestVarianceEdge && Number(highestVarianceEdge?.s || 0) > 0) {
    insights.push(
      makeInsight(
        "risk",
        `${laneName(highestVarianceEdge, nodeById)} has the highest lane variability, so it is a good place to watch buffer pressure.`,
        7
      )
    );
  }

  if (outsourcedEdges.length > 0) {
    insights.push(
      makeInsight(
        "cost",
        `${outsourcedEdges.length} outsourced lane${outsourcedEdges.length === 1 ? " is" : "s are"} getting the current 3PL cost reduction, which lowers lane transport burden by about 28%.`,
        7
      )
    );
  }

  if (upstreamRetailNodes.length > 0) {
    insights.push(
      makeInsight(
        "structure",
        `${upstreamRetailNodes.length} retail node${upstreamRetailNodes.length === 1 ? " is" : "s are"} sitting upstream of the boundary, which is a warning sign that retail is buffering too early.`,
        8
      )
    );
  }

  if (
    largestLaneJump &&
    Number(largestLaneJump?.laneTransportCost || 0) >
      Number(currentResult?.totalSupplyChainCost || 0) * 0.08
  ) {
    const edge = edges.find((candidate) => candidate.id === largestLaneJump.edgeId);
    insights.push(
      makeInsight(
        "cost",
        `The cost accumulation view shows a large lane jump on ${laneName(edge, nodeById)}, so transport design is materially shaping total cost.`,
        8
      )
    );
  }

  return insights;
}

function buildDeltaInsights({
  currentResult,
  baselineResult,
  currentNodes,
  baselineNodes,
  currentEdges,
  baselineEdges,
  currentBoundaryColumn,
  baselineBoundaryColumn,
}) {
  const currentRows = currentResult?.perNode ?? [];
  const baselineRows = baselineResult?.perNode ?? [];

  const deltaCost =
    Number(currentResult?.totalSupplyChainCost || 0) -
    Number(baselineResult?.totalSupplyChainCost || 0);

  const deltaInventory =
    Number(currentResult?.totalInventory || 0) -
    Number(baselineResult?.totalInventory || 0);

  const deltaResponse =
    Number(currentResult?.totalResponseTime || 0) -
    Number(baselineResult?.totalResponseTime || 0);

  const deltaRisk =
    Number(currentResult?.aggregateRiskScore || 0) -
    Number(baselineResult?.aggregateRiskScore || 0);

  const currentSS = sumBy(currentRows, "SSValue");
  const baselineSS = sumBy(baselineRows, "SSValue");
  const deltaSS = currentSS - baselineSS;

  const currentPS = sumBy(currentRows, "PSValue");
  const baselinePS = sumBy(baselineRows, "PSValue");
  const deltaPS = currentPS - baselinePS;

  const currentOps = sumBy(currentRows, "nodeAddedCost");
  const baselineOps = sumBy(baselineRows, "nodeAddedCost");
  const deltaOps = currentOps - baselineOps;

  const currentPushCount = countBy(currentRows, (r) => String(r?.mode).toLowerCase() === "push");
  const baselinePushCount = countBy(baselineRows, (r) => String(r?.mode).toLowerCase() === "push");

  const currentPackedFinishedCount = countBy(
    currentRows,
    (r) => ["finished", "packed"].includes(String(r?.inventoryType).toLowerCase())
  );
  const baselinePackedFinishedCount = countBy(
    baselineRows,
    (r) => ["finished", "packed"].includes(String(r?.inventoryType).toLowerCase())
  );

  const currentSingleSourceCount = countBy(
    currentRows,
    (r) => r?.type !== "supplier" && Number(r?.inboundEdgeCount || 0) <= 1
  );
  const baselineSingleSourceCount = countBy(
    baselineRows,
    (r) => r?.type !== "supplier" && Number(r?.inboundEdgeCount || 0) <= 1
  );

  const currentAvgSigmaAmplification = avgBy(
    currentRows.filter((r) => Number(r?.rawSigma || 0) > 0),
    "sigma"
  );
  const baselineAvgSigmaAmplification = avgBy(
    baselineRows.filter((r) => Number(r?.rawSigma || 0) > 0),
    "sigma"
  );

  const currentAvgRawSigma = avgBy(
    currentRows.filter((r) => Number(r?.rawSigma || 0) > 0),
    "rawSigma"
  );
  const baselineAvgRawSigma = avgBy(
    baselineRows.filter((r) => Number(r?.rawSigma || 0) > 0),
    "rawSigma"
  );

  const currentSigmaRatio =
    currentAvgRawSigma > 0 ? currentAvgSigmaAmplification / currentAvgRawSigma : 1;

  const baselineSigmaRatio =
    baselineAvgRawSigma > 0 ? baselineAvgSigmaAmplification / baselineAvgRawSigma : 1;

  const currentBehaviorPushPull = currentBoundaryColumn - baselineBoundaryColumn;

  const currentMaxCostNode = compareNodeNames(currentRows, baselineRows, "totalValue", true);
  const currentMaxRiskNode = {
    current: currentResult?.maxRiskNode?.name ?? null,
    baseline: baselineResult?.maxRiskNode?.name ?? null,
  };

  const nodeCountDelta = (currentNodes?.length || 0) - (baselineNodes?.length || 0);
  const edgeCountDelta = (currentEdges?.length || 0) - (baselineEdges?.length || 0);

  const insights = [];

  if (Math.abs(deltaCost) > 1) {
    if (Math.abs(deltaInventory) >= Math.abs(deltaOps) && Math.abs(deltaInventory) > 1) {
      insights.push(
        makeInsight(
          "cost",
          `Cost ${deltaCost >= 0 ? "rose" : "fell"} mainly through inventory burden ${deltaInventory >= 0 ? "increasing" : "easing"} ${money(Math.abs(deltaInventory))}.`,
          10
        )
      );
    } else {
      insights.push(
        makeInsight(
          "cost",
          `Cost ${deltaCost >= 0 ? "rose" : "fell"} mainly through node operating burden ${deltaOps >= 0 ? "increasing" : "easing"} ${money(Math.abs(deltaOps))}.`,
          10
        )
      );
    }
  }

  if (Math.abs(deltaSS) > Math.abs(deltaPS) && Math.abs(deltaSS) > 1) {
    insights.push(
      makeInsight(
        "cost",
        `Safety stock ${deltaSS >= 0 ? "increased" : "decreased"} more than pipeline inventory, so the change hit uncertainty buffering harder than transit exposure.`,
        8
      )
    );
  } else if (Math.abs(deltaPS) > 1) {
    insights.push(
      makeInsight(
        "flow",
        `Pipeline inventory ${deltaPS >= 0 ? "grew" : "fell"}, which points to flow length and lead-time exposure changing materially.`,
        8
      )
    );
  }

  if (Math.abs(deltaResponse) > 0.15) {
    insights.push(
      makeInsight(
        "flow",
        `Response time ${deltaResponse >= 0 ? "worsened" : "improved"} by ${num(Math.abs(deltaResponse), 1)} days.`,
        9
      )
    );
  }

  if (currentBehaviorPushPull < 0) {
    insights.push(
      makeInsight(
        "flow",
        "The push-pull boundary moved upstream, shifting more demand exposure into earlier stages.",
        7
      )
    );
  } else if (currentBehaviorPushPull > 0) {
    insights.push(
      makeInsight(
        "flow",
        "The push-pull boundary moved downstream, pushing more committed inventory closer to demand.",
        7
      )
    );
  }

  if (currentPushCount !== baselinePushCount) {
    insights.push(
      makeInsight(
        "structure",
        `The network now has ${currentPushCount > baselinePushCount ? "more" : "fewer"} push-oriented stages, changing where inventory is intentionally buffered.`,
        7
      )
    );
  }

  if (currentPackedFinishedCount !== baselinePackedFinishedCount) {
    insights.push(
      makeInsight(
        "cost",
        `The count of finished or packed stocking points ${currentPackedFinishedCount > baselinePackedFinishedCount ? "increased" : "decreased"}, changing how expensive inventory is to hold.`,
        7
      )
    );
  }

  if (Math.abs(deltaRisk) > 0.02) {
    insights.push(
      makeInsight(
        "risk",
        `Aggregate risk ${deltaRisk >= 0 ? "rose" : "fell"} by ${num(Math.abs(deltaRisk), 2)}.`,
        9
      )
    );
  }

  if (currentSingleSourceCount !== baselineSingleSourceCount) {
    insights.push(
      makeInsight(
        "risk",
        `Single-source exposure ${currentSingleSourceCount > baselineSingleSourceCount ? "increased" : "decreased"}, changing structural concentration risk.`,
        8
      )
    );
  }

  if (Math.abs(currentSigmaRatio - baselineSigmaRatio) > 0.04) {
    insights.push(
      makeInsight(
        "risk",
        `Effective demand variability is being amplified ${currentSigmaRatio > baselineSigmaRatio ? "more" : "less"} by the current stocking assumptions.`,
        6
      )
    );
  }

  if (
    currentMaxRiskNode.current &&
    currentMaxRiskNode.baseline &&
    currentMaxRiskNode.current !== currentMaxRiskNode.baseline
  ) {
    insights.push(
      makeInsight(
        "risk",
        `The most exposed node shifted from ${currentMaxRiskNode.baseline} to ${currentMaxRiskNode.current}.`,
        6
      )
    );
  }

  if (nodeCountDelta !== 0 || edgeCountDelta !== 0) {
    insights.push(
      makeInsight(
        "structure",
        `Structure changed by ${nodeCountDelta >= 0 ? "+" : ""}${nodeCountDelta} node${Math.abs(nodeCountDelta) === 1 ? "" : "s"} and ${edgeCountDelta >= 0 ? "+" : ""}${edgeCountDelta} lane${Math.abs(edgeCountDelta) === 1 ? "" : "s"}.`,
        6
      )
    );
  }

  if (
    currentMaxCostNode.current &&
    currentMaxCostNode.baseline &&
    currentMaxCostNode.current !== currentMaxCostNode.baseline
  ) {
    insights.push(
      makeInsight(
        "cost",
        `The heaviest cost burden moved from ${currentMaxCostNode.baseline} to ${currentMaxCostNode.current}.`,
        5
      )
    );
  }

  insights.push(
    ...buildTransportFeatureInsights({
      currentResult,
      currentNodes,
      currentEdges,
    })
  );

  insights.sort((a, b) => b.priority - a.priority);

  let headline = "The latest change created a mixed tradeoff.";
  if (deltaCost > 0 && deltaResponse > 0) {
    headline = "The latest change made the network heavier and slower.";
  } else if (deltaCost < 0 && deltaResponse < 0) {
    headline = "The latest change improved both cost pressure and flow speed.";
  } else if (deltaRisk < 0 && deltaCost > 0) {
    headline = "The latest change bought resilience at a higher cost.";
  } else if (deltaRisk > 0 && deltaCost < 0) {
    headline = "The latest change improved efficiency but increased exposure.";
  }

  let suggestion = "Change one lever at a time to see which tradeoff is actually moving the system.";
  if (deltaSS > 0 && currentBehaviorPushPull > 0) {
    suggestion = "If inventory is the concern, move the boundary upstream or reduce finished-stock exposure.";
  } else if (deltaResponse > 0.15) {
    suggestion = "If speed matters most, shorten the slowest path or reduce stage count before adding more buffers.";
  } else if (deltaRisk > 0.02) {
    suggestion = "If exposure is rising, look first at single-sourced nodes and offshore-dependent paths.";
  } else if (deltaCost > 0 && deltaOps > deltaInventory) {
    suggestion = "Operating structure may be doing more damage than inventory. Test a simpler network shape.";
  }

  return {
    headline,
    insights: insights.slice(0, 6),
    suggestion,
  };
}

function buildSnapshotInsights({ currentResult, currentNodes, currentEdges, currentBoundaryColumn }) {
  const rows = currentResult?.perNode ?? [];
  const pushCount = countBy(rows, (r) => String(r?.mode).toLowerCase() === "push");
  const singleSourceCount = countBy(
    rows,
    (r) => r?.type !== "supplier" && Number(r?.inboundEdgeCount || 0) <= 1
  );
  const packedFinishedCount = countBy(
    rows,
    (r) => ["finished", "packed"].includes(String(r?.inventoryType).toLowerCase())
  );

  const insights = [];

  if (pushCount > 0) {
    insights.push(
      makeInsight(
        "flow",
        `The network currently has ${pushCount} push-oriented stage${pushCount === 1 ? "" : "s"}, so inventory is buffered upstream of demand.`,
        8
      )
    );
  }

  if (singleSourceCount > 0) {
    insights.push(
      makeInsight(
        "risk",
        `${singleSourceCount} stage${singleSourceCount === 1 ? "" : "s"} appear structurally close to single-sourced exposure.`,
        8
      )
    );
  }

  if (packedFinishedCount > 0) {
    insights.push(
      makeInsight(
        "cost",
        `${packedFinishedCount} stocking point${packedFinishedCount === 1 ? "" : "s"} are holding finished or packed inventory, usually the most expensive form to buffer.`,
        7
      )
    );
  }

  if ((currentEdges?.length || 0) > (currentNodes?.length || 0)) {
    insights.push(
      makeInsight(
        "structure",
        "Lane complexity is high enough that flow design may matter as much as topology.",
        6
      )
    );
  }

  if (currentBoundaryColumn <= 1) {
    insights.push(
      makeInsight(
        "flow",
        "The boundary is relatively upstream, so earlier stages are absorbing more demand uncertainty.",
        6
      )
    );
  } else if (currentBoundaryColumn >= 3) {
    insights.push(
      makeInsight(
        "flow",
        "The boundary is relatively downstream, so responsiveness may improve while committed inventory grows closer to demand.",
        6
      )
    );
  }

  insights.push(
    ...buildTransportFeatureInsights({
      currentResult,
      currentNodes,
      currentEdges,
    })
  );

  insights.sort((a, b) => b.priority - a.priority);

  return {
    headline: "This is a structural read of the current network.",
    insights: insights.slice(0, 4),
    suggestion: "Pin a baseline to unlock sharper, change-based coaching.",
  };
}

export default function InsightPanel({
  enabled,
  onToggleEnabled,
  currentResult,
  baselineResult,
  currentNodes,
  baselineNodes,
  currentEdges,
  baselineEdges,
  currentBoundaryColumn,
  baselineBoundaryColumn,
}) {
  const [expanded, setExpanded] = useState(false);

  const analysis = useMemo(() => {
    if (baselineResult) {
      return buildDeltaInsights({
        currentResult,
        baselineResult,
        currentNodes,
        baselineNodes,
        currentEdges,
        baselineEdges,
        currentBoundaryColumn,
        baselineBoundaryColumn,
      });
    }

    return buildSnapshotInsights({
      currentResult,
      currentNodes,
      currentEdges,
      currentBoundaryColumn,
    });
  }, [
    currentResult,
    baselineResult,
    currentNodes,
    baselineNodes,
    currentEdges,
    baselineEdges,
    currentBoundaryColumn,
    baselineBoundaryColumn,
  ]);

  const defaultVisibleCount = 4;
  const visibleInsights = expanded
    ? analysis.insights
    : analysis.insights.slice(0, defaultVisibleCount);

  const hiddenCount = Math.max(0, analysis.insights.length - defaultVisibleCount);
  const showExpandButton = analysis.insights.length > defaultVisibleCount;

  return (
    <div style={cardStyle()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: scaleNum(12),
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: scaleNum(12),
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Coaching</h2>
          <div style={{ color: THEME.colors.secondary, marginTop: scaleNum(6) }}>
            Concise guidance on what changed and why it matters.
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: scaleNum(8),
            fontWeight: 600,
            cursor: "pointer",
            color: THEME.colors.secondary,
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled?.(e.target.checked)}
          />
          Enable Coaching
        </label>
      </div>

      {!enabled ? (
        <div
          style={{
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: scaleNum(12),
            padding: `${scaleNum(14)}px ${scaleNum(16)}px`,
            background: THEME.colors.surfacePanel ?? THEME.colors.background,
            color: THEME.colors.textPrimary,
          }}
        >
          Coaching is off. Turn it on when you want an interpretation of the current tradeoff.
        </div>
      ) : (
        <>
          <div
          style={{
              border: `1px solid ${THEME.colors.border}`,
              borderRadius: scaleNum(12),
              padding: `${scaleNum(14)}px ${scaleNum(16)}px`,
              background: THEME.colors.surfacePanel ?? THEME.colors.surface,
              marginBottom: scaleNum(12),
              fontWeight: 700,
              lineHeight: 1.4,
              color: THEME.colors.textPrimary,
            }}
          >
            {analysis.headline}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: scaleNum(10),
            }}
          >
            {visibleInsights.map((insight, index) => {
              const palette = categoryStyle(insight.category);
              return (
                <div
                  key={`${index}-${insight.text.slice(0, 24)}`}
                  style={{
                    border: `1px solid ${THEME.colors.border}`,
                    borderLeft: `3px solid ${palette.border}`,
                    borderRadius: scaleNum(12),
                    padding: `${scaleNum(12)}px ${scaleNum(14)}px`,
                    background: palette.bg,
                    lineHeight: 1.45,
                    minWidth: 0,
                    color: palette.text,
                  }}
                >
                  <div
                    style={{
                      fontSize: scaleNum(12),
                      fontWeight: 800,
                      color: palette.border,
                      marginBottom: scaleNum(6),
                      letterSpacing: "0.03em",
                    }}
                  >
                    {palette.label}
                  </div>
                  <div>{insight.text}</div>
                </div>
              );
            })}
          </div>

          {showExpandButton && (
            <div style={{ marginTop: scaleNum(12) }}>
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                style={buttonStyle()}
              >
                {expanded ? "Show Less" : `Show More (${hiddenCount})`}
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: scaleNum(12),
              border: `1px solid ${THEME.colors.border}`,
              borderRadius: scaleNum(12),
              padding: `${scaleNum(12)}px ${scaleNum(14)}px`,
              background: THEME.colors.surfacePanel ?? THEME.colors.surface,
              color: THEME.colors.textPrimary,
            }}
          >
            <div
              style={{
                fontSize: scaleNum(12),
                color: THEME.colors.secondary,
                marginBottom: scaleNum(4),
              }}
            >
              Suggestion
            </div>
            <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{analysis.suggestion}</div>
          </div>
        </>
      )}
    </div>
  );
}
