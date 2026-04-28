// src/model/networkTypes.js

export const NodeType = Object.freeze({
  SUPPLIER: "supplier",
  FACTORY: "factory",
  DC: "dc",
  RETAIL: "retail",
  CUSTOMER: "customer",
});

export const StockForm = Object.freeze({
  COMPONENTS: "components",
  GENERIC: "generic",
  CONFIGURED: "configured",
  FINISHED: "finished",
  PACKED: "packed",
});

/**
 * Node (facility) shape.
 * All time units are days. Demand is units/day.
 */
export function createNode({
  id,
  type,
  name,
  unitValue = 0,          // $ per unit at this node
  stockForm = StockForm.GENERIC,

  // Demand inputs: only required for CUSTOMER nodes (others derived)
  mu = null,              // mean demand (units/day)
  sigma = null,           // std dev demand/forecast error (units/day)
} = {}) {
  return {
    id,
    type,
    name,
    unitValue,
    stockForm,
    demand: { mu, sigma }, // nullable unless CUSTOMER
  };
}

/**
 * Edge (lane) shape.
 */
export function createEdge({
  id,
  from,
  to,
  L = 0,          // mean lead time (days)
  s = 0,          // std dev lead time (days)
  R = 0,          // review period (days) default 0 = continuous review
  bom = 1,        // BOM multiplier
} = {}) {
  return { id, from, to, L, s, R, bom };
}

/**
 * Network container
 */
export function createNetwork({ nodes = [], edges = [] } = {}) {
  return { nodes, edges };
}
