import {
  incomingEdgesOf,
  outgoingEdgesOf,
  topologicalSortGraph,
} from "./graphHelpers";
import { NodeType } from "../model/networkTypes";

const DEMAND_PATTERN = [0, 0.35, -0.2, 0.2, -0.1, 0.1];
const RUN_COSTS = {
  holdingPerUnit: 0.45,
  backorderPerUnit: 2.5,
  serviceFailurePerUnit: 4,
};

function roundQty(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function zeroMap(nodes) {
  return Object.fromEntries(nodes.map((node) => [node.id, 0]));
}

function zeroEdgeMap(edges) {
  return Object.fromEntries(edges.map((edge) => [edge.id, 0]));
}

function canCarryInventory(node) {
  return node?.type !== NodeType.CUSTOMER;
}

function nodeDemandMean(node) {
  return roundQty(node?.demand?.mu ?? 0);
}

function nodeDemandSigma(node) {
  return roundQty(node?.demand?.sigma ?? 0);
}

function demandAtStep(node, currentTimeStep) {
  const mu = nodeDemandMean(node);
  const sigma = nodeDemandSigma(node);
  const pattern = DEMAND_PATTERN[currentTimeStep % DEMAND_PATTERN.length] ?? 0;
  return roundQty(mu + sigma * pattern);
}

function demandByNode(nodes, edges) {
  const sorted = topologicalSortGraph(nodes, edges);
  const demandMap = {};

  [...sorted.order].reverse().forEach((nodeId) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;

    if (node.type === NodeType.CUSTOMER) {
      demandMap[nodeId] = nodeDemandMean(node);
      return;
    }

    demandMap[nodeId] = outgoingEdgesOf(nodeId, edges).reduce(
      (total, edge) => total + (demandMap[edge.to] ?? 0),
      0
    );
  });

  return demandMap;
}

function coverageMultiplier(nodeType) {
  if (nodeType === NodeType.SUPPLIER) return 4;
  if (nodeType === NodeType.FACTORY) return 3;
  if (nodeType === NodeType.DC) return 2;
  if (nodeType === NodeType.RETAIL) return 1.5;
  return 0;
}

function createTargetInventoryByNode(nodes, edges) {
  const demandMap = demandByNode(nodes, edges);
  return Object.fromEntries(
    nodes.map((node) => [
      node.id,
      canCarryInventory(node)
        ? roundQty((demandMap[node.id] ?? 0) * coverageMultiplier(node.type))
        : 0,
    ])
  );
}

function createInventoryByNode(nodes, edges) {
  const targetInventoryByNodeId = createTargetInventoryByNode(nodes, edges);
  return Object.fromEntries(
    nodes.map((node) => [
      node.id,
      canCarryInventory(node) ? roundQty(targetInventoryByNodeId[node.id] ?? 0) : 0,
    ])
  );
}

function proportionalSplit(total, edges, weightForEdge) {
  if (!edges.length || total <= 0) return {};

  const weights = edges.map((edge) => Math.max(1, weightForEdge(edge)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const allocations = {};
  let assigned = 0;

  edges.forEach((edge, index) => {
    const remaining = total - assigned;
    const isLast = index === edges.length - 1;
    const share = isLast
      ? remaining
      : roundQty(total * (weights[index] / totalWeight));
    const quantity = Math.max(0, Math.min(remaining, share));
    allocations[edge.id] = quantity;
    assigned += quantity;
  });

  return allocations;
}

export function createRunSimulationState(nodes, edges) {
  const targetInventoryByNodeId = createTargetInventoryByNode(nodes, edges);

  return {
    currentTimeStep: 0,
    inventoryByNodeId: createInventoryByNode(nodes, edges),
    backlogByNodeId: zeroMap(nodes),
    unmetCustomerDemandByNodeId: zeroMap(nodes),
    pipeline: [],
    demandByNodeId: zeroMap(nodes),
    arrivalsByNodeId: zeroMap(nodes),
    shipmentsByEdgeId: zeroEdgeMap(edges),
    ordersByNodeId: zeroMap(nodes),
    targetInventoryByNodeId,
    cumulativeCosts: {
      holding: 0,
      backorder: 0,
      serviceFailure: 0,
      total: 0,
    },
    lastStepSummary: null,
  };
}

export function stepRunSimulation(state, nodes, edges) {
  const topology = topologicalSortGraph(nodes, edges);
  const orderedNodeIds = topology.order;
  const nextInventory = { ...state.inventoryByNodeId };
  const nextBacklog = zeroMap(nodes);
  const unmetCustomerDemandByNodeId = zeroMap(nodes);
  const arrivalsByNodeId = zeroMap(nodes);
  const demandByNodeId = zeroMap(nodes);
  const shipmentsByEdgeId = zeroEdgeMap(edges);
  const ordersByNodeId = zeroMap(nodes);
  const orderRequestsByEdgeId = zeroEdgeMap(edges);
  const nextPipeline = [];
  let shipmentsArrived = 0;
  let shipmentsLaunched = 0;
  let customerDemand = 0;
  let demandServed = 0;

  state.pipeline.forEach((shipment) => {
    const remainingSteps = (shipment.remainingSteps ?? 1) - 1;
    if (remainingSteps <= 0) {
      nextInventory[shipment.toId] = roundQty(
        (nextInventory[shipment.toId] ?? 0) + (shipment.quantity ?? 0)
      );
      arrivalsByNodeId[shipment.toId] = roundQty(
        (arrivalsByNodeId[shipment.toId] ?? 0) + (shipment.quantity ?? 0)
      );
      shipmentsArrived += roundQty(shipment.quantity ?? 0);
      return;
    }

    nextPipeline.push({
      ...shipment,
      remainingSteps,
    });
  });

  [...orderedNodeIds].reverse().forEach((nodeId) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node) return;

    const downstreamOrders = outgoingEdgesOf(nodeId, edges).reduce(
      (total, edge) => total + (orderRequestsByEdgeId[edge.id] ?? 0),
      0
    );
    const observedDemand =
      node.type === NodeType.CUSTOMER
        ? demandAtStep(node, state.currentTimeStep)
        : downstreamOrders;

    demandByNodeId[nodeId] = observedDemand;

    if (node.type === NodeType.CUSTOMER) {
      customerDemand += observedDemand;
    }

    const upstreamEdges = incomingEdgesOf(nodeId, edges);
    if (!upstreamEdges.length) return;

    const targetInventory = state.targetInventoryByNodeId[nodeId] ?? 0;
    const currentInventory = canCarryInventory(node) ? roundQty(nextInventory[nodeId] ?? 0) : 0;
    const currentBacklog = canCarryInventory(node) ? roundQty(state.backlogByNodeId[nodeId] ?? 0) : 0;
    const orderQuantity = Math.max(
      0,
      roundQty(observedDemand + currentBacklog + targetInventory - currentInventory)
    );

    ordersByNodeId[nodeId] = orderQuantity;

    const allocations = proportionalSplit(
      orderQuantity,
      upstreamEdges,
      (edge) => Number(edge.bom) || 1
    );

    upstreamEdges.forEach((edge) => {
      orderRequestsByEdgeId[edge.id] = allocations[edge.id] ?? 0;
    });
  });

  orderedNodeIds.forEach((nodeId) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);
    if (!node || !canCarryInventory(node)) return;

    const previousBacklog = roundQty(state.backlogByNodeId[nodeId] ?? 0);
    const downstreamEdges = outgoingEdgesOf(nodeId, edges);
    const currentOrders = downstreamEdges.reduce(
      (total, edge) => total + (orderRequestsByEdgeId[edge.id] ?? 0),
      0
    );
    const totalCommitment = roundQty(previousBacklog + currentOrders);
    const available = roundQty(nextInventory[nodeId] ?? 0);
    const fulfilled = Math.min(available, totalCommitment);

    nextInventory[nodeId] = roundQty(available - fulfilled);
    nextBacklog[nodeId] = roundQty(totalCommitment - fulfilled);

    if (!downstreamEdges.length || totalCommitment <= 0 || fulfilled <= 0) {
      return;
    }

    const allocations = proportionalSplit(
      fulfilled,
      downstreamEdges,
      (edge) => {
        const currentOrder = orderRequestsByEdgeId[edge.id] ?? 0;
        return currentOrder > 0 ? currentOrder : 1;
      }
    );

    downstreamEdges.forEach((edge) => {
      const shipped = roundQty(allocations[edge.id] ?? 0);
      if (shipped <= 0) {
        if ((orderRequestsByEdgeId[edge.id] ?? 0) > 0) {
          const childNode = nodes.find((candidate) => candidate.id === edge.to);
          if (childNode?.type === NodeType.CUSTOMER) {
            unmetCustomerDemandByNodeId[childNode.id] = roundQty(
              (unmetCustomerDemandByNodeId[childNode.id] ?? 0) + (orderRequestsByEdgeId[edge.id] ?? 0)
            );
          }
        }
        return;
      }

      shipmentsByEdgeId[edge.id] = shipped;
      shipmentsLaunched += shipped;

      const childNode = nodes.find((candidate) => candidate.id === edge.to);
      if (childNode?.type === NodeType.CUSTOMER) {
        demandServed += shipped;
        const missed = Math.max(0, roundQty(orderRequestsByEdgeId[edge.id] ?? 0) - shipped);
        if (missed > 0) {
          unmetCustomerDemandByNodeId[childNode.id] = roundQty(
            (unmetCustomerDemandByNodeId[childNode.id] ?? 0) + missed
          );
        }
        return;
      }

      nextPipeline.push({
        edgeId: edge.id,
        fromId: edge.from,
        toId: edge.to,
        quantity: shipped,
        remainingSteps: Math.max(1, roundQty(edge.L ?? 1)),
      });
    });
  });

  const holdingCost = nodes.reduce(
    (sum, node) =>
      sum + (canCarryInventory(node) ? roundQty(nextInventory[node.id] ?? 0) : 0) * RUN_COSTS.holdingPerUnit,
    0
  );
  const backorderCost = nodes.reduce(
    (sum, node) =>
      sum + (canCarryInventory(node) ? roundQty(nextBacklog[node.id] ?? 0) : 0) * RUN_COSTS.backorderPerUnit,
    0
  );
  const serviceFailureCost = nodes.reduce(
    (sum, node) =>
      sum + roundQty(unmetCustomerDemandByNodeId[node.id] ?? 0) * RUN_COSTS.serviceFailurePerUnit,
    0
  );
  const totalStepCost = holdingCost + backorderCost + serviceFailureCost;

  return {
    currentTimeStep: state.currentTimeStep + 1,
    inventoryByNodeId: nextInventory,
    backlogByNodeId: nextBacklog,
    unmetCustomerDemandByNodeId,
    pipeline: nextPipeline,
    demandByNodeId,
    arrivalsByNodeId,
    shipmentsByEdgeId,
    ordersByNodeId,
    targetInventoryByNodeId: state.targetInventoryByNodeId,
    cumulativeCosts: {
      holding: (state.cumulativeCosts?.holding ?? 0) + holdingCost,
      backorder: (state.cumulativeCosts?.backorder ?? 0) + backorderCost,
      serviceFailure: (state.cumulativeCosts?.serviceFailure ?? 0) + serviceFailureCost,
      total: (state.cumulativeCosts?.total ?? 0) + totalStepCost,
    },
    lastStepSummary: {
      customerDemand,
      demandServed,
      backlogCreated: nodes.reduce(
        (sum, node) =>
          sum +
          Math.max(
            0,
            roundQty(nextBacklog[node.id] ?? 0) - roundQty(state.backlogByNodeId[node.id] ?? 0)
          ),
        0
      ),
      shipmentsLaunched,
      shipmentsArrived,
      holdingCost,
      backorderCost,
      serviceFailureCost,
      totalStepCost,
    },
  };
}

export function summarizeRunState(runState, nodes) {
  const totalInventory = nodes.reduce(
    (sum, node) => sum + (canCarryInventory(node) ? roundQty(runState.inventoryByNodeId[node.id] ?? 0) : 0),
    0
  );
  const totalBacklog = nodes.reduce(
    (sum, node) => sum + (canCarryInventory(node) ? roundQty(runState.backlogByNodeId[node.id] ?? 0) : 0),
    0
  );
  const totalDemand = nodes.reduce(
    (sum, node) => sum + roundQty(runState.demandByNodeId[node.id] ?? 0),
    0
  );
  const totalCustomerDemand = nodes
    .filter((node) => node.type === NodeType.CUSTOMER)
    .reduce((sum, node) => sum + roundQty(runState.demandByNodeId[node.id] ?? 0), 0);
  const totalServiceFailure = nodes.reduce(
    (sum, node) => sum + roundQty(runState.unmetCustomerDemandByNodeId?.[node.id] ?? 0),
    0
  );
  const inTransitUnits = runState.pipeline.reduce(
    (sum, shipment) => sum + roundQty(shipment.quantity ?? 0),
    0
  );

  return {
    totalInventory,
    totalBacklog,
    totalDemand,
    totalCustomerDemand,
    totalServiceFailure,
    inTransitUnits,
    cumulativeCosts: runState.cumulativeCosts ?? {
      holding: 0,
      backorder: 0,
      serviceFailure: 0,
      total: 0,
    },
  };
}
