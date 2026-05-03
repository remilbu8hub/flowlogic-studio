// src/components/ControlPanel.jsx

import { THEME } from "../config/theme";
import { NodeType } from "../model/networkTypes";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle, cardStyle, num } from "../ui/formatters";

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
      helper: "Select a node to enable structure tools.",
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

  let helper = "Choose a structure tool to reshape the network.";
  if (type === NodeType.SUPPLIER) {
    helper = "Supplier selected: redundancy tools are most relevant here.";
  } else if (type === NodeType.FACTORY) {
    helper = "Factory selected: add upstream sourcing or downstream distribution.";
  } else if (type === NodeType.DC) {
    helper = "DC selected: expand downstream fulfillment or add another echelon.";
  } else if (type === NodeType.RETAIL) {
    helper = "Retail selected: extend downstream to customers or add branches.";
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
        fontSize: scaleNum(13),
        minHeight: scaleNum(34),
        padding: `${scaleNum(6)}px ${scaleNum(10)}px`,
        textAlign: "left",
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
    display: "grid",
    gap: scaleNum(14),
  };
}

function sectionHeaderStyle() {
  return {
    fontSize: scaleNum(14),
    fontWeight: 700,
    color: THEME.colors.textPrimary,
    margin: 0,
  };
}

function sectionBlockStyle() {
  return {
    display: "grid",
    gap: scaleNum(10),
    paddingTop: scaleNum(14),
    borderTop: `1px solid ${THEME.colors.border}`,
  };
}

export default function ControlPanel({
  selectedNode,
  selectedNodeId,
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
        <div style={{ display: "grid", gap: scaleNum(4) }}>
          <h2 style={{ margin: 0, fontSize: scaleNum(20), color: THEME.colors.textPrimary }}>
            Design Panel
          </h2>
          <div
            style={{
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              lineHeight: 1.45,
            }}
          >
            Structure controls stay here while the canvas remains the primary workspace.
          </div>
        </div>

        <section style={{ display: "grid", gap: scaleNum(10) }}>
          <h3 style={sectionHeaderStyle()}>Scenario Controls</h3>

          <div style={{ display: "grid", gap: scaleNum(6) }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: scaleNum(14),
                color: THEME.colors.textPrimary,
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
                fontSize: scaleNum(12),
                color: THEME.colors.textMuted,
                gap: scaleNum(6),
              }}
            >
              {supportedServiceLevels.map((level) => (
                <span key={level}>{num(level * 100, 0)}%</span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: scaleNum(6) }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: scaleNum(14),
                color: THEME.colors.textPrimary,
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
                fontSize: scaleNum(12),
                color: THEME.colors.textMuted,
                gap: scaleNum(6),
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
              fontSize: scaleNum(14),
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
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              lineHeight: 1.45,
            }}
          >
            {demandModeLabel(selectedNode, globalDemandMode)}:{" "}
            <b>{activeCustomer?.name ?? "No customer selected"}</b>
          </div>

          <div
            style={{
              display: "grid",
              gap: scaleNum(10),
              opacity: globalDemandMode || selectedNode?.type === NodeType.CUSTOMER ? 1 : 0.5,
            }}
          >
            <div style={{ display: "grid", gap: scaleNum(4) }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: scaleNum(14),
                  color: THEME.colors.textPrimary,
                }}
              >
                Average demand: {num(currentMu, 0)}
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

            <div style={{ display: "grid", gap: scaleNum(4) }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: scaleNum(14),
                  color: THEME.colors.textPrimary,
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
        </section>

        <section style={sectionBlockStyle()}>
          <div style={{ display: "grid", gap: scaleNum(4) }}>
            <h3 style={sectionHeaderStyle()}>Structure Tools</h3>
            <div
              style={{
                fontSize: scaleNum(13),
                color: THEME.colors.textMuted,
                lineHeight: 1.45,
              }}
            >
              {tools.helper}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: scaleNum(8),
            }}
          >
            <ToolButton
              disabled={!tools.addUpstreamSupplier}
              onClick={() => addUpstreamNodeToSelected(NodeType.SUPPLIER)}
            >
              Add Upstream Supplier
            </ToolButton>

            <ToolButton
              disabled={!tools.addUpstreamFactory}
              onClick={() => addUpstreamNodeToSelected(NodeType.FACTORY)}
            >
              Add Upstream Factory
            </ToolButton>

            <ToolButton
              disabled={!tools.addDownstreamDC}
              onClick={() => addDownstreamNodeFromSelected(NodeType.DC)}
            >
              Add Downstream DC
            </ToolButton>

            <ToolButton
              disabled={!tools.addDownstreamRetail}
              onClick={() => addDownstreamNodeFromSelected(NodeType.RETAIL)}
            >
              Add Downstream Retail
            </ToolButton>

            <ToolButton
              disabled={!tools.addDownstreamCustomer}
              onClick={() => addDownstreamNodeFromSelected(NodeType.CUSTOMER)}
            >
              Add Downstream Customer
            </ToolButton>

            <ToolButton
              disabled={!tools.addParallelSupplier}
              onClick={addParallelSupplierToSelected}
            >
              Add Parallel Supplier
            </ToolButton>

            <ToolButton
              disabled={!tools.addCustomerBranch}
              onClick={addBranchCustomerFromSelected}
            >
              Add Customer Branch
            </ToolButton>
          </div>
        </section>

        <section style={sectionBlockStyle()}>
          <h3 style={sectionHeaderStyle()}>Layout / Utilities</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: scaleNum(8),
            }}
          >
            <ToolButton
              disabled={!tools.removeSelectedNode}
              variant="danger"
              onClick={removeSelectedNode}
            >
              Remove Selected Node
            </ToolButton>

            <button
              onClick={autoLayout}
              style={{
                ...buttonStyle("primary"),
                minHeight: scaleNum(34),
                padding: `${scaleNum(6)}px ${scaleNum(10)}px`,
                fontSize: scaleNum(13),
              }}
              type="button"
            >
              Auto Layout Graph
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
