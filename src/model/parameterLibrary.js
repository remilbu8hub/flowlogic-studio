// src/model/parameterLibrary.js

export function cloneParameters(params) {
  return structuredClone(params);
}

export const defaultParameters = {
  serviceLevel: 0.95,

  // Annual carrying rate.
  // Engine should convert this to a daily equivalent when building daily/flow costs.
  carryingRate: 0.18,

  nodeCosts: {
    supplier: {
      costPerUnit: 0.45,
      baseRisk: 1.45,
      stageTime: 3.0,
    },
    factory: {
      costPerUnit: 1.25,
      baseRisk: 1.35,
      stageTime: 2.5,
    },
    dc: {
      costPerUnit: 0.65,
      baseRisk: 1.22,
      stageTime: 1.5,
    },
    retail: {
      costPerUnit: 0.85,
      baseRisk: 1.15,
      stageTime: 1.0,
    },
    customer: {
      costPerUnit: 0.0,
      baseRisk: 1.0,
      stageTime: 0.0,
    },
  },

  locationFactors: {
    north_america: {
      costMultiplier: 1.16,
      riskMultiplier: 0.95,
      leadTimeMultiplier: 0.92,
    },
    latin_america: {
      costMultiplier: 0.95,
      riskMultiplier: 1.05,
      leadTimeMultiplier: 1.08,
    },
    europe: {
      costMultiplier: 1.12,
      riskMultiplier: 0.97,
      leadTimeMultiplier: 0.96,
    },
    east_asia: {
      costMultiplier: 0.80,
      riskMultiplier: 1.14,
      leadTimeMultiplier: 1.32,
    },
    south_asia: {
      costMultiplier: 0.74,
      riskMultiplier: 1.20,
      leadTimeMultiplier: 1.42,
    },
    southeast_asia: {
      costMultiplier: 0.78,
      riskMultiplier: 1.15,
      leadTimeMultiplier: 1.34,
    },
  },

  sourcingPostureFactors: {
    domestic: {
      costMultiplier: 1.12,
      riskMultiplier: 0.90,
      leadTimeMultiplier: 0.88,
    },
    nearshore: {
      costMultiplier: 1.00,
      riskMultiplier: 1.00,
      leadTimeMultiplier: 1.00,
    },
    offshore: {
      costMultiplier: 0.88,
      riskMultiplier: 1.18,
      leadTimeMultiplier: 1.24,
    },
  },

  modeFactors: {
    push: {
      inventoryMultiplier: 1.16,
      responseTimeMultiplier: 0.88,
    },
    pull: {
      inventoryMultiplier: 0.90,
      responseTimeMultiplier: 1.08,
    },
  },

  stockFormFactors: {
    // Future supplier-cost rule:
    // Supplier-held component inventory should eventually be excluded from user-facing
    // inventory-driven cost because that burden is assumed wrapped into supplier pricing.
    // Until engine support is added, keep component factors aligned with generic upstream stock.
    components: {
      inventoryMultiplier: 0.84,
      riskMultiplier: 0.94,
    },
    generic: {
      inventoryMultiplier: 0.84,
      riskMultiplier: 0.94,
    },
    configured: {
      inventoryMultiplier: 1.00,
      riskMultiplier: 1.00,
    },
    finished: {
      inventoryMultiplier: 1.18,
      riskMultiplier: 1.08,
    },
    packed: {
      inventoryMultiplier: 1.34,
      riskMultiplier: 1.14,
    },
  },

  risk: {
    maxCap: 2.5,
    multiSourceReduction: 0.78,
  },
};
