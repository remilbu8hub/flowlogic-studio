// src/App.jsx

import { useEffect, useMemo, useState } from "react";
import { runSimulation } from "./sim/engine";
import { NodeType } from "./model/networkTypes";
import useSimulatorState from "./state/useSimulatorState";
import { useAppMode } from "./state/appModeContext";
import DashboardHeader from "./components/DashboardHeader";
import AboutPage from "./components/AboutPage";
import MetricCards from "./components/MetricCards";
import ParametersModal from "./components/ParametersModal";
import LearningModal from "./components/LearningModal";
import LeaderboardModal from "./components/LeaderboardModal";
import SaveScenarioModal from "./components/SaveScenarioModal";
import RenameWorkspaceModal from "./components/RenameWorkspaceModal";
import SupportPage from "./components/SupportPage";
import GraphCanvas from "./components/GraphCanvas";
import CostAccumulationView from "./components/CostAccumulationView";
import BaselineComparisonPanel from "./components/BaselineComparisonPanel";
import ControlPanel from "./components/ControlPanel";
import LaneEditorPanel from "./components/LaneEditorPanel";
import NodeEditorPanel from "./components/NodeEditorPanel";
import InsightPanel from "./components/InsightPanel";
import DisruptionDeck from "./components/DisruptionDeck";
import ActiveDisruptionBanner from "./components/ActiveDisruptionBanner";
import CollapsibleSection from "./components/CollapsibleSection";
import { cardStyle, money, num, riskColor } from "./components/formatters";
import { shuffleDeck, applyCard } from "./data/disruptionCards";
import { applyTransportEffects } from "./sim/applyTransportEffects";
import { applyLaneTransportCost } from "./sim/applyLaneTransportCost";
import WelcomeModal from "./components/WelcomeModal";
import { getAppModeConfig, getAppModeEntries } from "./config/appModes";
import { THEME } from "./config/theme";
import { applyBoundaryModesToNodes } from "./sim/graphHelpers";

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
    removeSelectedNode,
    moveNode,
    autoLayout,
    connectSelectedNodeTo,
    updateLane,
    removeSelectedEdge,
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
  const [connectTargetId, setConnectTargetId] = useState("");
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
  const [isSaveScenarioOpen, setIsSaveScenarioOpen] = useState(false);
  const [isRenameWorkspaceOpen, setIsRenameWorkspaceOpen] = useState(false);
  const [boundaryColumn, setBoundaryColumn] = useState(2);
  const [globalDemandMode, setGlobalDemandMode] = useState(true);
  const [autoInventoryType, setAutoInventoryType] = useState(true);
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

  function handleConnectSelected() {
    if (!selectedNodeId || !connectTargetId) return;
    connectSelectedNodeTo(connectTargetId);
    setSelectedEdgeId(null);
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

  function handleCloseRenameWorkspace() {
    setIsRenameWorkspaceOpen(false);
  }

  function handleSaveSupplyChainName() {
    setSupplyChainName(pendingSupplyChainName.trim() || "Supply Chain Workspace");
    setIsRenameWorkspaceOpen(false);
  }

  const simulatorView = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 320px) minmax(0, 1fr)",
        gap: "clamp(12px, 2vw, 18px)",
        alignItems: "start",
      }}
    >
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
        connectTargetId={connectTargetId}
        onConnectTargetIdChange={setConnectTargetId}
        onConnectSelected={handleConnectSelected}
        onRemoveSelectedEdge={removeSelectedEdge}
      />

      <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
            gap: "clamp(12px, 2vw, 18px)",
            alignItems: "start",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
            <GraphCanvas
              title={supplyChainName}
              nodes={nodes}
              edges={edges}
              result={result}
              boundaryColumn={boundaryColumn}
              autoInventoryType={autoInventoryType}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
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
              onAutoLayout={autoLayout}
              onMoveNode={moveNode}
              onOpenNodeEditor={openNodeEditor}
              onOpenLaneEditor={() => setIsLaneEditorOpen(true)}
              onEditTitle={handleEditSupplyChainName}
            />
          </div>

          <DisruptionDeck
            drawPile={drawPile}
            discardPile={discardPile}
            activeCard={activeCard}
            onDraw={handleDraw}
            onReset={handleResetDeck}
          />
        </div>

        {activeCard && (
          <ActiveDisruptionBanner
            activeCard={activeCard}
            onClear={handleClearActiveDisruption}
          />
        )}

        {result && <MetricCards result={result} />}

        {result && baselineEnabled && (
          <BaselineComparisonPanel
            current={result}
            baseline={baselineResult}
            onPinBaseline={handlePinBaseline}
          />
        )}

        {result && showCoaching && coachingEnabled && (
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
                      background: r.id === selectedNodeId ? "#eaf5ff" : "transparent",
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
      </div>
    </div>
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
        padding: "clamp(10px, 2vw, 18px)",
        fontFamily: "system-ui, sans-serif",
        background: THEME.colors.background,
        minHeight: "100vh",
        color: THEME.colors.textPrimary,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div style={{ width: "100%", margin: 0 }}>
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
          onResetScenario={handleResetScenario}
        />

        {currentView === "simulator" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "310px minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
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
            connectTargetId={connectTargetId}
            onConnectTargetIdChange={setConnectTargetId}
            onConnectSelected={handleConnectSelected}
            onRemoveSelectedEdge={removeSelectedEdge}
          />

          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 300px",
                gap: 16,
                alignItems: "start",
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
                <GraphCanvas
                  title={supplyChainName}
                  nodes={nodes}
                  edges={edges}
                  result={result}
                  boundaryColumn={boundaryColumn}
                  autoInventoryType={autoInventoryType}
                  selectedNodeId={selectedNodeId}
                  selectedEdgeId={selectedEdgeId}
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
                  onAutoLayout={autoLayout}
                  onMoveNode={moveNode}
                  onOpenNodeEditor={openNodeEditor}
                  onOpenLaneEditor={() => setIsLaneEditorOpen(true)}
                  onEditTitle={handleEditSupplyChainName}
                />
              </div>

              <DisruptionDeck
                drawPile={drawPile}
                discardPile={discardPile}
                activeCard={activeCard}
                onDraw={handleDraw}
                onReset={handleResetDeck}
              />
            </div>

            {activeCard && (
              <ActiveDisruptionBanner
                activeCard={activeCard}
                onClear={handleClearActiveDisruption}
              />
            )}

            {result && <MetricCards result={result} />}

            {result && baselineEnabled && (
              <BaselineComparisonPanel
                current={result}
                baseline={baselineResult}
                onPinBaseline={handlePinBaseline}
              />
            )}

            {result && showCoaching && coachingEnabled && (
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
                      <th>μ</th>
                      <th>σ</th>
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
                          background: r.id === selectedNodeId ? "#eaf5ff" : "transparent",
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
          </div>
        </div>
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
    </div>
  );
}
