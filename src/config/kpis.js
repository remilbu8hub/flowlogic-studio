export const KPI_OPTIONS = [
  { id: "totalCost", label: "Total Cost", category: "Cost", direction: "minimize" },
  { id: "inventoryCost", label: "Inventory Cost", category: "Cost", direction: "minimize" },
  { id: "transportCost", label: "Transport Cost", category: "Cost", direction: "minimize" },
  { id: "serviceLevel", label: "Service Level", category: "Service", direction: "maximize" },
  { id: "responseTime", label: "Response Time", category: "Speed", direction: "minimize" },
  { id: "aggregateRisk", label: "Aggregate Risk", category: "Risk", direction: "minimize" },
];

export const DEFAULT_SELECTED_KPIS = ["totalCost", "responseTime", "aggregateRisk"];

export const KPI_BY_ID = Object.fromEntries(KPI_OPTIONS.map((kpi) => [kpi.id, kpi]));

export function kpiDirectionLabel(direction) {
  return direction === "maximize" ? "Higher is better" : "Lower is better";
}
