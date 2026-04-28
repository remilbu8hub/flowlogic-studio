// src/components/NodeEditorPanel.jsx

import { NodeType } from "../model/networkTypes";
import { THEME } from "../config/theme";
import ModalShell from "./ModalShell";
import { buttonStyle, inputStyle, money, num, riskColor } from "./formatters";

const STOCK_FORM_OPTIONS = [
  { value: "components", label: "Components" },
  { value: "generic", label: "Generic" },
  { value: "configured", label: "Configured" },
  { value: "finished", label: "Finished" },
  { value: "packed", label: "Packed" },
];

function normalizeLocationValue(value, locationOptions) {
  const v = String(value ?? "").toLowerCase();
  if (locationOptions.some((opt) => opt.value === v)) return v;
  return locationOptions[0]?.value ?? "north_america";
}

function normalizeSourcingPostureValue(value, postureOptions) {
  const v = String(value ?? "").toLowerCase();
  if (postureOptions.some((opt) => opt.value === v)) return v;
  return postureOptions[0]?.value ?? "domestic";
}

function derivedInventoryLabel(row) {
  if (!row) return "-";
  if (row.inventoryType === "none") return "None";
  return row.inventoryType;
}

function DerivedInfoCard({ label, value, subtext, valueColor = THEME.colors.textPrimary }) {
  return (
    <div
      style={{
        border: `1px solid ${THEME.colors.border}`,
        borderRadius: THEME.radius.md,
        padding: 12,
        background: THEME.colors.background,
      }}
    >
      <div style={{ fontSize: 12, color: THEME.colors.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: valueColor }}>{value}</div>
      {subtext ? (
        <div style={{ fontSize: 12, color: THEME.colors.textMuted, marginTop: 4, lineHeight: 1.35 }}>
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

function sanitizeNodeTypeChange(node, nextType) {
  const nextNode = {
    ...node,
    type: nextType,
    mode: nextType === NodeType.CUSTOMER ? "pull" : node.mode ?? "push",
  };

  if (nextType === NodeType.CUSTOMER || nextType === NodeType.RETAIL) {
    delete nextNode.sourcingPosture;
  } else if (!nextNode.sourcingPosture) {
    nextNode.sourcingPosture = "domestic";
  }

  if (nextType === NodeType.CUSTOMER) {
    nextNode.demand = {
      mu: Number(node.demand?.mu ?? 100),
      sigma: Number(node.demand?.sigma ?? 20),
    };
  }

  return nextNode;
}

function riskDriverBullets(row, node) {
  if (!row || !node) return [];

  const bullets = [];

  if (row.mode === "push") {
    bullets.push("Push mode raises buffer expectations and usually increases safety stock.");
  } else if (row.mode === "pull") {
    bullets.push("Pull mode reduces planned inventory, but makes response time more exposed.");
  }

  if (row.inventoryType === "packed") {
    bullets.push(
      "Packed inventory is the most committed form, so it carries more holding and risk burden."
    );
  } else if (row.inventoryType === "finished") {
    bullets.push("Finished goods are more demand-sensitive and costlier to hold than generic stock.");
  } else if (row.inventoryType === "configured") {
    bullets.push(
      "Configured stock sits between generic parts and finished goods in cost and flexibility."
    );
  } else if (row.inventoryType === "generic") {
    bullets.push("Generic stock is the cheapest and most flexible inventory form.");
  }

  if (row.inboundEdgeCount <= 1 && node.type !== NodeType.SUPPLIER) {
    bullets.push("This node appears close to single-sourced, which increases concentration risk.");
  } else if (row.inboundEdgeCount >= 2) {
    bullets.push("Multiple inbound sources reduce concentration risk at this node.");
  }

  if (String(row.sourcingPosture).toLowerCase() === "offshore") {
    bullets.push("Offshore sourcing tends to add lead time and disruption exposure.");
  } else if (String(row.sourcingPosture).toLowerCase() === "domestic") {
    bullets.push("Domestic sourcing usually helps on speed and exposure, but may cost more.");
  }

  if (row.responseTimeDays >= 12) {
    bullets.push("This node contributes meaningfully to overall response time.");
  }

  if (row.rawSigma != null && row.sigma > row.rawSigma * 1.05) {
    bullets.push("Inventory type assumptions are amplifying effective demand variability here.");
  }

  if (row.behaviorExplanation) {
    bullets.push(row.behaviorExplanation);
  }

  return bullets.slice(0, 5);
}

function assumptionBadges(row) {
  if (!row) return [];
  return [
    `Mode: ${row.mode}`,
    `Stock: ${row.inventoryType}`,
    `Sources: ${row.inboundEdgeCount}`,
    `Response: ${num(row.responseTimeDays, 1)} d`,
  ];
}

export default function NodeEditorPanel({
  isOpen,
  onClose,
  selectedNode,
  selectedNodeResult,
  autoInventoryType,
  showDetailedCost,
  locationOptions,
  sourcingPostureOptions,
  onUpdateNode,
  onRemoveSelectedNode,
}) {
  const showSourcingPosture =
    selectedNode &&
    selectedNode.type !== NodeType.CUSTOMER &&
    selectedNode.type !== NodeType.RETAIL;

  const riskBullets = riskDriverBullets(selectedNodeResult, selectedNode);
  const badges = assumptionBadges(selectedNodeResult);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={selectedNode ? `Edit Node: ${selectedNode.name}` : "Edit Node"}
      subtitle={
        showDetailedCost
          ? "Edit structural facts here. Cost, inventory type, and risk are derived from the current design and assumptions."
          : "Edit structural facts here. Inventory type, response behavior, and risk are derived from the current design and assumptions."
      }
      size="md"
    >
      {!selectedNode ? (
        <div>No node selected.</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Name</label>
            <input
              value={selectedNode.name}
              onChange={(e) => onUpdateNode(selectedNode.id, { name: e.target.value })}
              style={inputStyle()}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Type</label>
            <select
              value={selectedNode.type}
              onChange={(e) =>
                onUpdateNode(selectedNode.id, (node) =>
                  sanitizeNodeTypeChange(node, e.target.value)
                )
              }
              style={inputStyle()}
            >
              <option value={NodeType.SUPPLIER}>Supplier</option>
              <option value={NodeType.FACTORY}>Factory</option>
              <option value={NodeType.DC}>DC</option>
              <option value={NodeType.RETAIL}>Retail</option>
              <option value={NodeType.CUSTOMER}>Customer</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Location</label>
            <select
              value={normalizeLocationValue(selectedNode.location, locationOptions)}
              onChange={(e) => onUpdateNode(selectedNode.id, { location: e.target.value })}
              style={inputStyle()}
            >
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showSourcingPosture ? (
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Sourcing posture
              </label>
              <select
                value={normalizeSourcingPostureValue(
                  selectedNode.sourcingPosture,
                  sourcingPostureOptions
                )}
                onChange={(e) => onUpdateNode(selectedNode.id, { sourcingPosture: e.target.value })}
                style={inputStyle()}
              >
                {sourcingPostureOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {!autoInventoryType && selectedNode.type !== NodeType.CUSTOMER ? (
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Manual stock form
              </label>
              <select
                value={selectedNode.stockForm ?? "generic"}
                onChange={(e) => onUpdateNode(selectedNode.id, { stockForm: e.target.value })}
                style={inputStyle()}
              >
                {STOCK_FORM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Stage time (days)
            </label>
            <input
              type="number"
              value={selectedNode.stageTimeDays ?? 0}
              onChange={(e) =>
                onUpdateNode(selectedNode.id, { stageTimeDays: Number(e.target.value) })
              }
              style={inputStyle()}
            />
          </div>

          {selectedNode.type === NodeType.CUSTOMER ? (
            <>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                  Average demand (units/day)
                </label>
                <input
                  type="number"
                  value={selectedNode.demand?.mu ?? 0}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, (node) => ({
                      ...node,
                      demand: {
                        ...node.demand,
                        mu: Number(e.target.value),
                      },
                    }))
                  }
                  style={inputStyle()}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                  Demand variability
                </label>
                <input
                  type="number"
                  value={selectedNode.demand?.sigma ?? 0}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, (node) => ({
                      ...node,
                      demand: {
                        ...node.demand,
                        sigma: Number(e.target.value),
                      },
                    }))
                  }
                  style={inputStyle()}
                />
              </div>
            </>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 4,
            }}
          >
            <DerivedInfoCard label="Derived mode" value={selectedNodeResult?.mode ?? "-"} />
            <DerivedInfoCard
              label="Derived inventory type"
              value={derivedInventoryLabel(selectedNodeResult)}
              subtext={autoInventoryType ? "Auto from push-pull boundary" : "Manual node setting"}
            />
            <DerivedInfoCard
              label="Derived risk"
              value={
                selectedNodeResult
                  ? `${selectedNodeResult.riskLabel} (${num(selectedNodeResult.riskScore, 2)})`
                  : "-"
              }
              valueColor={riskColor(selectedNodeResult?.riskLabel)}
            />
            {showDetailedCost ? (
              <DerivedInfoCard
                label="Derived node operating cost"
                value={selectedNodeResult ? `${money(selectedNodeResult.nodeAddedCost)}` : "-"}
                subtext="Current flow-dependent total at this node"
              />
            ) : null}
          </div>

          {selectedNodeResult ? (
            <div
              style={{
                border: `1px solid ${THEME.colors.border}`,
                borderRadius: THEME.radius.md,
                padding: 12,
                background: THEME.colors.surface,
              }}
            >
              <div style={{ fontSize: 12, color: THEME.colors.textMuted, marginBottom: 8 }}>
                Active assumptions at this node
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {badges.map((badge) => (
                  <span
                    key={badge}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: THEME.colors.textMuted,
                      background: THEME.colors.background,
                      border: `1px solid ${THEME.colors.border}`,
                      borderRadius: 999,
                      padding: "5px 9px",
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <DerivedInfoCard
                  label="Effective sigma"
                  value={num(selectedNodeResult.sigma, 2)}
                  subtext={
                    selectedNodeResult.rawSigma != null
                      ? `Raw demand sigma: ${num(selectedNodeResult.rawSigma, 2)}`
                      : "After inventory-type assumptions"
                  }
                />
                {showDetailedCost ? (
                  <DerivedInfoCard
                    label="Safety stock value"
                    value={money(selectedNodeResult.SSValue)}
                    subtext={`SS units: ${num(selectedNodeResult.SS, 1)}`}
                  />
                ) : null}
                {showDetailedCost ? (
                  <DerivedInfoCard
                    label="Pipeline value"
                    value={money(selectedNodeResult.PSValue)}
                    subtext={`Pipeline units: ${num(selectedNodeResult.PS, 1)}`}
                  />
                ) : null}
                {showDetailedCost ? (
                  <DerivedInfoCard
                    label="Node total burden"
                    value={money(selectedNodeResult.totalValue)}
                    subtext="Inventory + node operating cost"
                  />
                ) : null}
              </div>

              <div style={{ fontSize: 12, color: THEME.colors.textMuted, marginBottom: 6 }}>
                Why this node looks the way it does
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {riskBullets.map((bullet, idx) => (
                  <div
                    key={`${idx}-${bullet.slice(0, 24)}`}
                    style={{
                      border: `1px solid ${THEME.colors.border}`,
                      borderRadius: THEME.radius.sm,
                      background: THEME.colors.background,
                      padding: "8px 10px",
                      lineHeight: 1.4,
                      color: THEME.colors.textPrimary,
                    }}
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
            <button onClick={onRemoveSelectedNode} style={buttonStyle("danger")}>
              Delete Selected Node
            </button>

            <button onClick={onClose} style={buttonStyle("primary")}>
              Done
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
