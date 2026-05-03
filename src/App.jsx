// src/App.jsx

import { useEffect, useMemo, useState } from "react";
import { runSimulation } from "./sim/engine";
import { NodeType } from "./model/networkTypes";
import useSimulatorState from "./state/useSimulatorState";
import { useAppMode } from "./state/appModeContext";
import DashboardHeader from "./components/DashboardHeader";
import AboutPage from "./pages/AboutPage";
import MetricCards from "./components/MetricCards";
import WorkspaceShell from "./components/WorkspaceShell";
import ToolRibbon from "./components/ToolRibbon";
import LeftInspector from "./components/LeftInspector";
import MainWorkspaceCanvas from "./components/MainWorkspaceCanvas";
import ParametersModal from "./components/modals/ParametersModal";
import LearningModal from "./components/modals/LearningModal";
import LeaderboardModal from "./components/modals/LeaderboardModal";
import SaveScenarioModal from "./components/modals/SaveScenarioModal";
import RenameWorkspaceModal from "./components/modals/RenameWorkspaceModal";
import ThemePickerModal from "./components/modals/ThemePickerModal";
import SupportPage from "./pages/SupportPage";
import GraphCanvas from "./components/GraphCanvas";
import CostAccumulationView from "./components/CostAccumulationView";
import OptimizeWorkspacePanel from "./components/OptimizeWorkspacePanel";
import BaselineComparisonPanel from "./components/BaselineComparisonPanel";
import RunWorkspacePanel from "./components/RunWorkspacePanel";
import ControlPanel from "./components/ControlPanel";
import LaneEditorPanel from "./components/LaneEditorPanel";
import NodeEditorPanel from "./components/NodeEditorPanel";
import InsightPanel from "./components/InsightPanel";
import DisruptionDeck from "./components/DisruptionDeck";
import ActiveDisruptionBanner from "./components/ActiveDisruptionBanner";
import CollapsibleSection from "./ui/CollapsibleSection";
import { buttonStyle, cardStyle, money, num, riskColor } from "./ui/formatters";
import { shuffleDeck, applyCard } from "./data/disruptionCards";
import { applyTransportEffects } from "./sim/applyTransportEffects";
import { applyLaneTransportCost } from "./sim/applyLaneTransportCost";
import WelcomeModal from "./components/modals/WelcomeModal";
import { getAppModeConfig, getAppModeEntries } from "./config/appModes";
import { DEFAULT_SELECTED_KPIS } from "./config/kpis";
import {
  applyThemePalette,
  DEFAULT_THEME_PALETTE,
  THEME,
  THEME_STORAGE_KEY,
} from "./config/theme";
import { applyBoundaryModesToNodes } from "./sim/graphHelpers";
import { createRunSimulationState, stepRunSimulation, summarizeRunState } from "./sim/timeStepEngine";
import useWindowSize from "./hooks/useWindowSize";
import { scaleClamp, scaleNum } from "./theme/uiScale";
import KpiSelectorPanel from "./components/KpiSelectorPanel";

const LOCATION_OPTIONS = [
  { value: "north_america", label: "North America" },
  { value: "latin_america", label: "Latin America" },
  { value: "europe", label: "Europe" },
  { value: "east_asia", label: "East Asia" },
  { value: "south_asia", label: "South Asia" },
  { value: "southeast_asia", label: "Southeast Asia" },
];

const SOURCING_POSTURE_OPTIONS = [
  { value: "domestic", label: "Domestic" },
  { value: "nearshore", label: "Nearshore" },
  { value: "offshore", label: "Offshore" },
];

const BOUNDARY_OPTIONS = [
  { value: 0, label: "After Suppliers" },
  { value: 1, label: "After Factories" },
  { value: 2, label: "After DCs" },
  { value: 3, label: "After Retail" },
];

const WORKSPACE_OPTIONS = [
  { id: "design", label: "Design" },
  { id: "run", label: "Run" },
  { id: "optimize", label: "Optimize" },
  { id: "learn", label: "Learn" },
];

function selectedCustomerNode(selectedNode, nodes) {
  if (selectedNode?.type === NodeType.CUSTOMER) return selectedNode;
  return nodes.find((n) => n.type === NodeType.CUSTOMER) ?? null;
}

function simulationRowForNode(result, nodeId) {
  return result?.perNode?.find((row) => row.id === nodeId) ?? null;
}

function nodesNeedBoundarySync(currentNodes, nextNodes) {
  if (currentNodes.length !== nextNodes.length) return true;

  return currentNodes.some((node, index) => {
    const nextNode = nextNodes[index];
    return (
      node.mode !== nextNode.mode ||
      Boolean(node.flags?.upstreamRetail) !== Boolean(nextNode.flags?.upstreamRetail)
    );
  });
}

function selectedPerNodeRowBackground() {
  if (THEME.colors.background === "#0B1220") {
    return "rgba(124,179,255,0.18)";
  }

  return "#eaf5ff";
}

function layoutTierFromWidth(width) {
  if (width < 1100) return "small";
  if (width <= 1600) return "medium";
  return "large";
}

export default function App() {
  const { mode, setMode, modeConfig } = useAppMode();
  const {
    nodes,
    setNodes,
    edges,
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
    supportedServiceLevels,
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
    updateNode,
    removeNodeById,
    removeSelectedNode,
    moveNode,
    autoLayout,
    addCustomEdge,
    updateLane,
    removeEdgeById,
    addParallelSupplierToSelected,
    addBranchCustomerFromSelected,
    addUpstreamNodeToSelected,
    addDownstreamNodeFromSelected,
    updateCustomerDemand,
    loadScenario,
    resetScenario,
  } = useSimulatorState();

  const [saveName, setSaveName] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [supplyChainName, setSupplyChainName] = useState("Supply Chain Workspace");
  const [pendingSupplyChainName, setPendingSupplyChainName] = useState("");
  const [currentView, setCurrentView] = useState("simulator");
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
  const [isSaveScenarioOpen, setIsSaveScenarioOpen] = useState(false);
  const [isRenameWorkspaceOpen, setIsRenameWorkspaceOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isKpiSelectorOpen, setIsKpiSelectorOpen] = useState(false);
  const [boundaryColumn, setBoundaryColumn] = useState(2);
  const [globalDemandMode, setGlobalDemandMode] = useState(true);
  const [autoInventoryType, setAutoInventoryType] = useState(true);
  const [activeTool, setActiveTool] = useState("select");
  const [connectSourceNodeId, setConnectSourceNodeId] = useState(null);
  const [selectedKpis, setSelectedKpis] = useState(DEFAULT_SELECTED_KPIS);
  const [baselineEnabled, setBaselineEnabled] = useState(false);
  const [baselineResult, setBaselineResult] = useState(null);
  const [baselineNodes, setBaselineNodes] = useState(null);
  const [baselineEdges, setBaselineEdges] = useState(null);
  const [baselineBoundaryColumn, setBaselineBoundaryColumn] = useState(null);
  const [coachingEnabled, setCoachingEnabled] = useState(
    Boolean(modeConfig.showCoaching && modeConfig.defaults?.coachingEnabled)
  );
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  const [drawPile, setDrawPile] = useState(() => shuffleDeck());
  const [discardPile, setDiscardPile] = useState([]);
  const [viewMode, setViewMode] = useState("graph");
  const [currentWorkspace, setCurrentWorkspace] = useState("design");
  const [optimizeSnapshots, setOptimizeSnapshots] = useState([]);
  const [runState, setRunState] = useState(() => createRunSimulationState([], []));
  const [runHistory, setRunHistory] = useState([]);
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === "undefined") {
      return applyThemePalette(DEFAULT_THEME_PALETTE);
    }

    try {
      const storedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);
      return applyThemePalette(storedThemeId || DEFAULT_THEME_PALETTE);
    } catch {
      return applyThemePalette(DEFAULT_THEME_PALETTE);
    }
  });
  const windowSize = useWindowSize();
  const layoutTier = layoutTierFromWidth(windowSize.width);
  const isSmallLayout = layoutTier === "small";
  const leftPanelWidth = "clamp(240px, 16vw, 300px)";
  const rightPanelWidth = "clamp(240px, 16vw, 320px)";
  const preferredGraphHeight = Math.max(500, Math.min(windowSize.height * 0.6, 900));

  const activeCard = discardPile.length ? discardPile[discardPile.length - 1] : null;

  const effectiveScenario = useMemo(() => {
    return applyCard({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      parameters: structuredClone(parameters),
      card: activeCard,
    });
  }, [nodes, edges, parameters, activeCard]);

  const transformedEdges = useMemo(() => {
    return applyTransportEffects(effectiveScenario.edges);
  }, [effectiveScenario.edges]);

  const simulationState = useMemo(() => {
    try {
      const baseResult = runSimulation(
        {
          nodes: effectiveScenario.nodes,
          edges: transformedEdges.map((edge) => ({
            ...edge,
            L: edge.effectiveL ?? edge.L,
            s: edge.effectiveSigma ?? edge.s,
          })),
        },
        {
          serviceLevel,
          parameters: effectiveScenario.parameters,
          inventoryMode: autoInventoryType ? "auto" : "manual",
        }
      );
      const result = applyLaneTransportCost(baseResult, transformedEdges);
      return { result, error: null };
    } catch (error) {
      return { result: null, error };
    }
  }, [effectiveScenario, transformedEdges, serviceLevel, autoInventoryType]);

  const result = simulationState.result;
  const simulationError = simulationState.error;
  const availableWorkspaces = useMemo(
    () =>
      mode === "business"
        ? WORKSPACE_OPTIONS.filter((workspace) => workspace.id !== "run")
        : WORKSPACE_OPTIONS,
    [mode]
  );
  const runSummary = useMemo(
    () => summarizeRunState(runState, effectiveScenario.nodes),
    [runState, effectiveScenario.nodes]
  );
  const averageRunInventory = useMemo(
    () =>
      effectiveScenario.nodes.length > 0
        ? runSummary.totalInventory / effectiveScenario.nodes.length
        : 0,
    [effectiveScenario.nodes.length, runSummary.totalInventory]
  );
  const runNodeStateById = useMemo(
    () =>
      Object.fromEntries(
        effectiveScenario.nodes.map((node) => [
          node.id,
          {
            inventory: runState.inventoryByNodeId[node.id] ?? 0,
            backlog: runState.backlogByNodeId[node.id] ?? 0,
            demand: runState.demandByNodeId[node.id] ?? 0,
            arrivals: runState.arrivalsByNodeId[node.id] ?? 0,
            unmetCustomerDemand: runState.unmetCustomerDemandByNodeId?.[node.id] ?? 0,
            carriesInventory: node.type !== NodeType.CUSTOMER,
            inventoryHot:
              node.type !== NodeType.CUSTOMER &&
              averageRunInventory > 0 &&
              (runState.inventoryByNodeId[node.id] ?? 0) >= averageRunInventory * 1.25,
          },
        ])
      ),
    [averageRunInventory, effectiveScenario.nodes, runState]
  );

  const activeCustomer = selectedCustomerNode(selectedNode, nodes);
  const currentMu = Number(activeCustomer?.demand?.mu ?? 100);
  const currentSigma = Number(activeCustomer?.demand?.sigma ?? 20);
  const selectedNodeResult = simulationRowForNode(result, selectedNodeId);
  const showDetailedCost = modeConfig.showDetailedCost;
  const showAdvancedControls = modeConfig.showAdvancedControls;
  const showCoaching = modeConfig.showCoaching;

  function applyGlobalBoundary(newBoundaryColumn) {
    setBoundaryColumn(newBoundaryColumn);

    setNodes((prevNodes) => applyBoundaryModesToNodes(prevNodes, edges, newBoundaryColumn));
  }

  useEffect(() => {
    setNodes((prevNodes) => {
      const nextNodes = applyBoundaryModesToNodes(prevNodes, edges, boundaryColumn);
      return nodesNeedBoundarySync(prevNodes, nextNodes) ? nextNodes : prevNodes;
    });
  }, [boundaryColumn, edges, nodes.length, setNodes]);

  useEffect(() => {
    const nextThemeId = applyThemePalette(themeId);

    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextThemeId);
    } catch {
      // Ignore storage failures and keep the current in-memory selection.
    }
  }, [themeId]);

  useEffect(() => {
    if (activeTool !== "connectNodes" && connectSourceNodeId) {
      setConnectSourceNodeId(null);
    }
  }, [activeTool, connectSourceNodeId]);

  useEffect(() => {
    setRunState(createRunSimulationState(effectiveScenario.nodes, effectiveScenario.edges));
    setRunHistory([]);
  }, [effectiveScenario.nodes, effectiveScenario.edges]);

  useEffect(() => {
    if (mode === "business" && currentWorkspace === "run") {
      setCurrentWorkspace("design");
    }
  }, [mode, currentWorkspace]);

  function handleLoadScenario(sampleScenario) {
    loadScenario(sampleScenario);

    const scenarioTitle = sampleScenario?.title ?? sampleScenario?.name ?? "";
    setSupplyChainName(String(scenarioTitle).trim() || "Supply Chain Workspace");

    if (sampleScenario?.boundaryColumn != null) {
      setBoundaryColumn(sampleScenario.boundaryColumn);
    }

    setGlobalDemandMode(true);
    setAutoInventoryType(true);
    setIsNodeEditorOpen(false);
    setIsLaneEditorOpen(false);
    setSelectedEdgeId(null);
  }

  function handleResetScenario() {
    resetScenario();
    setSupplyChainName("Supply Chain Workspace");
    setBoundaryColumn(2);
    setIsLaneEditorOpen(false);
    setSelectedEdgeId(null);
    setIsNodeEditorOpen(false);
  }

  function handleSaveRun() {
    if (!result) return;

    saveRunToLeaderboard({
      name: saveName.trim() || `Scenario ${leaderboardEntries.length + 1}`,
      notes: [
        activeCard ? `Active disruption: ${activeCard.title}` : null,
        saveNotes.trim() || null,
      ]
        .filter(Boolean)
        .join(" | "),
      totalSupplyChainCost: result.totalSupplyChainCost,
      totalInventory: result.totalInventory,
      totalResponseTime: result.totalResponseTime,
      aggregateRiskScore: result.aggregateRiskScore,
      aggregateRiskLabel: result.aggregateRiskLabel,
      maxRiskNodeName: result.maxRiskNode?.name ?? "N/A",
      maxRiskNode: result.maxRiskNode ?? null,
      nodeCount: effectiveScenario.nodes.length,
      edgeCount: effectiveScenario.edges.length,
    });

    setSaveName("");
    setSaveNotes("");
    setIsSaveScenarioOpen(false);
    openLeaderboard();
  }

  function handleCustomerDemandChange(mu, sigma) {
    if (!globalDemandMode) {
      if (selectedNode?.type === NodeType.CUSTOMER) {
        updateNode(selectedNode.id, (node) => ({
          ...node,
          demand: { mu, sigma },
        }));
      }
      return;
    }

    updateCustomerDemand(mu, sigma);
  }

  function openNodeEditor(nodeId) {
    setSelectedNodeId(nodeId);
    setIsNodeEditorOpen(true);
  }

  function handlePinBaseline() {
    if (!result) return;
    setBaselineResult(structuredClone(result));
    setBaselineNodes(structuredClone(effectiveScenario.nodes));
    setBaselineEdges(structuredClone(effectiveScenario.edges));
    setBaselineBoundaryColumn(boundaryColumn);
  }

  function handleDraw() {
    if (!drawPile.length) return;
    const [next, ...rest] = drawPile;
    setDrawPile(rest);
    setDiscardPile((prev) => [...prev, next]);
  }

  function handleResetDeck() {
    setDrawPile(shuffleDeck());
    setDiscardPile([]);
  }

  function handleClearActiveDisruption() {
    setDiscardPile([]);
  }

  function handleSelectMode(nextMode) {
    const nextModeConfig = getAppModeConfig(nextMode);
    setMode(nextMode);
    setCoachingEnabled(
      Boolean(nextModeConfig.showCoaching && nextModeConfig.defaults?.coachingEnabled)
    );
    closeParameters();
    setIsWelcomeOpen(false);
  }

  function handleEditSupplyChainName() {
    setPendingSupplyChainName(supplyChainName);
    setIsRenameWorkspaceOpen(true);
  }

  function handleToggleKpi(kpiId) {
    setSelectedKpis((prev) => {
      if (prev.includes(kpiId)) {
        return prev.length === 1 ? prev : prev.filter((id) => id !== kpiId);
      }

      return [...prev, kpiId];
    });
  }

  function handleCreateConnection(fromNodeId, toNodeId) {
    if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) return;
    addCustomEdge(fromNodeId, toNodeId);
    setSelectedNodeId(toNodeId);
    setSelectedEdgeId(null);
    setConnectSourceNodeId(null);
  }

  function handleDeleteNode(nodeId) {
    if (!nodeId) return;
    removeNodeById(nodeId);
    if (selectedNodeId === nodeId) {
      setIsNodeEditorOpen(false);
    }
    if (connectSourceNodeId === nodeId) {
      setConnectSourceNodeId(null);
    }
  }

  function handleDeleteEdge(edgeId) {
    if (!edgeId) return;
    removeEdgeById(edgeId);
  }

  function handleStepRunSimulation() {
    const nextState = stepRunSimulation(runState, effectiveScenario.nodes, effectiveScenario.edges);
    const nextSummary = summarizeRunState(nextState, effectiveScenario.nodes);

    setRunState(nextState);
    setRunHistory((prev) => [
      ...prev,
      {
        timestep: nextState.currentTimeStep,
        totalInventory: nextSummary.totalInventory,
        totalBacklog: nextSummary.totalBacklog,
        inTransitUnits: nextSummary.inTransitUnits,
        customerDemand: nextSummary.totalCustomerDemand,
        serviceFailure: nextSummary.totalServiceFailure,
      },
    ]);
  }

  function handleResetRunSimulation() {
    setRunState(createRunSimulationState(effectiveScenario.nodes, effectiveScenario.edges));
    setRunHistory([]);
  }

  function handleSaveOptimizeSnapshot() {
    if (!result) return;

    const snapshotNumber = optimizeSnapshots.length + 1;
    const defaultName = snapshotNumber === 1 ? "Baseline" : `Scenario ${snapshotNumber}`;
    const now = new Date();
    const snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: defaultName,
      savedAt: now.toISOString(),
      savedAtLabel: now.toLocaleString(),
      isBaseline: optimizeSnapshots.length === 0,
      parentId: null,
      scenarioName: supplyChainName,
      boundaryColumn,
      serviceLevel,
      nodes: structuredClone(effectiveScenario.nodes),
      edges: structuredClone(effectiveScenario.edges),
      parameters: structuredClone(effectiveScenario.parameters),
      metrics: {
        totalCost: result.totalSupplyChainCost,
        inventoryCost: result.totalInventory,
        transportCost: result.totalLaneTransportCost ?? 0,
        responseTime: result.totalResponseTime,
        aggregateRiskScore: result.aggregateRiskScore,
        aggregateRiskLabel: result.aggregateRiskLabel,
        serviceLevel,
      },
    };

    setOptimizeSnapshots((prev) => [...prev, snapshot]);
  }

  function handleRenameOptimizeSnapshot(snapshotId, nextName) {
    setOptimizeSnapshots((prev) =>
      prev.map((snapshot) =>
        snapshot.id === snapshotId ? { ...snapshot, name: nextName } : snapshot
      )
    );
  }

  function handleDuplicateOptimizeSnapshot(snapshotId) {
    const snapshot = optimizeSnapshots.find((item) => item.id === snapshotId);
    if (!snapshot) return;

    loadScenario({
      nodes: structuredClone(snapshot.nodes),
      edges: structuredClone(snapshot.edges),
      serviceLevel: snapshot.serviceLevel ?? snapshot.metrics?.serviceLevel ?? serviceLevel,
    });
    setParameters(structuredClone(snapshot.parameters ?? parameters));
    setBoundaryColumn(snapshot.boundaryColumn ?? 2);
    setSupplyChainName(`${snapshot.name} (copy)`);
    setCurrentWorkspace("design");
    setViewMode("graph");
    setActiveTool("select");
    setConnectSourceNodeId(null);
    setIsNodeEditorOpen(false);
  }

  function handleDeleteOptimizeSnapshot(snapshotId) {
    setOptimizeSnapshots((prev) => {
      const deleted = prev.find((snapshot) => snapshot.id === snapshotId);
      const fallbackParentId = deleted?.parentId ?? null;
      const nextSnapshots = prev
        .filter((snapshot) => snapshot.id !== snapshotId)
        .map((snapshot) =>
          snapshot.parentId === snapshotId
            ? { ...snapshot, parentId: fallbackParentId }
            : snapshot
        );

      if (nextSnapshots.length === 0) {
        return [];
      }

      if (nextSnapshots.some((snapshot) => snapshot.isBaseline)) {
        return nextSnapshots;
      }

      return nextSnapshots.map((snapshot, index) => ({
        ...snapshot,
        isBaseline: index === 0,
      }));
    });
  }

  function handleSetOptimizeBaseline(snapshotId) {
    setOptimizeSnapshots((prev) =>
      prev.map((snapshot) => ({
        ...snapshot,
        isBaseline: snapshot.id === snapshotId,
      }))
    );
  }

  function handleCloseRenameWorkspace() {
    setIsRenameWorkspaceOpen(false);
  }

  function handleSaveSupplyChainName() {
    setSupplyChainName(pendingSupplyChainName.trim() || "Supply Chain Workspace");
    setIsRenameWorkspaceOpen(false);
  }

  function workspacePlaceholder(title, description, action = null) {
    return (
      <div
        style={{
          ...cardStyle(),
          display: "grid",
          gap: scaleNum(10),
        }}
      >
        <div
          style={{
            fontSize: scaleNum(18),
            fontWeight: 700,
            color: THEME.colors.textPrimary,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: scaleNum(14),
            lineHeight: 1.5,
            color: THEME.colors.textMuted,
          }}
        >
          {description}
        </div>
        {action}
      </div>
    );
  }

  const graphWorkspace = (
    <MainWorkspaceCanvas>
      <GraphCanvas
        title={supplyChainName}
        nodes={nodes}
        edges={edges}
        result={result}
        runNodeStateById={mode === "educator" && currentWorkspace === "run" ? runNodeStateById : null}
        boundaryColumn={boundaryColumn}
        autoInventoryType={autoInventoryType}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        activeTool={activeTool}
        connectSourceNodeId={connectSourceNodeId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        costView={
          <CostAccumulationView
            nodes={nodes}
            edges={transformedEdges}
            result={result}
            embedded
          />
        }
        onSelectNode={(nodeId) => {
          setSelectedNodeId(nodeId);
          setSelectedEdgeId(null);
        }}
        onSelectEdge={(edgeId) => {
          setSelectedEdgeId(edgeId);
        }}
        onCreateConnection={handleCreateConnection}
        onDeleteNode={handleDeleteNode}
        onDeleteEdge={handleDeleteEdge}
        onSetConnectSourceNodeId={setConnectSourceNodeId}
        onAutoLayout={autoLayout}
        onMoveNode={moveNode}
        onOpenNodeEditor={openNodeEditor}
        onOpenLaneEditor={() => setIsLaneEditorOpen(true)}
        onEditTitle={handleEditSupplyChainName}
        preferredViewportHeight={preferredGraphHeight}
      />
    </MainWorkspaceCanvas>
  );

  const designInspector = (
    <ControlPanel
      selectedNode={selectedNode}
      selectedEdge={selectedEdge}
      selectedNodeId={selectedNodeId}
      nodes={nodes}
      serviceLevel={serviceLevel}
      serviceLevelIndex={serviceLevelIndex}
      supportedServiceLevels={supportedServiceLevels}
      onServiceLevelIndexChange={setServiceLevelIndex}
      boundaryColumn={boundaryColumn}
      boundaryOptions={BOUNDARY_OPTIONS}
      onBoundaryChange={applyGlobalBoundary}
      globalDemandMode={globalDemandMode}
      onGlobalDemandModeChange={setGlobalDemandMode}
      autoInventoryType={autoInventoryType}
      onAutoInventoryTypeChange={setAutoInventoryType}
      baselineEnabled={baselineEnabled}
      onBaselineEnabledChange={setBaselineEnabled}
      showCoaching={showCoaching}
      coachingEnabled={coachingEnabled}
      onCoachingEnabledChange={setCoachingEnabled}
      activeCustomer={activeCustomer}
      currentMu={currentMu}
      currentSigma={currentSigma}
      onCustomerDemandChange={handleCustomerDemandChange}
      addParallelSupplierToSelected={addParallelSupplierToSelected}
      addBranchCustomerFromSelected={addBranchCustomerFromSelected}
      addUpstreamNodeToSelected={addUpstreamNodeToSelected}
      addDownstreamNodeFromSelected={addDownstreamNodeFromSelected}
      removeSelectedNode={removeSelectedNode}
      autoLayout={autoLayout}
    />
  );

  const workspaceInspector =
    currentWorkspace === "design" ? (
      designInspector
    ) : currentWorkspace === "run" ? (
      <LeftInspector
        title="Run Inspector"
        subtitle="Step through the network over time to illustrate inventory flow, backlog formation, and shipment delays."
      >
        <RunWorkspacePanel
          runState={runState}
          runSummary={runSummary}
          runHistory={runHistory}
          onStep={handleStepRunSimulation}
          onReset={handleResetRunSimulation}
        />
      </LeftInspector>
    ) : currentWorkspace === "optimize" ? (
      <LeftInspector
        title="Optimize Inspector"
        subtitle="Compare saved snapshots with the KPIs that matter most to your current business decision."
      >
        <div style={{ display: "grid", gap: scaleNum(12) }}>
          {mode === "business" ? (
            <KpiSelectorPanel
              selectedKpis={selectedKpis}
              onToggleKpi={handleToggleKpi}
              isOpen={isKpiSelectorOpen}
              onOpen={() => setIsKpiSelectorOpen(true)}
              onClose={() => setIsKpiSelectorOpen(false)}
            />
          ) : null}

          <div
            style={{
              ...cardStyle(),
              display: "grid",
              gap: scaleNum(10),
            }}
          >
            <div
              style={{
                fontSize: scaleNum(14),
                fontWeight: 700,
                color: THEME.colors.textPrimary,
              }}
            >
              Snapshot controls
            </div>
            <div
              style={{
                fontSize: scaleNum(13),
                lineHeight: 1.5,
                color: THEME.colors.textMuted,
              }}
            >
              Save session snapshots of the current scenario and compare them using the
              selected KPI set. Snapshot analysis changes emphasis only, not engine math.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: scaleNum(8),
              }}
            >
              <div
                style={{
                  border: `1px solid ${THEME.colors.border}`,
                  borderRadius: THEME.radius.md,
                  padding: scaleNum(10),
                  background: THEME.colors.surfaceRow ?? THEME.colors.background,
                }}
              >
                <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted }}>
                  Snapshots
                </div>
                <div style={{ fontSize: scaleNum(18), fontWeight: 700, color: THEME.colors.textPrimary }}>
                  {optimizeSnapshots.length}
                </div>
              </div>
              <div
                style={{
                  border: `1px solid ${THEME.colors.border}`,
                  borderRadius: THEME.radius.md,
                  padding: scaleNum(10),
                  background: THEME.colors.surfaceRow ?? THEME.colors.background,
                }}
              >
                <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted }}>
                  Selected KPIs
                </div>
                <div style={{ fontSize: scaleNum(18), fontWeight: 700, color: THEME.colors.textPrimary }}>
                  {selectedKpis.length}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveOptimizeSnapshot}
              style={buttonStyle("primary")}
              disabled={!result}
            >
              Save Snapshot
            </button>
          </div>
        </div>
      </LeftInspector>
    ) : (
      <LeftInspector
        title="Learn Inspector"
        subtitle="This workspace will host guided walkthroughs, teaching cues, and scenario-based exploration."
      >
        {workspacePlaceholder(
          "Learning workspace foundation",
          "Use the Learning modal today while this dedicated instructional surface is being built.",
          <button type="button" onClick={openLearning} style={buttonStyle("primary")}>
            Open Learning Center
          </button>
        )}
      </LeftInspector>
    );

  const sharedAnalysisPanels = (
    <>
      {activeCard && (
        <ActiveDisruptionBanner
          activeCard={activeCard}
          onClear={handleClearActiveDisruption}
        />
      )}

      {currentWorkspace === "learn"
        ? workspacePlaceholder(
          `${WORKSPACE_OPTIONS.find((workspace) => workspace.id === currentWorkspace)?.label ?? "Workspace"} placeholder`,
            "The Learn workspace will eventually organize teaching-oriented panels, structured explanations, and activity guidance here."
          )
        : null}

      {currentWorkspace === "optimize" ? (
        <OptimizeWorkspacePanel
          selectedKpis={selectedKpis}
          snapshots={optimizeSnapshots}
          currentScenarioName={supplyChainName}
          onSaveSnapshot={handleSaveOptimizeSnapshot}
          onDuplicateSnapshot={handleDuplicateOptimizeSnapshot}
          onRenameSnapshot={handleRenameOptimizeSnapshot}
          onDeleteSnapshot={handleDeleteOptimizeSnapshot}
          onSetBaseline={handleSetOptimizeBaseline}
        />
      ) : null}

      {result && (
        <MetricCards
          result={result}
          layoutTier={layoutTier}
          isBusinessMode={mode === "business"}
          selectedKpis={selectedKpis}
          serviceLevel={serviceLevel}
        />
      )}

      {result && baselineEnabled && (
        <BaselineComparisonPanel
          current={result}
          baseline={baselineResult}
          onPinBaseline={handlePinBaseline}
        />
      )}

      {result && showCoaching && coachingEnabled && currentWorkspace !== "optimize" && (
        <div style={{ width: "100%", margin: 0 }}>
          <InsightPanel
            enabled={coachingEnabled}
            onToggleEnabled={setCoachingEnabled}
            currentResult={result}
            baselineResult={baselineResult}
            currentNodes={effectiveScenario.nodes}
            baselineNodes={baselineNodes}
            currentEdges={effectiveScenario.edges}
            baselineEdges={baselineEdges}
            currentBoundaryColumn={boundaryColumn}
            baselineBoundaryColumn={baselineBoundaryColumn}
          />
        </div>
      )}

      {!graphValidation.isValid && (
        <div
          style={{
            ...cardStyle(),
            border: `1px solid ${THEME.colors.danger}`,
            background: THEME.colors.surface,
          }}
        >
          <h2 style={{ marginTop: 0, color: THEME.colors.danger }}>Graph Validation Issues</h2>
          <ul style={{ marginBottom: 0 }}>
            {graphValidation.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {simulationError && (
        <div
          style={{
            ...cardStyle(),
            border: `1px solid ${THEME.colors.danger}`,
            background: THEME.colors.surface,
          }}
        >
          <h2 style={{ marginTop: 0, color: THEME.colors.danger }}>Simulation Error</h2>
          <div style={{ marginBottom: 8 }}>
            {simulationError?.message ?? "Unknown simulation error"}
          </div>
          <div style={{ color: THEME.colors.textMuted }}>
            The app kept running, but the current network arrangement could not be
            evaluated. Try checking lane directions, removing cycles, or resetting the scenario.
          </div>
        </div>
      )}

      <CollapsibleSection
        title="Per-Node View"
        isOpen={isTableOpen}
        onToggle={() => setIsTableOpen((prev) => !prev)}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="6"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              background: THEME.colors.surface,
            }}
          >
            <thead style={{ background: THEME.colors.background }}>
              <tr>
                <th>Node</th>
                <th>Type</th>
                <th>Mode</th>
                <th>Stock Form</th>
                <th>Location</th>
                <th>Mu</th>
                <th>Sigma</th>
                <th>L</th>
                <th>s</th>
                <th>R</th>
                <th>Stage Time</th>
                <th>Response Time</th>
                <th>PS</th>
                <th>SS</th>
                {showDetailedCost ? <th>Unit $</th> : null}
                {showDetailedCost ? <th>Pipeline $</th> : null}
                {showDetailedCost ? <th>Safety Stock $</th> : null}
                {showDetailedCost ? <th>Node Added $</th> : null}
                {showDetailedCost ? <th>Total $</th> : null}
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {(result?.perNode ?? []).map((r) => (
                <tr
                  key={r.id}
                  style={{
                    background:
                      r.id === selectedNodeId ? selectedPerNodeRowBackground() : "transparent",
                  }}
                >
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.mode}</td>
                  <td>{r.inventoryType}</td>
                  <td>{r.location}</td>
                  <td>{num(r.mu)}</td>
                  <td>{num(r.sigma)}</td>
                  <td>{num(r.L)}</td>
                  <td>{num(r.s)}</td>
                  <td>{num(r.R)}</td>
                  <td>{num(r.stageTimeDays, 1)}</td>
                  <td>{num(r.responseTimeDays, 1)}</td>
                  <td>{num(r.PS)}</td>
                  <td>{num(r.SS)}</td>
                  {showDetailedCost ? <td>{money(r.unitValue)}</td> : null}
                  {showDetailedCost ? <td>{money(r.PSValue)}</td> : null}
                  {showDetailedCost ? <td>{money(r.SSValue)}</td> : null}
                  {showDetailedCost ? <td>{money(r.nodeAddedCost)}</td> : null}
                  {showDetailedCost ? <td>{money(r.totalValue)}</td> : null}
                  <td
                    style={{
                      color: riskColor(r.riskLabel),
                      fontWeight: 700,
                    }}
                  >
                    {r.riskLabel} ({num(r.riskScore, 2)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <LaneEditorPanel
        isOpen={isLaneEditorOpen}
        onToggle={() => setIsLaneEditorOpen((prev) => !prev)}
        nodes={nodes}
        edges={edges}
        selectedEdge={selectedEdge}
        selectedEdgeId={selectedEdgeId}
        onSelectEdge={setSelectedEdgeId}
        onUpdateLane={updateLane}
      />
    </>
  );

  const simulatorView = (
    <WorkspaceShell
      toolRibbon={
        <ToolRibbon
          currentWorkspace={currentWorkspace}
          workspaces={availableWorkspaces}
          onChangeWorkspace={setCurrentWorkspace}
          activeTool={activeTool}
          onChangeActiveTool={setActiveTool}
          showParameters={showAdvancedControls}
          onOpenSaveScenario={() => setIsSaveScenarioOpen(true)}
          onOpenParameters={showAdvancedControls ? openParameters : undefined}
          onOpenLearning={openLearning}
          onOpenLeaderboard={openLeaderboard}
          onOpenThemePicker={() => setIsThemePickerOpen(true)}
          onResetScenario={handleResetScenario}
        />
      }
      leftSidebar={workspaceInspector}
      mainCanvas={graphWorkspace}
      rightSidebar={
        <DisruptionDeck
          drawPile={drawPile}
          discardPile={discardPile}
          activeCard={activeCard}
          onDraw={handleDraw}
          onReset={handleResetDeck}
          layoutTier={layoutTier}
        />
      }
      lowerPanels={sharedAnalysisPanels}
      isSmallLayout={isSmallLayout}
      leftPanelWidth={leftPanelWidth}
      rightPanelWidth={rightPanelWidth}
    />
  );

  const aboutView = (
    <AboutPage />
  );

  const supportView = (
    <SupportPage
      mode={mode}
      scenarioName={supplyChainName}
      nodeCount={nodes.length}
      edgeCount={edges.length}
      boundaryColumn={boundaryColumn}
    />
  );

  return (
    <div
      style={{
        padding: scaleClamp(10, 1.6, 22),
        fontFamily: "system-ui, sans-serif",
        fontSize: scaleNum(14),
        background: THEME.colors.background,
        minHeight: "100vh",
        color: THEME.colors.textPrimary,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box" }}>
        <DashboardHeader
          subtitle={modeConfig.labels?.headerSubtitle}
          modeLabel={modeConfig.shortLabel}
          currentView={currentView}
          onChangeView={setCurrentView}
          onOpenSaveScenario={() => setIsSaveScenarioOpen(true)}
          showParameters={showAdvancedControls}
          onOpenParameters={showAdvancedControls ? openParameters : undefined}
          onOpenLearning={openLearning}
          onOpenLeaderboard={openLeaderboard}
          onOpenThemePicker={() => setIsThemePickerOpen(true)}
          onResetScenario={handleResetScenario}
        />

        {currentView === "simulator" ? (
          simulatorView
        ) : currentView === "about" ? (
          aboutView
        ) : (
          supportView
        )}
      </div>

      <NodeEditorPanel
        isOpen={isNodeEditorOpen}
        onClose={() => setIsNodeEditorOpen(false)}
        selectedNode={selectedNode}
        selectedNodeResult={selectedNodeResult}
        autoInventoryType={autoInventoryType}
        showDetailedCost={showDetailedCost}
        locationOptions={LOCATION_OPTIONS}
        sourcingPostureOptions={SOURCING_POSTURE_OPTIONS}
        onUpdateNode={updateNode}
        onRemoveSelectedNode={removeSelectedNode}
      />

      {showAdvancedControls ? (
        <ParametersModal
          isOpen={isParametersOpen}
          onClose={closeParameters}
          parameters={parameters}
          updateParameters={updateParameters}
          resetParameters={resetParameters}
        />
      ) : null}

      <LearningModal
        isOpen={isLearningOpen}
        onClose={closeLearning}
        onLoadScenario={handleLoadScenario}
      />

      <WelcomeModal
        isOpen={isWelcomeOpen}
        currentMode={mode}
        modeOptions={getAppModeEntries()}
        onSelectMode={handleSelectMode}
        projectTitle="FlowLogic Studio"
        authors={["Author Name 1", "Author Name 2"]}
        affiliation="University of Wyoming"
        purpose="An interactive supply chain design sandbox for exploring flow, cost, risk, response time, and disruption exposure."
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={closeLeaderboard}
        leaderboardEntries={leaderboardEntries}
        onClearLeaderboard={clearLeaderboard}
      />

      <SaveScenarioModal
        isOpen={isSaveScenarioOpen}
        saveName={saveName}
        saveNotes={saveNotes}
        canSave={Boolean(result)}
        onSaveNameChange={setSaveName}
        onSaveNotesChange={setSaveNotes}
        onClose={() => setIsSaveScenarioOpen(false)}
        onSave={handleSaveRun}
      />

      <RenameWorkspaceModal
        isOpen={isRenameWorkspaceOpen}
        workspaceName={pendingSupplyChainName}
        onWorkspaceNameChange={setPendingSupplyChainName}
        onClose={handleCloseRenameWorkspace}
        onSave={handleSaveSupplyChainName}
      />

      <ThemePickerModal
        isOpen={isThemePickerOpen}
        activeThemeId={themeId}
        onSelectTheme={setThemeId}
        onClose={() => setIsThemePickerOpen(false)}
      />
    </div>
  );
}

