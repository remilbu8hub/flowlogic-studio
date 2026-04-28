// src/components/LaneEditorPanel.jsx

import { TRANSPORT_TYPES } from "../config/transportTypes";
import { THEME } from "../config/theme";
import {
  getAllowedTransportTypesForNodes,
  getTransportRestrictionNote,
} from "../sim/laneGeography";
import CollapsibleSection from "./CollapsibleSection";
import { buttonStyle } from "./formatters";

function edgeSummary(edge, nodes) {
  if (!edge) return "No lane selected";
  const from = nodes.find((n) => n.id === edge.from)?.name ?? edge.from;
  const to = nodes.find((n) => n.id === edge.to)?.name ?? edge.to;
  return `${from} -> ${to}`;
}

export default function LaneEditorPanel({
  isOpen,
  onToggle,
  nodes,
  edges,
  selectedEdge,
  selectedEdgeId,
  onSelectEdge,
  onUpdateLane,
}) {
  const transportOptions = Object.entries(TRANSPORT_TYPES);

  return (
    <CollapsibleSection
      title="Lane Editor"
      isOpen={isOpen}
      onToggle={onToggle}
      description={`Selected lane: ${edgeSummary(selectedEdge, nodes)}.`}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="8"
          style={{
            borderCollapse: "collapse",
            width: "100%",
            background: THEME.colors.surface,
          }}
        >
          <thead style={{ background: THEME.colors.background }}>
            <tr>
              <th>Pick</th>
              <th>From</th>
              <th>To</th>
              <th>LT (days)</th>
              <th>Sigma (days)</th>
              <th>R (days)</th>
              <th>BOM</th>
              <th>Transport Type</th>
              <th>Outsource (3PL)</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((edge) => {
              const fromNode = nodes.find((node) => node.id === edge.from) ?? null;
              const toNode = nodes.find((node) => node.id === edge.to) ?? null;
              const allowedTransportTypes = getAllowedTransportTypesForNodes(fromNode, toNode);
              const availableTransportOptions = transportOptions.filter(([value]) =>
                allowedTransportTypes.includes(value)
              );
              const restrictionNote = getTransportRestrictionNote(fromNode, toNode);

              return (
                <tr
                  key={edge.id}
                  style={{
                    background: edge.id === selectedEdgeId ? "#eaf5ff" : "transparent",
                  }}
                >
                  <td>
                    <button onClick={() => onSelectEdge(edge.id)} style={buttonStyle()} type="button">
                      Select
                    </button>
                  </td>
                  <td>{fromNode?.name ?? edge.from}</td>
                  <td>{toNode?.name ?? edge.to}</td>
                  <td>
                    <input
                      type="number"
                      value={edge.L}
                      onChange={(e) => onUpdateLane(edge.id, "L", e.target.value)}
                      style={{ width: 110, minHeight: 42, fontSize: 18, padding: "6px 10px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={edge.s}
                      step="0.1"
                      onChange={(e) => onUpdateLane(edge.id, "s", e.target.value)}
                      style={{ width: 110, minHeight: 42, fontSize: 18, padding: "6px 10px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={edge.R}
                      onChange={(e) => onUpdateLane(edge.id, "R", e.target.value)}
                      style={{ width: 110, minHeight: 42, fontSize: 18, padding: "6px 10px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={edge.bom}
                      onChange={(e) => onUpdateLane(edge.id, "bom", e.target.value)}
                      style={{ width: 110, minHeight: 42, fontSize: 18, padding: "6px 10px" }}
                    />
                  </td>
                  <td>
                    <select
                      value={edge.transportType ?? "truck"}
                      onChange={(e) => onUpdateLane(edge.id, "transportType", e.target.value)}
                      style={{ width: 150, minHeight: 42, fontSize: 16, padding: "6px 10px" }}
                      title={restrictionNote ?? undefined}
                    >
                      {availableTransportOptions.map(([value, transport]) => (
                        <option key={value} value={value}>
                          {transport.label}
                        </option>
                      ))}
                    </select>
                    {restrictionNote ? (
                      <div
                        title={restrictionNote}
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          lineHeight: 1.35,
                          color: THEME.colors.textMuted,
                          maxWidth: 220,
                        }}
                      >
                        {restrictionNote}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 42,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(edge.isOutsourced)}
                        onChange={(e) => onUpdateLane(edge.id, "isOutsourced", e.target.checked)}
                      />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
