// src/components/SavedScenarioTable.jsx

import { money, num, riskColor } from "./formatters";

export default function SavedScenarioTable({ entries = [] }) {
  if (!entries.length) {
    return <div style={{ color: "#57606a" }}>No saved scenarios yet.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          background: "#fff",
        }}
      >
        <thead style={{ background: "#f0f3f6" }}>
          <tr>
            <th>Name</th>
            <th>Saved</th>
            <th>Total Cost</th>
            <th>Inventory</th>
            <th>Response</th>
            <th>Risk</th>
            <th>Max Risk Node</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.name}</td>
              <td>{new Date(entry.savedAt).toLocaleString()}</td>
              <td>{money(entry.totalSupplyChainCost)}</td>
              <td>{money(entry.totalInventory)}</td>
              <td>{num(entry.totalResponseTime, 1)} days</td>
              <td style={{ color: riskColor(entry.aggregateRiskLabel), fontWeight: 700 }}>
                {entry.aggregateRiskLabel} ({num(entry.aggregateRiskScore, 2)})
              </td>
              <td>{entry.maxRiskNodeName ?? "—"}</td>
              <td>{entry.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}