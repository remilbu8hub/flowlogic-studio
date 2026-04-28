const DEFAULT_BASE_LANE_COST_PER_UNIT = 2.4;
const OUTSOURCING_COST_MULTIPLIER = 0.72;

function safeNum(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function applyLaneTransportCost(result, edges) {
  if (!result) return result;

  const rowsById = new Map((result.perNode ?? []).map((row) => [row.id, row]));

  const laneTransportRows = (edges ?? []).map((edge) => {
    const childRow = rowsById.get(edge.to);
    const bom = safeNum(edge.bom, 1) || 1;
    const flowVolumeProxy = safeNum(childRow?.mu) * bom;
    const outsourcingMultiplier = edge.isOutsourced ? OUTSOURCING_COST_MULTIPLIER : 1;

    const explicitUnitLaneCost = safeNum(edge.effectiveCost, safeNum(edge.cost));
    const proxyUnitLaneCost =
      DEFAULT_BASE_LANE_COST_PER_UNIT * safeNum(edge.costMultiplier, 1);
    const unitLaneCostBeforeOutsourcing =
      explicitUnitLaneCost > 0 ? explicitUnitLaneCost : proxyUnitLaneCost;
    const unitLaneCost = unitLaneCostBeforeOutsourcing * outsourcingMultiplier;

    return {
      edgeId: edge.id,
      from: edge.from,
      to: edge.to,
      flowVolumeProxy,
      isOutsourced: Boolean(edge.isOutsourced),
      outsourcingMultiplier,
      unitLaneCostBeforeOutsourcing,
      unitLaneCost,
      laneTransportCost: flowVolumeProxy * unitLaneCost,
    };
  });

  const totalLaneTransportCost = laneTransportRows.reduce(
    (sum, row) => sum + safeNum(row.laneTransportCost),
    0
  );

  const totalSupplyChainCostBeforeLaneTransport = safeNum(result.totalSupplyChainCost);
  const totalSupplyChainCostWithLaneTransport =
    totalSupplyChainCostBeforeLaneTransport + totalLaneTransportCost;

  return {
    ...result,
    laneTransportCostModel: "proxy",
    laneTransportCostDetails: laneTransportRows,
    totalLaneTransportCost,
    totalSupplyChainCostBeforeLaneTransport,
    totalSupplyChainCostWithLaneTransport,
    totalSupplyChainCost: totalSupplyChainCostWithLaneTransport,
  };
}
