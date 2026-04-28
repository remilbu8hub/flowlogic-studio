// src/components/LaneEditorPanel.jsx

import { TRANSPORT_TYPES } from "../config/transportTypes";
import { THEME } from "../config/theme";
import {
  getAllowedTransportTypesForNodes,
  getTransportRestrictionNote,
} from "../sim/laneGeography";
import CollapsibleSection from "../ui/CollapsibleSection";
import { buttonStyle, inputStyle } from "../ui/formatters";

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
  const tableCellStyle = {
    border: `1px solid ${THEME.colors.border}`,
    padding: 8,
    color: THEME.colors.textPrimary,
    verticalAlign: "top",
  };

  return (
    <CollapsibleSection
      title="Lane Editor"
      isOpen={isOpen}
      onToggle={onToggle}
      description={`Selected lane: ${edgeSummary(selectedEdge, nodes)}.`}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: 900,
            background: THEME.colors.surfaceRow ?? THEME.colors.surface,
          }}
        >
          <thead style={{ background: THEME.colors.surfacePanel ?? THEME.colors.background }}>
            <tr>
              <th style={tableCellStyle}>Pick</th>
              <th style={tableCellStyle}>From</th>
              <th style={tableCellStyle}>To</th>
              <th style={tableCellStyle}>LT (days)</th>
              <th style={tableCellStyle}>Sigma (days)</th>
              <th style={tableCellStyle}>R (days)</th>
              <th style={tableCellStyle}>BOM</th>
              <th style={tableCellStyle}>Transport Type</th>
              <th style={tableCellStyle}>Outsource (3PL)</th>
            </tr>
          </thead>
          <tbody>
            {edges.map((edge, index) => {
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
                    background:
                      edge.id === selectedEdgeId
                        ? THEME.colors.hover ?? THEME.colors.background
                        : index % 2 === 0
                          ? THEME.colors.surfaceRow ?? THEME.colors.surface
                          : THEME.colors.surfacePanel ?? THEME.colors.background,
                  }}
                >
                  <td style={tableCellStyle}>
                    <button onClick={() => onSelectEdge(edge.id)} style={buttonStyle()} type="button">
                      Select
                    </button>
                  </td>
                  <td style={tableCellStyle}>{fromNode?.name ?? edge.from}</td>
                  <td style={tableCellStyle}>{toNode?.name ?? edge.to}</td>
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={edge.L}
                      onChange={(e) => onUpdateLane(edge.id, "L", e.target.value)}
                      style={{ ...inputStyle(), width: "clamp(50px, 6vw, 90px)", minHeight: 40, fontSize: 16 }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={edge.s}
                      step="0.1"
                      onChange={(e) => onUpdateLane(edge.id, "s", e.target.value)}
                      style={{ ...inputStyle(), width: "clamp(50px, 6vw, 90px)", minHeight: 40, fontSize: 16 }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={edge.R}
                      onChange={(e) => onUpdateLane(edge.id, "R", e.target.value)}
                      style={{ ...inputStyle(), width: "clamp(50px, 6vw, 90px)", minHeight: 40, fontSize: 16 }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={edge.bom}
                      onChange={(e) => onUpdateLane(edge.id, "bom", e.target.value)}
                      style={{ ...inputStyle(), width: "clamp(50px, 6vw, 90px)", minHeight: 40, fontSize: 16 }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <select
                      value={edge.transportType ?? "truck"}
                      onChange={(e) => onUpdateLane(edge.id, "transportType", e.target.value)}
                      style={{ ...inputStyle(), width: "clamp(120px, 12vw, 160px)", minHeight: 40, fontSize: 15 }}
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
                          color: THEME.colors.secondary,
                          maxWidth: 220,
                        }}
                      >
                        {restrictionNote}
                      </div>
                    ) : null}
                  </td>
                  <td style={tableCellStyle}>
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
