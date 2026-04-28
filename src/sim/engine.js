// src/sim/engine.js

import baseline from "../data/scenario_baseline.json";
import { NodeType } from "../model/networkTypes";
import { kForServiceLevel } from "../model/kTable";
import { defaultParameters } from "../model/parameterLibrary";

function safeNum(x, fallback = 0) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function safeStr(x, fallback = "") {
  return typeof x === "string" ? x : fallback;
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function scoreToRiskLabel(score) {
  if (score < 1.67) return "Low";
  if (score < 2.34) return "Medium";
  return "High";
}

function modeOfNode(node) {
  const raw =
    safeStr(node.mode) ||
    safeStr(node.inventoryMode) ||
    safeStr(node.fulfillmentMode);

  const normalized = raw.trim().toLowerCase();
  if (normalized === "push") return "push";
  if (normalized === "pull") return "pull";

  if (node.type === NodeType.CUSTOMER) return "pull";
  return "push";
}

function locationOfNode(node) {
  return (
    safeStr(node.location) ||
    safeStr(node.region) ||
    safeStr(node.nodeLocation) ||
    "north_america"
  )
    .trim()
    .toLowerCase();
}

function sourcingPostureOfNode(node) {
  if (node?.type === NodeType.CUSTOMER || node?.type === NodeType.RETAIL) {
    return "domestic";
  }
  return safeStr(node.sourcingPosture, "domestic").trim().toLowerCase();
}

function nodeDisplayLocation(node) {
  return safeStr(node.location, "north_america") || "north_america";
}

function buildGraphMaps(edges) {
  const outEdgesByFrom = new Map();
  const inEdgesByTo = new Map();

  for (const e of edges) {
    if (!outEdgesByFrom.has(e.from)) outEdgesByFrom.set(e.from, []);
    outEdgesByFrom.get(e.from).push(e);

    if (!inEdgesByTo.has(e.to)) inEdgesByTo.set(e.to, []);
    inEdgesByTo.get(e.to).push(e);
  }

  return { outEdgesByFrom, inEdgesByTo };
}

function validateNetwork(network) {
  if (!network || !Array.isArray(network.nodes) || !Array.isArray(network.edges)) {
    throw new Error("Network must include nodes[] and edges[]");
  }

  const ids = new Set();

  for (const n of network.nodes) {
    if (!n?.id) throw new Error("Each node must have an id");
    if (ids.has(n.id)) throw new Error(`Duplicate node id: ${n.id}`);
    ids.add(n.id);
  }

  for (const e of network.edges) {
    if (!e?.id) throw new Error("Each edge must have an id");
    if (!ids.has(e.from)) throw new Error(`Edge ${e.id} has missing from node: ${e.from}`);
    if (!ids.has(e.to)) throw new Error(`Edge ${e.id} has missing to node: ${e.to}`);
  }
}

function topologicalSort(nodes, edges) {
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const childrenByParent = new Map();

  for (const e of edges) {
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);

    if (!childrenByParent.has(e.from)) childrenByParent.set(e.from, []);
    childrenByParent.get(e.from).push(e.to);
  }

  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const order = [];
  while (queue.length > 0) {
    const id = queue.shift();
    order.push(id);

    const children = childrenByParent.get(id) ?? [];
    for (const childId of children) {
      const next = (inDegree.get(childId) ?? 0) - 1;
      inDegree.set(childId, next);
      if (next === 0) queue.push(childId);
    }
  }

  if (order.length !== nodes.length) {
    throw new Error(
      "Network contains a cycle. This teaching engine currently expects an acyclic supply chain."
    );
  }

  return order;
}

function topoLevels(order, edges) {
  const parentsByChild = new Map();

  for (const e of edges) {
    if (!parentsByChild.has(e.to)) parentsByChild.set(e.to, []);
    parentsByChild.get(e.to).push(e.from);
  }

  const levelById = new Map();

  for (const id of order) {
    const parents = parentsByChild.get(id) ?? [];
    if (parents.length === 0) {
      levelById.set(id, 0);
    } else {
      const parentLevel = Math.max(...parents.map((p) => levelById.get(p) ?? 0));
      levelById.set(id, parentLevel + 1);
    }
  }

  return levelById;
}

function chooseInboundParams(nodeId, inEdgesByTo) {
  const inbound = inEdgesByTo.get(nodeId) ?? [];
  if (inbound.length === 0) {
    return { L: 0, s: 0, R: 0, inboundEdgeCount: 0 };
  }

  const count = inbound.length;

  const avgL =
    inbound.reduce((acc, edge) => acc + safeNum(edge.L), 0) / count;

  const avgR =
    inbound.reduce((acc, edge) => acc + safeNum(edge.R), 0) / count;

  const rootMeanSquareS = Math.sqrt(
    inbound.reduce((acc, edge) => acc + Math.pow(safeNum(edge.s), 2), 0) / count
  );

  const poolingFactor = count > 1 ? 1 / Math.sqrt(Math.min(count, 3)) : 1;

  return {
    L: avgL,
    s: rootMeanSquareS * (count > 1 ? 0.9 + 0.1 * poolingFactor : 1),
    R: avgR,
    inboundEdgeCount: count,
  };
}

function computeDemand(nodesById, topoOrder, outEdgesByFrom) {
  for (const n of nodesById.values()) {
    if (n.type === NodeType.CUSTOMER) {
      if (n.demand?.mu == null || n.demand?.sigma == null) {
        throw new Error(`Customer node ${n.id} missing demand.mu or demand.sigma`);
      }
    } else {
      n.demand = {
        mu: safeNum(n.demand?.mu),
        sigma: safeNum(n.demand?.sigma),
      };
    }
  }

  const reverseOrder = [...topoOrder].reverse();

  for (const nodeId of reverseOrder) {
    const n = nodesById.get(nodeId);
    if (!n || n.type === NodeType.CUSTOMER) continue;

    const outEdges = outEdgesByFrom.get(nodeId) ?? [];
    if (outEdges.length === 0) continue;

    let muSum = 0;
    let sigmaSqSum = 0;

    for (const e of outEdges) {
      const child = nodesById.get(e.to);
      if (!child) throw new Error(`Edge ${e.id} points to missing node ${e.to}`);

      const childMu = safeNum(child.demand?.mu);
      const childSigma = safeNum(child.demand?.sigma);
      const bom = safeNum(e.bom) || 1;

      muSum += childMu * bom;
      sigmaSqSum += Math.pow(childSigma * bom, 2);
    }

    n.demand.mu = muSum;
    n.demand.sigma = Math.sqrt(sigmaSqSum);
  }
}

function getNodeTypeDefaults(type, parameters) {
  const key = safeStr(type, "").toLowerCase();
  return parameters.nodeCosts?.[key] ?? {
    costPerUnit: 1,
    baseRisk: 1.5,
    stageTime: 5,
  };
}

function getLocationFactors(node, parameters) {
  const location = locationOfNode(node);
  return parameters.locationFactors?.[location] ?? {
    costMultiplier: 1,
    riskMultiplier: 1,
    leadTimeMultiplier: 1,
  };
}

function getSourcingPostureFactors(node, parameters) {
  const posture = sourcingPostureOfNode(node);
  return parameters.sourcingPostureFactors?.[posture] ?? {
    leadTimeMultiplier: 1,
    riskMultiplier: 1,
    costMultiplier: 1,
  };
}

function getModeFactors(node, parameters) {
  const mode = modeOfNode(node);
  return parameters.modeFactors?.[mode] ?? {
    inventoryMultiplier: 1,
    responseTimeMultiplier: 1,
  };
}

function getStockFormFactorsByKey(stockFormKey, parameters) {
  return parameters.stockFormFactors?.[stockFormKey] ?? {
    inventoryMultiplier: 1,
    riskMultiplier: 1,
  };
}

function deriveInventoryType(node, inventoryMode) {
  if (node.type === NodeType.CUSTOMER) return "none";

  if (inventoryMode === "manual") {
    return safeStr(node.stockForm, "generic").toLowerCase() || "generic";
  }

  const mode = modeOfNode(node);

  if (mode === "push") {
    if (node.type === NodeType.SUPPLIER || node.type === NodeType.FACTORY) return "generic";
    if (node.type === NodeType.DC) return "configured";
    if (node.type === NodeType.RETAIL) return "finished";
    return "generic";
  }

  if (node.type === NodeType.RETAIL) return "packed";
  if (node.type === NodeType.DC) return "finished";
  return "configured";
}

function downstreamModeStats(nodeId, nodesById, outEdgesByFrom) {
  const outEdges = outEdgesByFrom.get(nodeId) ?? [];
  if (outEdges.length === 0) {
    return {
      childCount: 0,
      pullChildCount: 0,
      pushChildCount: 0,
      pullShare: 0,
      hasPullChild: false,
      hasPushChild: false,
    };
  }

  let pullChildCount = 0;
  let pushChildCount = 0;

  for (const e of outEdges) {
    const child = nodesById.get(e.to);
    const childMode = modeOfNode(child);
    if (childMode === "pull") pullChildCount += 1;
    else pushChildCount += 1;
  }

  return {
    childCount: outEdges.length,
    pullChildCount,
    pushChildCount,
    pullShare: pullChildCount / outEdges.length,
    hasPullChild: pullChildCount > 0,
    hasPushChild: pushChildCount > 0,
  };
}

function inventoryBehavior(node, inventoryType, nodesById, outEdgesByFrom) {
  if (node.type === NodeType.CUSTOMER) {
    return {
      pipelineFactor: 0,
      safetyStockFactor: 0,
      responseExposureFactor: 1.08,
      commitmentRiskAdder: 0,
      explanation: "Demand sink",
    };
  }

  const mode = modeOfNode(node);
  const downstream = downstreamModeStats(node.id, nodesById, outEdgesByFrom);

  if (mode === "push") {
    const pushStageTypeAdder =
      inventoryType === "generic"
        ? 1.0
        : inventoryType === "configured"
          ? 1.08
          : inventoryType === "finished"
            ? 1.16
            : 1.26;

    return {
      pipelineFactor: 1.0,
      safetyStockFactor: (1.08 + 0.55 * downstream.pullShare) * pushStageTypeAdder,
      responseExposureFactor: 0.50,
      commitmentRiskAdder:
        inventoryType === "generic"
          ? 0.06
          : inventoryType === "configured"
            ? 0.12
            : inventoryType === "finished"
              ? 0.18
              : 0.24,
      explanation: downstream.hasPullChild
        ? "Push buffer feeding pull stage"
        : "Forecast-driven push stage",
    };
  }

  if (node.type === NodeType.RETAIL) {
    return {
      pipelineFactor: 0.30,
      safetyStockFactor: 0.20,
      responseExposureFactor: 1.04,
      commitmentRiskAdder: 0.26,
      explanation: "Retail pull execution stage",
    };
  }

  return {
    pipelineFactor: 0.42,
    safetyStockFactor: 0.28,
    responseExposureFactor: 0.98,
    commitmentRiskAdder:
      inventoryType === "configured"
        ? 0.16
        : inventoryType === "finished"
          ? 0.22
          : inventoryType === "packed"
            ? 0.28
            : 0.12,
    explanation: "Demand-driven pull stage",
  };
}

function stockTypeEconomicFactors(inventoryType) {
  if (inventoryType === "generic") {
    return {
      unitHoldingMultiplier: 0.85,
      sigmaMultiplier: 0.88,
      stageTimeMultiplier: 0.95,
      riskMultiplier: 0.95,
    };
  }

  if (inventoryType === "configured") {
    return {
      unitHoldingMultiplier: 1.0,
      sigmaMultiplier: 1.0,
      stageTimeMultiplier: 1.0,
      riskMultiplier: 1.0,
    };
  }

  if (inventoryType === "finished") {
    return {
      unitHoldingMultiplier: 1.16,
      sigmaMultiplier: 1.14,
      stageTimeMultiplier: 1.04,
      riskMultiplier: 1.06,
    };
  }

  if (inventoryType === "packed") {
    return {
      unitHoldingMultiplier: 1.28,
      sigmaMultiplier: 1.22,
      stageTimeMultiplier: 1.06,
      riskMultiplier: 1.10,
    };
  }

  return {
    unitHoldingMultiplier: 1,
    sigmaMultiplier: 1,
    stageTimeMultiplier: 1,
    riskMultiplier: 1,
  };
}

function structuralRiskFactors(nodeId, node, nodesById, inEdgesByTo, outEdgesByFrom) {
  const inbound = inEdgesByTo.get(nodeId) ?? [];
  const outbound = outEdgesByFrom.get(nodeId) ?? [];

  const uniqueInboundSuppliers = new Set();
  for (const e of inbound) {
    uniqueInboundSuppliers.add(e.from);
  }

  const inboundCount = uniqueInboundSuppliers.size;
  const outboundCount = outbound.length;

  const singleSourcePenalty = inboundCount <= 1 && node.type !== NodeType.SUPPLIER ? 0.18 : 0;
  const multiSourceBonus = inboundCount >= 2 ? -0.10 * Math.min(inboundCount - 1, 3) : 0;
  const branchComplexity = outboundCount >= 2 ? 0.03 * Math.min(outboundCount - 1, 4) : 0;

  let geographyPenalty = 0;
  const upstreamLocations = new Set();

  for (const e of inbound) {
    const parent = nodesById.get(e.from);
    if (parent) upstreamLocations.add(locationOfNode(parent));
  }

  if (upstreamLocations.size <= 1 && inboundCount >= 1 && node.type !== NodeType.SUPPLIER) {
    geographyPenalty = 0.05;
  } else if (upstreamLocations.size >= 2) {
    geographyPenalty = -0.03;
  }

  return {
    singleSourcePenalty,
    multiSourceBonus,
    branchComplexity,
    geographyPenalty,
  };
}

export function runSimulation(network = baseline, opts = {}) {
  validateNetwork(network);

  const parameters = opts.parameters ?? defaultParameters;
  const serviceLevel = opts.serviceLevel ?? parameters.serviceLevel ?? 0.95;
  const inventoryMode = opts.inventoryMode ?? "auto";
  const k = kForServiceLevel(serviceLevel);

  const nodesById = new Map(network.nodes.map((n) => [n.id, structuredClone(n)]));
  const edges = network.edges.map((e) => structuredClone(e));

  const { outEdgesByFrom, inEdgesByTo } = buildGraphMaps(edges);
  const topoOrder = topologicalSort(network.nodes, edges);
  const levelById = topoLevels(topoOrder, edges);

  computeDemand(nodesById, topoOrder, outEdgesByFrom);

  let totalSSValue = 0;
  let totalPSValue = 0;
  let totalNodeAddedCost = 0;
  let weightedRiskNumerator = 0;
  let weightedRiskDenominator = 0;
  let maxRiskNode = null;
  let maxRiskScore = -Infinity;
  let totalStageTime = 0;

  const perNode = topoOrder.map((nodeId) => {
    const n = nodesById.get(nodeId);

    const mu = safeNum(n.demand?.mu);
    const sigma = safeNum(n.demand?.sigma);
    const mode = modeOfNode(n);
    const inventoryType = deriveInventoryType(n, inventoryMode);
    const locationLabel = nodeDisplayLocation(n);
    const sourcingPosture = sourcingPostureOfNode(n);

    const nodeDefaults = getNodeTypeDefaults(n.type, parameters);
    const locationFactors = getLocationFactors(n, parameters);
    const sourcingPostureFactors = getSourcingPostureFactors(n, parameters);
    const modeFactors = getModeFactors(n, parameters);
    const stockFormFactors =
      inventoryType === "none"
        ? { inventoryMultiplier: 1, riskMultiplier: 1 }
        : getStockFormFactorsByKey(inventoryType, parameters);
    const stockEconomics = stockTypeEconomicFactors(inventoryType);
    const behavior = inventoryBehavior(n, inventoryType, nodesById, outEdgesByFrom);

    const unitValue = safeNum(n.unitValue);
    const holdingValueMultiplier = stockEconomics.unitHoldingMultiplier;

    const baseCostPerUnit = safeNum(nodeDefaults.costPerUnit);
    const nodeCostAdderPerUnit =
      n.costAdderPerUnit != null
        ? safeNum(n.costAdderPerUnit)
        : baseCostPerUnit *
          safeNum(locationFactors.costMultiplier, 1) *
          safeNum(sourcingPostureFactors.costMultiplier, 1) *
          holdingValueMultiplier;

    const baseStageTime = safeNum(nodeDefaults.stageTime);
    const nodeStageTime =
      n.stageTimeDays != null
        ? safeNum(n.stageTimeDays)
        : baseStageTime *
          safeNum(locationFactors.leadTimeMultiplier, 1) *
          safeNum(sourcingPostureFactors.leadTimeMultiplier, 1) *
          stockEconomics.stageTimeMultiplier;

    const annualCarryingRate = safeNum(parameters.carryingRate, 0.18);
    const carryingRate = annualCarryingRate / 365;

    const { L: rawL, s: rawS, R, inboundEdgeCount } = chooseInboundParams(n.id, inEdgesByTo);

    const L =
      rawL *
      safeNum(locationFactors.leadTimeMultiplier, 1) *
      safeNum(sourcingPostureFactors.leadTimeMultiplier, 1);

    const s =
      rawS *
      safeNum(locationFactors.leadTimeMultiplier, 1) *
      safeNum(sourcingPostureFactors.leadTimeMultiplier, 1);

    const holdsInventory = n.type !== NodeType.CUSTOMER;

    const effectiveSigma = sigma * stockEconomics.sigmaMultiplier;
    const basePS = holdsInventory ? mu * L : 0;
    const rawSS = holdsInventory
      ? k *
        Math.sqrt(
          Math.pow(mu, 2) * Math.pow(s, 2) +
            (L + R) * Math.pow(effectiveSigma, 2)
        )
      : 0;

    const inventoryMultiplier =
      safeNum(stockFormFactors.inventoryMultiplier, 1) *
      safeNum(modeFactors.inventoryMultiplier, 1);

    const PS = basePS * behavior.pipelineFactor;
    const SS = rawSS * inventoryMultiplier * behavior.safetyStockFactor;

    const PSValue = PS * unitValue * carryingRate * holdingValueMultiplier;
    const SSValue = SS * unitValue * carryingRate * holdingValueMultiplier;
    const inventoryValue = PSValue + SSValue;

    const nodeAddedCost =
      n.type === NodeType.CUSTOMER
        ? 0
        : mu * nodeCostAdderPerUnit;

    const responseTimeDays =
      (L + R + nodeStageTime) *
      behavior.responseExposureFactor *
      safeNum(modeFactors.responseTimeMultiplier, 1);

    const explicitRiskScore =
      safeNum(nodeDefaults.baseRisk) *
      safeNum(locationFactors.riskMultiplier, 1) *
      safeNum(sourcingPostureFactors.riskMultiplier, 1) *
      safeNum(stockFormFactors.riskMultiplier, 1) *
      safeNum(stockEconomics.riskMultiplier, 1);

    const demandCv = mu > 0 ? effectiveSigma / mu : 0;
    const demandRiskComponent = clamp(demandCv * 6, 0, 3);
    const timeRiskComponent = clamp((L + R + nodeStageTime) / 20, 0, 3);

    let sourcingRiskComponent = clamp(inboundEdgeCount * 0.3, 0, 1.5);
    if (inboundEdgeCount > 1) {
      sourcingRiskComponent =
        sourcingRiskComponent * safeNum(parameters.risk?.multiSourceReduction, 0.78);
    }

    if (sourcingPosture === "offshore") {
      sourcingRiskComponent += 0.20;
    } else if (sourcingPosture === "domestic") {
      sourcingRiskComponent -= 0.06;
    }

    const downstream = downstreamModeStats(n.id, nodesById, outEdgesByFrom);
    const boundaryExposureComponent =
      mode === "push"
        ? 0.28 + 0.26 * downstream.pullShare + behavior.commitmentRiskAdder
        : 0.10 + behavior.commitmentRiskAdder;

    const structural = structuralRiskFactors(
      n.id,
      n,
      nodesById,
      inEdgesByTo,
      outEdgesByFrom
    );

    const combinedRiskScore =
      0.34 * explicitRiskScore +
      0.20 * demandRiskComponent +
      0.15 * timeRiskComponent +
      0.11 * sourcingRiskComponent +
      0.10 * boundaryExposureComponent +
      structural.singleSourcePenalty +
      structural.multiSourceBonus +
      structural.branchComplexity +
      structural.geographyPenalty;

    const finalRiskScore = clamp(
      combinedRiskScore,
      1,
      safeNum(parameters.risk?.maxCap, 2.5)
    );

    const riskLabel = scoreToRiskLabel(finalRiskScore);
    const weightingBasis = Math.max(1, inventoryValue + nodeAddedCost);

    totalSSValue += SSValue;
    totalPSValue += PSValue;
    totalNodeAddedCost += nodeAddedCost;
    totalStageTime += nodeStageTime;

    weightedRiskNumerator += finalRiskScore * weightingBasis;
    weightedRiskDenominator += weightingBasis;

    if (finalRiskScore > maxRiskScore) {
      maxRiskScore = finalRiskScore;
      maxRiskNode = {
        id: n.id,
        name: n.name,
        score: finalRiskScore,
        label: riskLabel,
      };
    }

    return {
      id: n.id,
      name: n.name,
      type: n.type,
      level: levelById.get(n.id) ?? 0,
      mode,
      inventoryType,
      location: locationLabel,
      sourcingPosture,
      mu,
      sigma: effectiveSigma,
      rawSigma: sigma,
      L,
      s,
      R,
      stageTimeDays: nodeStageTime,
      responseTimeDays,
      PS,
      SS,
      unitValue,
      inventoryCarryRate: carryingRate,
      annualInventoryCarryRate: annualCarryingRate,
      costAdderPerUnit: nodeCostAdderPerUnit,
      nodeAddedCost,
      PSValue,
      SSValue,
      inventoryValue,
      totalValue: inventoryValue + nodeAddedCost,
      inboundEdgeCount,
      riskScore: finalRiskScore,
      riskLabel,
      holdsInventory,
      behaviorExplanation: behavior.explanation,
    };
  });

  const totalInventory = totalSSValue + totalPSValue;
  const totalSupplyChainCost = totalInventory + totalNodeAddedCost;

  const aggregateRiskScore =
    weightedRiskDenominator > 0
      ? weightedRiskNumerator / weightedRiskDenominator
      : 0;

  const aggregateRiskLabel = scoreToRiskLabel(aggregateRiskScore);

  const responseTimeByNode = new Map();

  for (const nodeId of topoOrder) {
    const row = perNode.find((r) => r.id === nodeId);
    const parents = (inEdgesByTo.get(nodeId) ?? []).map((e) => e.from);

    if (parents.length === 0) {
      responseTimeByNode.set(nodeId, safeNum(row?.responseTimeDays));
    } else {
      const parentMax = Math.max(
        ...parents.map((p) => responseTimeByNode.get(p) ?? 0)
      );
      responseTimeByNode.set(nodeId, parentMax + safeNum(row?.responseTimeDays));
    }
  }

  const customerRows = perNode.filter((r) => r.type === NodeType.CUSTOMER);
  const totalResponseTime =
    customerRows.length > 0
      ? Math.max(...customerRows.map((r) => responseTimeByNode.get(r.id) ?? 0))
      : Math.max(0, ...Array.from(responseTimeByNode.values()));

  return {
    k,
    perNode,
    totalSafetyStock: totalSSValue,
    totalPipeline: totalPSValue,
    totalInventory,
    totalNodeAddedCost,
    totalSupplyChainCost,
    totalStageTime,
    totalResponseTime,
    aggregateRiskScore,
    aggregateRiskLabel,
    maxRiskNode,
  };
}