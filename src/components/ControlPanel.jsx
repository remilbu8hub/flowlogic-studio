// src/components/ControlPanel.jsx

import { THEME } from "../config/theme";
import { NodeType } from "../model/networkTypes";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle, cardStyle, inputStyle, num } from "../ui/formatters";

function boundaryLabel(boundaryColumn, boundaryOptions) {
  return boundaryOptions.find((opt) => opt.value === boundaryColumn)?.label ?? "After DCs";
}

function demandModeLabel(selectedNode, globalDemandMode) {
  if (globalDemandMode) {
    return "Editing all customer groups together";
  }

  if (selectedNode?.type === NodeType.CUSTOMER) {
    return "Editing selected customer only";
  }

  return "Select a customer node to edit its demand";
}

function toolboxAvailability(selectedNode) {
  if (!selectedNode) {
    return {
      addUpstreamSupplier: false,
      addUpstreamFactory: false,
      addDownstreamDC: false,
      addDownstreamRetail: false,
      addDownstreamCustomer: false,
      addParallelSupplier: false,
      addCustomerBranch: false,
      removeSelectedNode: false,
      helper: "Select a node to enable toolbox actions.",
    };
  }

  const type = selectedNode.type;

  const addUpstreamSupplier =
    type === NodeType.FACTORY ||
    type === NodeType.DC ||
    type === NodeType.RETAIL ||
    type === NodeType.CUSTOMER;

  const addUpstreamFactory =
    type === NodeType.DC ||
    type === NodeType.RETAIL ||
    type === NodeType.CUSTOMER;

  const addDownstreamDC = type === NodeType.FACTORY || type === NodeType.DC;
  const addDownstreamRetail = type === NodeType.DC || type === NodeType.RETAIL;
  const addDownstreamCustomer = type === NodeType.DC || type === NodeType.RETAIL;
  const addParallelSupplier = type === NodeType.SUPPLIER || type === NodeType.FACTORY;
  const addCustomerBranch =
    type === NodeType.CUSTOMER ||
    type === NodeType.DC ||
    type === NodeType.RETAIL;

  let helper = "Choose a tool to reshape the supply chain.";
  if (type === NodeType.SUPPLIER) {
    helper = "Supplier selected: upstream redundancy is most relevant here.";
  } else if (type === NodeType.FACTORY) {
    helper = "Factory selected: add upstream sourcing or downstream distribution.";
  } else if (type === NodeType.DC) {
    helper = "DC selected: expand downstream fulfillment or add another echelon.";
  } else if (type === NodeType.RETAIL) {
    helper = "Retail selected: extend downstream to customers or add customer branches.";
  } else if (type === NodeType.CUSTOMER) {
    helper = "Customer selected: customer branches or upstream additions are available.";
  }

  return {
    addUpstreamSupplier,
    addUpstreamFactory,
    addDownstreamDC,
    addDownstreamRetail,
    addDownstreamCustomer,
    addParallelSupplier,
    addCustomerBranch,
    removeSelectedNode: true,
    helper,
  };
}

function ToolButton({ disabled, variant = "default", children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...buttonStyle(variant),
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: scaleNum(14),
      }}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

function panelStyle() {
  return {
    ...cardStyle(),
    background: THEME.colors.surface,
    border: `1px solid ${THEME.colors.border}`,
  };
}

export default function ControlPanel({
  selectedNode,
  selectedEdge,
  selectedNodeId,
  nodes,
  serviceLevel,
  serviceLevelIndex,
  supportedServiceLevels,
  onServiceLevelIndexChange,
  boundaryColumn,
  boundaryOptions,
  onBoundaryChange,
  globalDemandMode,
  onGlobalDemandModeChange,
  autoInventoryType,
  onAutoInventoryTypeChange,
  baselineEnabled,
  onBaselineEnabledChange,
  showCoaching,
  coachingEnabled,
  onCoachingEnabledChange,
  activeCustomer,
  currentMu,
  currentSigma,
  onCustomerDemandChange,
  addParallelSupplierToSelected,
  addBranchCustomerFromSelected,
  addUpstreamNodeToSelected,
  addDownstreamNodeFromSelected,
  removeSelectedNode,
  autoLayout,
  connectTargetId,
  onConnectTargetIdChange,
  onConnectSelected,
  onRemoveSelectedEdge,
}) {
  const tools = toolboxAvailability(selectedNode);

  return (
    <div
      style={{
        display: "grid",
        gap: scaleNum(14),
        position: "sticky",
        top: scaleNum(10),
        alignSelf: "start",
        minWidth: 0,
      }}
    >
      <div style={panelStyle()}>
        <h2 style={{ marginTop: 0, fontSize: scaleNum(22), marginBottom: scaleNum(14) }}>
          Scenario Controls
        </h2>

        <div style={{ marginBottom: scaleNum(16) }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: scaleNum(15),
              marginBottom: scaleNum(8),
            }}
          >
            Service Level: {num(serviceLevel * 100, 0)}%
          </label>
          <input
            type="range"
            min="0"
            max={String(supportedServiceLevels.length - 1)}
            step="1"
            value={serviceLevelIndex}
            onChange={(e) => onServiceLevelIndexChange(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              marginTop: scaleNum(6),
            }}
          >
            {supportedServiceLevels.map((level) => (
              <span key={level}>{num(level * 100, 0)}%</span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: scaleNum(16) }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: scaleNum(15),
              marginBottom: scaleNum(8),
            }}
          >
            Push-Pull Boundary: {boundaryLabel(boundaryColumn, boundaryOptions)}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={boundaryColumn}
            onChange={(e) => onBoundaryChange(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              marginTop: scaleNum(6),
              gap: scaleNum(8),
            }}
          >
            <span>Suppliers</span>
            <span>Factories</span>
            <span>DCs</span>
            <span>Retail</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: scaleNum(8),
            marginBottom: scaleNum(16),
            fontSize: scaleNum(15),
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleNum(8),
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={globalDemandMode}
              onChange={(e) => onGlobalDemandModeChange(e.target.checked)}
            />
            Global Demand Controls
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleNum(8),
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={autoInventoryType}
              onChange={(e) => onAutoInventoryTypeChange(e.target.checked)}
            />
            Auto Inventory Type
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleNum(8),
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={baselineEnabled}
              onChange={(e) => onBaselineEnabledChange(e.target.checked)}
            />
            Enable Baseline Comparison
          </label>

          {showCoaching ? (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: scaleNum(8),
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={coachingEnabled}
                onChange={(e) => onCoachingEnabledChange(e.target.checked)}
              />
              Enable Coaching
            </label>
          ) : null}
        </div>

        <div
          style={{
            marginBottom: scaleNum(12),
            fontSize: scaleNum(14),
            color: THEME.colors.textMuted,
          }}
        >
          {demandModeLabel(selectedNode, globalDemandMode)}:{" "}
          <b>{activeCustomer?.name ?? "No customer selected"}</b>
        </div>

        <div
          style={{
            marginBottom: scaleNum(18),
            opacity: globalDemandMode || selectedNode?.type === NodeType.CUSTOMER ? 1 : 0.5,
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: scaleNum(15),
              marginBottom: scaleNum(4),
            }}
          >
            Average demand (units/day): {num(currentMu, 0)}
          </label>
          <input
            type="range"
            min="10"
            max="500"
            step="5"
            value={currentMu}
            disabled={!globalDemandMode && selectedNode?.type !== NodeType.CUSTOMER}
            onChange={(e) => onCustomerDemandChange(Number(e.target.value), currentSigma)}
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            opacity: globalDemandMode || selectedNode?.type === NodeType.CUSTOMER ? 1 : 0.5,
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: scaleNum(15),
              marginBottom: scaleNum(4),
            }}
          >
            Demand variability: {num(currentSigma, 0)}
          </label>
          <input
            type="range"
            min="0"
            max="150"
            step="1"
            value={currentSigma}
            disabled={!globalDemandMode && selectedNode?.type !== NodeType.CUSTOMER}
            onChange={(e) => onCustomerDemandChange(currentMu, Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={panelStyle()}>
        <h2 style={{ marginTop: 0, fontSize: scaleNum(22), marginBottom: scaleNum(14) }}>
          Toolbox
        </h2>

        <div
          style={{
            fontSize: scaleNum(13),
            color: THEME.colors.textMuted,
            lineHeight: 1.5,
            marginBottom: scaleNum(12),
          }}
        >
          <div>
            <b>Upstream/Downstream</b> adds a stage in series.
          </div>
          <div>
            <b>Parallel</b> adds redundancy at the same stage.
          </div>
          <div>
            <b>Branch</b> adds another demand path.
          </div>
        </div>

        <div
          style={{
            fontSize: scaleNum(14),
            color: THEME.colors.textMuted,
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.sm,
            padding: `${scaleNum(8)}px ${scaleNum(10)}px`,
            marginBottom: scaleNum(12),
            lineHeight: 1.45,
          }}
        >
          {tools.helper}
        </div>

        <div
          style={{
            fontSize: scaleNum(13),
            fontWeight: 700,
            color: THEME.colors.textMuted,
            marginBottom: scaleNum(8),
          }}
        >
          Series edits
        </div>
        <div style={{ display: "grid", gap: scaleNum(8), marginBottom: scaleNum(14) }}>
          <ToolButton
            disabled={!tools.addUpstreamSupplier}
            onClick={() => addUpstreamNodeToSelected(NodeType.SUPPLIER)}
          >
            + Add Upstream Supplier
          </ToolButton>

          <ToolButton
            disabled={!tools.addUpstreamFactory}
            onClick={() => addUpstreamNodeToSelected(NodeType.FACTORY)}
          >
            + Add Upstream Factory
          </ToolButton>

          <ToolButton
            disabled={!tools.addDownstreamDC}
            onClick={() => addDownstreamNodeFromSelected(NodeType.DC)}
          >
            + Add Downstream DC
          </ToolButton>

          <ToolButton
            disabled={!tools.addDownstreamRetail}
            onClick={() => addDownstreamNodeFromSelected(NodeType.RETAIL)}
          >
            + Add Downstream Retail
          </ToolButton>

          <ToolButton
            disabled={!tools.addDownstreamCustomer}
            onClick={() => addDownstreamNodeFromSelected(NodeType.CUSTOMER)}
          >
            + Add Downstream Customer
          </ToolButton>
        </div>

        <div
          style={{
            fontSize: scaleNum(13),
            fontWeight: 700,
            color: THEME.colors.textMuted,
            marginBottom: scaleNum(8),
          }}
        >
          Redundancy and branching
        </div>
        <div style={{ display: "grid", gap: scaleNum(8), marginBottom: scaleNum(14) }}>
          <ToolButton disabled={!tools.addParallelSupplier} onClick={addParallelSupplierToSelected}>
            + Add Parallel Supplier
          </ToolButton>

          <ToolButton disabled={!tools.addCustomerBranch} onClick={addBranchCustomerFromSelected}>
            + Add Customer Branch
          </ToolButton>
        </div>

        <div
          style={{
            fontSize: scaleNum(13),
            fontWeight: 700,
            color: THEME.colors.textMuted,
            marginBottom: scaleNum(8),
          }}
        >
          Edit and layout
        </div>
        <div style={{ display: "grid", gap: scaleNum(8) }}>
          <ToolButton
            disabled={!tools.removeSelectedNode}
            variant="danger"
            onClick={removeSelectedNode}
          >
            Remove Selected Node
          </ToolButton>

          <button onClick={autoLayout} style={buttonStyle("primary")} type="button">
            Auto Layout Graph
          </button>
        </div>
      </div>

      <div style={panelStyle()}>
        <h2 style={{ marginTop: 0, fontSize: scaleNum(20), marginBottom: scaleNum(12) }}>
          Connection Actions
        </h2>
        <div style={{ display: "grid", gap: scaleNum(10) }}>
          <div style={{ fontSize: scaleNum(14), color: THEME.colors.textMuted }}>
            Selected source: <b>{selectedNode?.name ?? "None"}</b>
          </div>
          <select
            value={connectTargetId}
            onChange={(e) => onConnectTargetIdChange(e.target.value)}
            style={{
              ...inputStyle(),
              fontSize: scaleNum(14),
            }}
          >
            <option value="">Choose target node</option>
            {nodes
              .filter((n) => n.id !== selectedNodeId)
              .map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
          </select>
          <button
            onClick={onConnectSelected}
            style={buttonStyle()}
            disabled={!selectedNodeId || !connectTargetId}
            type="button"
          >
            Connect Selected {"->"} Target
          </button>
          <button
            onClick={onRemoveSelectedEdge}
            style={buttonStyle("danger")}
            disabled={!selectedEdge}
            type="button"
          >
            Delete Selected Lane
          </button>
        </div>
      </div>
    </div>
  );
}
