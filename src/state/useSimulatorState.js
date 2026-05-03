// src/state/useSimulatorState.js

import { useMemo, useState } from "react";
import {
  normalizeTransportEdge,
  normalizeTransportEdgeForNodes,
} from "../config/transportTypes";
import { NodeType } from "../model/networkTypes";
import { cloneParameters, defaultParameters } from "../model/parameterLibrary";
import {
  clearLeaderboardEntries,
  loadLeaderboardEntries,
  saveLeaderboardEntry,
} from "../sim/leaderboardStore";
import {
  addBranchCustomer,
  addDownstreamNode,
  addParallelSupplier,
  addUpstreamNode,
  autoLayoutGraph,
  cloneBaselineGraph,
  connectNodes,
  defaultNodeTemplate,
  findEdgeById,
  findNodeById,
  removeEdge,
  removeNode,
  updateEdge,
  updateNode as updateGraphNode,
  updateNodePosition,
  validateGraph,
} from "../sim/graphHelpers";
import { sampleScenarios } from "../data/sampleScenarios";

const SUPPORTED_SERVICE_LEVELS = [0.8, 0.85, 0.9, 0.95, 0.98, 0.99];

function cloneScenarioGraph(scenario) {
  const nodes = (scenario?.nodes ?? []).map((node) => structuredClone(node));

  return {
    nodes,
    edges: (scenario?.edges ?? []).map((edge) =>
      normalizeTransportEdgeForNodes(structuredClone(edge), nodes)
    ),
  };
}

function nearestServiceLevelIndex(serviceLevel) {
  const target = Number(serviceLevel);
  if (!Number.isFinite(target)) return 3;

  let bestIndex = 0;
  let bestDistance = Math.abs(SUPPORTED_SERVICE_LEVELS[0] - target);

  for (let i = 1; i < SUPPORTED_SERVICE_LEVELS.length; i += 1) {
    const distance = Math.abs(SUPPORTED_SERVICE_LEVELS[i] - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function useSimulatorState() {
  const initialGraph = useMemo(() => cloneBaselineGraph(), []);

  const [nodes, setNodes] = useState(initialGraph.nodes);
  const [edges, setEdges] = useState(initialGraph.edges);

  const [selectedNodeId, setSelectedNodeId] = useState(initialGraph.nodes[0]?.id ?? null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const [serviceLevelIndex, setServiceLevelIndex] = useState(3);
  const [parameters, setParameters] = useState(() => cloneParameters(defaultParameters));

  const [leaderboardEntries, setLeaderboardEntries] = useState(() => loadLeaderboardEntries());

  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isLaneEditorOpen, setIsLaneEditorOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(true);

  const [activeShockCard, setActiveShockCard] = useState(null);

  const serviceLevel = SUPPORTED_SERVICE_LEVELS[serviceLevelIndex];

  const scenario = useMemo(() => {
    return {
      nodes: nodes.map((n) => structuredClone(n)),
      edges: edges.map((e) => structuredClone(e)),
    };
  }, [nodes, edges]);

  const selectedNode = useMemo(() => {
    return findNodeById(nodes, selectedNodeId);
  }, [nodes, selectedNodeId]);

  const selectedEdge = useMemo(() => {
    return findEdgeById(edges, selectedEdgeId);
  }, [edges, selectedEdgeId]);

  const graphValidation = useMemo(() => {
    return validateGraph(nodes, edges);
  }, [nodes, edges]);

  function setGraph(nextNodes, nextEdges) {
    setNodes(nextNodes);
    setEdges(nextEdges.map((edge) => normalizeTransportEdgeForNodes(edge, nextNodes)));
  }

  function updateNode(nodeId, updater) {
    setNodes((prevNodes) => {
      const nextNodes = updateGraphNode(prevNodes, nodeId, updater);
      setEdges((prevEdges) =>
        prevEdges.map((edge) => normalizeTransportEdgeForNodes(edge, nextNodes))
      );
      return nextNodes;
    });
  }

  function addNode(type, position = null) {
    const template = {
      ...defaultNodeTemplate(type),
      ...(position ?? {}),
    };
    setNodes((prev) => [...prev, template]);
    setSelectedNodeId(template.id);
    setSelectedEdgeId(null);
    return template;
  }

  function removeNodeById(nodeId) {
    if (!nodeId) return;

    const next = removeNode(nodes, edges, nodeId);
    setGraph(next.nodes, next.edges);
    setSelectedNodeId((prevSelectedNodeId) =>
      prevSelectedNodeId === nodeId ? next.nodes[0]?.id ?? null : prevSelectedNodeId
    );
    setSelectedEdgeId(null);
  }

  function removeSelectedNode() {
    if (!selectedNodeId) return;

    const next = removeNode(nodes, edges, selectedNodeId);
    setGraph(next.nodes, next.edges);
    setSelectedNodeId(next.nodes[0]?.id ?? null);
    setSelectedEdgeId(null);
  }

  function updateLane(edgeId, field, value) {
    setEdges((prev) =>
      updateEdge(prev, edgeId, (edge) => {
        if (typeof field === "function") {
          return normalizeTransportEdgeForNodes(field(edge), nodes);
        }

        if (typeof field === "object" && field !== null) {
          const updatedEdge = {
            ...edge,
            ...field,
          };
          return normalizeTransportEdgeForNodes(updatedEdge, nodes);
        }

        if (field === "transportType") {
          return normalizeTransportEdgeForNodes({
            ...edge,
            transportType: value,
          }, nodes);
        }

        if (field === "isOutsourced") {
          const updatedEdge = {
            ...edge,
            isOutsourced: Boolean(value),
          };
          return normalizeTransportEdgeForNodes(updatedEdge, nodes);
        }

        const updatedEdge = {
          ...edge,
          [field]: Number(value),
        };
        return normalizeTransportEdgeForNodes(updatedEdge, nodes);
      })
    );
  }

  function updateLaneByEndpoints(fromId, toId, field, value) {
    const edge = edges.find((e) => e.from === fromId && e.to === toId);
    if (!edge) return;
    updateLane(edge.id, field, value);
  }

  function removeSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((prev) => removeEdge(prev, selectedEdgeId));
    setSelectedEdgeId(null);
  }

  function removeEdgeById(edgeId) {
    if (!edgeId) return;
    setEdges((prev) => removeEdge(prev, edgeId));
    setSelectedEdgeId((prevSelectedEdgeId) =>
      prevSelectedEdgeId === edgeId ? null : prevSelectedEdgeId
    );
  }

  function connectSelectedNodeTo(targetNodeId) {
    if (!selectedNodeId || !targetNodeId || selectedNodeId === targetNodeId) return;
    setEdges((prev) => connectNodes(nodes, prev, selectedNodeId, targetNodeId));
  }

  function addCustomEdge(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    setEdges((prev) => connectNodes(nodes, prev, fromId, toId));
  }

  function addParallelSupplierToSelected() {
    if (!selectedNodeId) return;

    const result = addParallelSupplier(nodes, edges, selectedNodeId);
    setGraph(result.nodes, result.edges);
    if (result.newNodeId) {
      setSelectedNodeId(result.newNodeId);
      setSelectedEdgeId(result.newEdgeId);
    }
  }

  function addBranchCustomerFromSelected() {
    if (!selectedNodeId) return;

    const result = addBranchCustomer(nodes, edges, selectedNodeId);
    setGraph(result.nodes, result.edges);
    if (result.newNodeId) {
      setSelectedNodeId(result.newNodeId);
      setSelectedEdgeId(result.newEdgeId);
    }
  }

  function addUpstreamNodeToSelected(newType) {
    if (!selectedNodeId) return;

    const result = addUpstreamNode(nodes, edges, selectedNodeId, newType);
    setGraph(result.nodes, result.edges);
    if (result.newNodeId) {
      setSelectedNodeId(result.newNodeId);
      setSelectedEdgeId(result.newEdgeId);
    }
  }

  function addDownstreamNodeFromSelected(newType) {
    if (!selectedNodeId) return;

    const result = addDownstreamNode(nodes, edges, selectedNodeId, newType);
    setGraph(result.nodes, result.edges);
    if (result.newNodeId) {
      setSelectedNodeId(result.newNodeId);
      setSelectedEdgeId(result.newEdgeId);
    }
  }

  function moveNode(nodeId, x, y) {
    setNodes((prev) => updateNodePosition(prev, nodeId, x, y));
  }

  function autoLayout() {
    setNodes((prev) => autoLayoutGraph(prev, edges));
  }

  function updateCustomerDemand(mu, sigma) {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.type !== NodeType.CUSTOMER) return node;
        return {
          ...node,
          demand: {
            mu,
            sigma,
          },
        };
      })
    );
  }

  function loadScenario(sampleScenarioOrId) {
    const scenarioToLoad =
      typeof sampleScenarioOrId === "string"
        ? sampleScenarios.find((s) => s.id === sampleScenarioOrId)
        : sampleScenarioOrId;

    if (!scenarioToLoad) return;

    const nextGraph = cloneScenarioGraph(scenarioToLoad);

    setGraph(nextGraph.nodes, nextGraph.edges);
    setSelectedNodeId(nextGraph.nodes[0]?.id ?? null);
    setSelectedEdgeId(null);
    setActiveShockCard(null);
    setIsLaneEditorOpen(false);
    setIsTableOpen(true);

    if (scenarioToLoad.serviceLevel != null) {
      setServiceLevelIndex(nearestServiceLevelIndex(scenarioToLoad.serviceLevel));
    }
  }

  function resetScenario() {
    const fresh = cloneBaselineGraph();
    setGraph(fresh.nodes, fresh.edges);
    setSelectedNodeId(fresh.nodes[0]?.id ?? null);
    setSelectedEdgeId(null);
    setServiceLevelIndex(3);
    setParameters(cloneParameters(defaultParameters));
    setActiveShockCard(null);
    setIsLaneEditorOpen(false);
    setIsTableOpen(true);
  }

  function updateParameters(updater) {
    setParameters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  }

  function resetParameters() {
    setParameters(cloneParameters(defaultParameters));
  }

  function openParameters() {
    setIsParametersOpen(true);
  }

  function closeParameters() {
    setIsParametersOpen(false);
  }

  function openLearning() {
    setIsLearningOpen(true);
  }

  function closeLearning() {
    setIsLearningOpen(false);
  }

  function openLeaderboard() {
    setIsLeaderboardOpen(true);
  }

  function closeLeaderboard() {
    setIsLeaderboardOpen(false);
  }

  function saveRunToLeaderboard(summary) {
    const entry = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      ...summary,
    };

    saveLeaderboardEntry(entry);
    setLeaderboardEntries((prev) => [entry, ...prev]);
  }

  function clearLeaderboard() {
    clearLeaderboardEntries();
    setLeaderboardEntries([]);
  }

  return {
    nodes,
    setNodes,
    edges,
    setEdges,
    scenario,
    graphValidation,

    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    selectedEdgeId,
    setSelectedEdgeId,
    selectedEdge,

    serviceLevelIndex,
    setServiceLevelIndex,
    serviceLevel,
    supportedServiceLevels: SUPPORTED_SERVICE_LEVELS,

    parameters,
    setParameters,
    updateParameters,
    resetParameters,

    isParametersOpen,
    openParameters,
    closeParameters,
    isLearningOpen,
    openLearning,
    closeLearning,
    isLeaderboardOpen,
    openLeaderboard,
    closeLeaderboard,
    isLaneEditorOpen,
    setIsLaneEditorOpen,
    isTableOpen,
    setIsTableOpen,

    leaderboardEntries,
    saveRunToLeaderboard,
    clearLeaderboard,

    activeShockCard,
    setActiveShockCard,

    updateNode,
    addNode,
    removeNodeById,
    removeSelectedNode,
    moveNode,
    autoLayout,
    connectSelectedNodeTo,
    addCustomEdge,
    updateLane,
    updateLaneByEndpoints,
    removeEdgeById,
    removeSelectedEdge,
    addParallelSupplierToSelected,
    addBranchCustomerFromSelected,
    addUpstreamNodeToSelected,
    addDownstreamNodeFromSelected,

    updateCustomerDemand,
    loadScenario,
    resetScenario,
  };
}

export default useSimulatorState;
