// src/sim/graphHelpers.js

import baseline from "../data/scenario_baseline.json";
import {
  normalizeTransportEdge,
  normalizeTransportEdgeForNodes,
} from "../config/transportTypes";
import { NodeType } from "../model/networkTypes";

const X_START = 120;
const X_STEP = 420;
const Y_START = 360;
const Y_STEP = 180;

function clone(value) {
  return structuredClone(value);
}

function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function safeNum(x, fallback = 0) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function compareNodesForLayout(a, b) {
  const byY = safeNum(a?.y, Y_START) - safeNum(b?.y, Y_START);
  if (byY !== 0) return byY;

  const byName = String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
  if (byName !== 0) return byName;

  return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
}

function centeredYForIndex(index, count) {
  const offset = index - (count - 1) / 2;
  return Math.round(Y_START + offset * Y_STEP);
}

function placeNodesInColumns(nodesByColumn) {
  const laidOutNodes = new Map();

  [...nodesByColumn.keys()]
    .sort((a, b) => a - b)
    .forEach((column) => {
      const columnNodes = [...(nodesByColumn.get(column) ?? [])].sort(compareNodesForLayout);

      columnNodes.forEach((node, index) => {
        laidOutNodes.set(node.id, {
          ...node,
          x: X_START + column * X_STEP,
          y: centeredYForIndex(index, columnNodes.length),
        });
      });
    });

  return laidOutNodes;
}

export function edgeKey(fromId, toId) {
  return `${fromId}->${toId}`;
}

export function stageRank(type) {
  if (type === NodeType.SUPPLIER) return 0;
  if (type === NodeType.FACTORY) return 1;
  if (type === NodeType.DC) return 2;
  if (type === NodeType.RETAIL) return 3;
  if (type === NodeType.CUSTOMER) return 4;
  return 99;
}

export function defaultNodeTemplate(type) {
  if (type === NodeType.SUPPLIER) {
    return {
      id: createId("sup"),
      type: NodeType.SUPPLIER,
      name: "New Supplier",
      unitValue: 250,
      stockForm: "components",
      demand: { mu: null, sigma: null },
      mode: "push",
      location: "asia",
      riskLevel: "Medium",
      stageTimeDays: 10,
      costAdderPerUnit: 3,
      x: X_START,
      y: Y_START,
    };
  }

  if (type === NodeType.FACTORY) {
    return {
      id: createId("fac"),
      type: NodeType.FACTORY,
      name: "New Factory",
      unitValue: 1200,
      stockForm: "generic",
      demand: { mu: null, sigma: null },
      mode: "push",
      location: "asia",
      riskLevel: "Low",
      stageTimeDays: 6,
      costAdderPerUnit: 1,
      x: X_START + X_STEP,
      y: Y_START,
    };
  }

  if (type === NodeType.DC) {
    return {
      id: createId("dc"),
      type: NodeType.DC,
      name: "New DC",
      unitValue: 1800,
      stockForm: "configured",
      demand: { mu: null, sigma: null },
      mode: "push",
      location: "domestic",
      riskLevel: "Medium",
      stageTimeDays: 8,
      costAdderPerUnit: 4,
      x: X_START + 2 * X_STEP,
      y: Y_START,
    };
  }

  if (type === NodeType.RETAIL) {
    return {
      id: createId("ret"),
      type: NodeType.RETAIL,
      name: "New Retail Node",
      unitValue: 2000,
      stockForm: "configured",
      demand: { mu: null, sigma: null },
      mode: "pull",
      location: "domestic",
      riskLevel: "Medium",
      stageTimeDays: 3,
      costAdderPerUnit: 2,
      x: X_START + 3 * X_STEP,
      y: Y_START,
    };
  }

  return {
    id: createId("cust"),
    type: NodeType.CUSTOMER,
    name: "New Customer Market",
    unitValue: 2000,
    stockForm: "configured",
    demand: { mu: 100, sigma: 20 },
    mode: "pull",
    location: "domestic",
    riskLevel: "Low",
    stageTimeDays: 0,
    costAdderPerUnit: 0,
    x: X_START + 4 * X_STEP,
    y: Y_START,
  };
}

export function defaultEdgeTemplate(fromNode, toNode) {
  const fromId = fromNode?.id;
  const toId = toNode?.id;
  const fromType = fromNode?.type;
  const toType = toNode?.type;
  let L = 3;
  let s = 1;
  let R = 0;

  if (fromType === NodeType.SUPPLIER && toType === NodeType.FACTORY) {
    L = 15;
    s = 2;
  } else if (
    fromType === NodeType.FACTORY &&
    (toType === NodeType.DC || toType === NodeType.RETAIL)
  ) {
    L = 5;
    s = 1;
  } else if (
    fromType === NodeType.DC &&
    (toType === NodeType.RETAIL || toType === NodeType.CUSTOMER)
  ) {
    L = 2;
    s = 0.5;
  } else if (fromType === NodeType.RETAIL && toType === NodeType.CUSTOMER) {
    L = 1;
    s = 0.2;
  } else if (toType === NodeType.CUSTOMER) {
    L = 1;
    s = 0;
  }

  return normalizeTransportEdgeForNodes({
    id: createId("edge"),
    from: fromId,
    to: toId,
    L,
    s,
    R,
    bom: 1,
  }, [fromNode, toNode]);
}

export function parentsOf(nodeId, edges) {
  return edges.filter((e) => e.to === nodeId).map((e) => e.from);
}

export function childrenOf(nodeId, edges) {
  return edges.filter((e) => e.from === nodeId).map((e) => e.to);
}

export function incomingEdgesOf(nodeId, edges) {
  return edges.filter((e) => e.to === nodeId);
}

export function outgoingEdgesOf(nodeId, edges) {
  return edges.filter((e) => e.from === nodeId);
}

export function findNodeById(nodes, nodeId) {
  return nodes.find((n) => n.id === nodeId) ?? null;
}

export function findEdgeById(edges, edgeId) {
  return edges.find((e) => e.id === edgeId) ?? null;
}

export function graphHasEdge(edges, fromId, toId) {
  return edges.some((e) => e.from === fromId && e.to === toId);
}

export function cloneBaselineGraph() {
  const nodes = clone(baseline.nodes).map((n) => ({
    ...n,
    mode: n.mode ?? (n.type === NodeType.CUSTOMER ? "pull" : "push"),
    location: n.location ?? "domestic",
    riskLevel: n.riskLevel ?? (n.type === NodeType.CUSTOMER ? "Low" : "Medium"),
    stageTimeDays: n.stageTimeDays ?? undefined,
    costAdderPerUnit: n.costAdderPerUnit ?? undefined,
  }));

  const edges = clone(baseline.edges).map((edge) => normalizeTransportEdgeForNodes(edge, nodes));

  return {
    nodes: autoLayoutGraph(nodes, edges),
    edges,
  };
}

export function addNode(nodes, node) {
  return [...nodes, clone(node)];
}

export function updateNodePosition(nodes, nodeId, x, y) {
  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          x,
          y,
        }
      : node
  );
}

export function updateNode(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;
    return typeof updater === "function" ? updater(node) : { ...node, ...updater };
  });
}

export function removeNode(nodes, edges, nodeId) {
  const nextNodes = nodes.filter((n) => n.id !== nodeId);
  const nextEdges = edges.filter((e) => e.from !== nodeId && e.to !== nodeId);

  return {
    nodes: nextNodes,
    edges: nextEdges,
  };
}

export function addEdge(edges, edge) {
  if (graphHasEdge(edges, edge.from, edge.to)) {
    return [...edges];
  }

  return [...edges, normalizeTransportEdge(clone(edge))];
}

export function connectNodes(nodes, edges, fromId, toId) {
  if (fromId === toId) return [...edges];

  const fromNode = findNodeById(nodes, fromId);
  const toNode = findNodeById(nodes, toId);

  if (!fromNode || !toNode) return [...edges];
  if (graphHasEdge(edges, fromId, toId)) return [...edges];

  const newEdge = defaultEdgeTemplate(fromNode, toNode);
  return [...edges, newEdge];
}

export function updateEdge(edges, edgeId, updater) {
  return edges.map((edge) => {
    if (edge.id !== edgeId) return edge;
    const nextEdge = typeof updater === "function" ? updater(edge) : { ...edge, ...updater };
    return normalizeTransportEdge(nextEdge);
  });
}

export function removeEdge(edges, edgeId) {
  return edges.filter((e) => e.id !== edgeId);
}

export function addParallelSupplier(nodes, edges, selectedNodeId) {
  const selectedNode = findNodeById(nodes, selectedNodeId);
  if (!selectedNode) {
    return { nodes, edges, newNodeId: null, newEdgeId: null };
  }

  let targetNode = null;

  if (selectedNode.type === NodeType.SUPPLIER) {
    const existingOutbound = outgoingEdgesOf(selectedNode.id, edges);
    if (existingOutbound.length > 0) {
      targetNode = findNodeById(nodes, existingOutbound[0].to);
    }
  } else {
    targetNode = selectedNode;
  }

  if (!targetNode) {
    return { nodes, edges, newNodeId: null, newEdgeId: null };
  }

  const existingInboundSuppliers = incomingEdgesOf(targetNode.id, edges)
    .map((edge) => findNodeById(nodes, edge.from))
    .filter(Boolean)
    .filter((node) => node.type === NodeType.SUPPLIER)
    .sort((a, b) => safeNum(a.y) - safeNum(b.y));

  const parallelCount = existingInboundSuppliers.length;
  const referenceSupplier = existingInboundSuppliers[0] ?? null;
  const baseY =
    existingInboundSuppliers.length > 0
      ? safeNum(existingInboundSuppliers[0].y, Y_START)
      : safeNum(targetNode.y, Y_START);

  const newSupplier = {
    ...defaultNodeTemplate(NodeType.SUPPLIER),
    name: referenceSupplier
      ? `${referenceSupplier.name} Alt ${parallelCount}`
      : `Parallel Supplier ${parallelCount + 1}`,
    x: X_START + stageRank(NodeType.SUPPLIER) * X_STEP,
    y: baseY + parallelCount * Y_STEP,
  };

  const newEdge = defaultEdgeTemplate(newSupplier, targetNode);

  return {
    nodes: [...nodes, newSupplier],
    edges: [...edges, newEdge],
    newNodeId: newSupplier.id,
    newEdgeId: newEdge.id,
  };
}

export function addBranchCustomer(nodes, edges, selectedNodeId) {
  const selectedNode = findNodeById(nodes, selectedNodeId);
  if (!selectedNode) {
    return { nodes, edges, newNodeId: null, newEdgeId: null };
  }

  let sourceNode = selectedNode;

  if (selectedNode.type === NodeType.CUSTOMER) {
    const parentEdge = incomingEdgesOf(selectedNode.id, edges)[0] ?? null;
    if (parentEdge) {
      sourceNode = findNodeById(nodes, parentEdge.from) ?? selectedNode;
    }
  }

  const existingCustomerBranches = outgoingEdgesOf(sourceNode.id, edges)
    .map((edge) => findNodeById(nodes, edge.to))
    .filter(Boolean)
    .filter((node) => node.type === NodeType.CUSTOMER)
    .sort((a, b) => safeNum(a.y) - safeNum(b.y));

  const branchIndex = existingCustomerBranches.length + 1;
  const baseY =
    existingCustomerBranches.length > 0
      ? safeNum(existingCustomerBranches[0].y, safeNum(sourceNode.y, Y_START))
      : safeNum(sourceNode.y, Y_START);

  const newCustomer = {
    ...defaultNodeTemplate(NodeType.CUSTOMER),
    name: `Customer Group ${branchIndex}`,
    demand: { mu: 60, sigma: 12 },
    x: X_START + stageRank(NodeType.CUSTOMER) * X_STEP,
    y: baseY + existingCustomerBranches.length * Y_STEP,
  };

  const newEdge = defaultEdgeTemplate(sourceNode, newCustomer);

  return {
    nodes: [...nodes, newCustomer],
    edges: [...edges, newEdge],
    newNodeId: newCustomer.id,
    newEdgeId: newEdge.id,
  };
}

export function addDownstreamNode(nodes, edges, sourceNodeId, newType) {
  const sourceNode = findNodeById(nodes, sourceNodeId);
  if (!sourceNode) {
    return { nodes, edges, newNodeId: null, newEdgeId: null };
  }

  const siblings = outgoingEdgesOf(sourceNode.id, edges)
    .map((edge) => findNodeById(nodes, edge.to))
    .filter(Boolean)
    .filter((node) => stageRank(node.type) === stageRank(newType))
    .sort((a, b) => safeNum(a.y) - safeNum(b.y));

  const newNode = {
    ...defaultNodeTemplate(newType),
    x: X_START + stageRank(newType) * X_STEP,
    y: safeNum(sourceNode.y, Y_START) + siblings.length * Y_STEP,
  };

  const newEdge = defaultEdgeTemplate(sourceNode, newNode);

  return {
    nodes: [...nodes, newNode],
    edges: [...edges, newEdge],
    newNodeId: newNode.id,
    newEdgeId: newEdge.id,
  };
}

export function addUpstreamNode(nodes, edges, targetNodeId, newType) {
  const targetNode = findNodeById(nodes, targetNodeId);
  if (!targetNode) {
    return { nodes, edges, newNodeId: null, newEdgeId: null };
  }

  const siblings = incomingEdgesOf(targetNode.id, edges)
    .map((edge) => findNodeById(nodes, edge.from))
    .filter(Boolean)
    .filter((node) => stageRank(node.type) === stageRank(newType))
    .sort((a, b) => safeNum(a.y) - safeNum(b.y));

  const newNode = {
    ...defaultNodeTemplate(newType),
    x: X_START + stageRank(newType) * X_STEP,
    y: safeNum(targetNode.y, Y_START) + siblings.length * Y_STEP,
  };

  const newEdge = defaultEdgeTemplate(newNode, targetNode);

  return {
    nodes: [...nodes, newNode],
    edges: [...edges, newEdge],
    newNodeId: newNode.id,
    newEdgeId: newEdge.id,
  };
}

export function validateGraph(nodes, edges) {
  const errors = [];
  const nodeIds = new Set();

  for (const node of nodes) {
    if (!node?.id) {
      errors.push("A node is missing an id.");
      continue;
    }

    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id found: ${node.id}`);
    }

    nodeIds.add(node.id);
  }

  for (const edge of edges) {
    if (!edge?.id) {
      errors.push("An edge is missing an id.");
      continue;
    }

    if (!nodeIds.has(edge.from)) {
      errors.push(`Edge ${edge.id} has missing source node ${edge.from}.`);
    }

    if (!nodeIds.has(edge.to)) {
      errors.push(`Edge ${edge.id} has missing target node ${edge.to}.`);
    }

    if (edge.from === edge.to) {
      errors.push(`Edge ${edge.id} cannot connect a node to itself.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function topologicalSortGraph(nodes, edges) {
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const childMap = new Map();

  for (const edge of edges) {
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);

    if (!childMap.has(edge.from)) {
      childMap.set(edge.from, []);
    }

    childMap.get(edge.from).push(edge.to);
  }

  const queue = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const order = [];
  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);

    for (const childId of childMap.get(current) ?? []) {
      const nextDegree = (inDegree.get(childId) ?? 0) - 1;
      inDegree.set(childId, nextDegree);
      if (nextDegree === 0) {
        queue.push(childId);
      }
    }
  }

  return {
    order,
    hasCycle: order.length !== nodes.length,
  };
}

export function computeNodeDepths(nodes, edges) {
  const depths = {};
  const adjacency = new Map();

  nodes.forEach((node) => {
    adjacency.set(node.id, []);
  });

  edges.forEach((edge) => {
    if (!adjacency.has(edge.from)) return;
    adjacency.get(edge.from).push(edge.to);
  });

  const queue = [];

  nodes.forEach((node) => {
    if (node.type !== NodeType.SUPPLIER) return;
    depths[node.id] = 0;
    queue.push(node.id);
  });

  for (let i = 0; i < queue.length; i += 1) {
    const nodeId = queue[i];
    const currentDepth = depths[nodeId];
    const neighbors = adjacency.get(nodeId) ?? [];

    neighbors.forEach((neighborId) => {
      const nextDepth = currentDepth + 1;

      if (depths[neighborId] != null && depths[neighborId] <= nextDepth) return;

      depths[neighborId] = nextDepth;
      queue.push(neighborId);
    });
  }

  return depths;
}

export function applyBoundaryModesToNodes(nodes, edges, boundaryColumn) {
  const depths = computeNodeDepths(nodes, edges);

  return nodes.map((node) => {
    if (node.type === NodeType.CUSTOMER) {
      return {
        ...node,
        mode: "pull",
      };
    }

    const nodeDepth = depths[node.id] ?? Infinity;
    const mode = nodeDepth <= boundaryColumn ? "push" : "pull";
    const flags = { ...(node.flags || {}) };

    if (node.type === NodeType.RETAIL && nodeDepth <= boundaryColumn) {
      flags.upstreamRetail = true;
    } else {
      delete flags.upstreamRetail;
    }

    return {
      ...node,
      mode,
      flags,
    };
  });
}

export function graphLayers(nodes, edges) {
  const topo = topologicalSortGraph(nodes, edges);

  if (topo.hasCycle) {
    return new Map(nodes.map((n) => [n.id, stageRank(n.type)]));
  }

  const layerMap = new Map();

  for (const nodeId of topo.order) {
    const node = findNodeById(nodes, nodeId);
    const parents = incomingEdgesOf(nodeId, edges).map((edge) => edge.from);

    if (parents.length === 0) {
      layerMap.set(nodeId, stageRank(node?.type));
    } else {
      const parentLayer = Math.max(...parents.map((p) => layerMap.get(p) ?? 0));
      const desiredLayer = stageRank(node?.type);
      layerMap.set(nodeId, Math.max(parentLayer + 1, desiredLayer));
    }
  }

  return layerMap;
}

export function autoLayoutGraph(nodes, edges) {
  const topo = topologicalSortGraph(nodes, edges);
  const layerMap = graphLayers(nodes, edges);

  if (topo.hasCycle) {
    const nodesByColumn = new Map();

    nodes.forEach((node) => {
      const column = stageRank(node.type);
      if (!nodesByColumn.has(column)) {
        nodesByColumn.set(column, []);
      }

      nodesByColumn.get(column).push(node);
    });

    const laidOutNodes = placeNodesInColumns(nodesByColumn);
    return nodes.map((node) => laidOutNodes.get(node.id)).filter(Boolean);
  }

  const nodesByColumn = new Map();
  const layoutHints = new Map();

  for (const nodeId of topo.order) {
    const node = findNodeById(nodes, nodeId);
    if (!node) continue;

    const column = layerMap.get(nodeId) ?? stageRank(node.type);
    const parentIds = incomingEdgesOf(nodeId, edges).map((edge) => edge.from);
    const parentHints = parentIds
      .map((parentId) => layoutHints.get(parentId))
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    const layoutHint =
      parentHints.length > 0
        ? parentHints.reduce((sum, value) => sum + value, 0) / parentHints.length
        : safeNum(node.y, Y_START);

    if (!nodesByColumn.has(column)) {
      nodesByColumn.set(column, []);
    }

    nodesByColumn.get(column).push({
      ...node,
      layoutHint,
    });
    layoutHints.set(nodeId, layoutHint);
  }

  const laidOutNodes = new Map();

  [...nodesByColumn.keys()]
    .sort((a, b) => a - b)
    .forEach((column) => {
      const columnNodes = [...(nodesByColumn.get(column) ?? [])].sort((a, b) => {
        const byHint = safeNum(a.layoutHint, Y_START) - safeNum(b.layoutHint, Y_START);
        if (byHint !== 0) return byHint;
        return compareNodesForLayout(a, b);
      });

      columnNodes.forEach((node, index) => {
        laidOutNodes.set(node.id, {
          ...node,
          x: X_START + column * X_STEP,
          y: centeredYForIndex(index, columnNodes.length),
        });
      });
    });

  return topo.order
    .map((id) => laidOutNodes.get(id))
    .filter(Boolean)
    .map(({ layoutHint, ...node }) => node);
}
