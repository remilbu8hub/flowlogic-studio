// src/data/disruptionCards.js

function cloneNodes(nodes) {
  return nodes.map((node) => structuredClone(node));
}

function cloneEdges(edges) {
  return edges.map((edge) => structuredClone(edge));
}

function cloneParameters(parameters) {
  return structuredClone(parameters);
}

function cloneDeck(cards) {
  return cards.map((card) => ({ ...card }));
}

function ensureNodeCostAdder(node, fallback = 0) {
  if (node.costAdderPerUnit != null) return Number(node.costAdderPerUnit);
  return Number(fallback || 0);
}

function isAsianLocation(location = "") {
  const v = String(location).toLowerCase();
  return v === "east_asia" || v === "south_asia" || v === "southeast_asia";
}

function isOffshoreNode(node) {
  return String(node?.sourcingPosture || "").toLowerCase() === "offshore";
}

function isDomesticNode(node) {
  return String(node?.sourcingPosture || "").toLowerCase() === "domestic";
}

function isNearshoreNode(node) {
  return String(node?.sourcingPosture || "").toLowerCase() === "nearshore";
}

export const DISRUPTION_CARDS = [
  {
    id: "global_pandemic",
    title: "Global Pandemic",
    category: "Global Shock",
    shortLabel: "Pandemic",
    description:
      "Labor availability drops and transport slows across the network. Lead times and handling costs rise sharply.",
    accent: "#cf222e",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "supplier" || node.type === "factory" || node.type === "dc") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.5,
            costAdderPerUnit: ensureNodeCostAdder(node, 2) * 1.35,
          };
        }
        return node;
      });

      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        L: Math.round(Number(edge.L || 0) * 1.55),
        s: Number((Number(edge.s || 0) * 1.8).toFixed(1)),
      }));

      const nextParameters = cloneParameters(parameters);
      nextParameters.carryingRate = Number(
        (Number(nextParameters.carryingRate || 0.25) * 1.08).toFixed(3)
      );

      return { nodes: nextNodes, edges: nextEdges, parameters: nextParameters };
    },
  },
  {
    id: "port_congestion",
    title: "Port Congestion",
    category: "Logistics",
    shortLabel: "Port Delays",
    description:
      "Ocean-linked flows seize up. Offshore and Asia-linked nodes see slower replenishment and more variability.",
    accent: "#0969da",
    apply: ({ nodes, edges, parameters }) => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const nextEdges = cloneEdges(edges).map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);

        const affected =
          isOffshoreNode(from) ||
          isOffshoreNode(to) ||
          isAsianLocation(from?.location) ||
          isAsianLocation(to?.location);

        if (!affected) return edge;

        return {
          ...edge,
          L: Number(edge.L || 0) + 6,
          s: Number((Number(edge.s || 0) + 2.5).toFixed(1)),
        };
      });

      return {
        nodes: cloneNodes(nodes),
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "supplier_price_shock",
    title: "Supplier Price Shock",
    category: "Cost",
    shortLabel: "Supplier Cost",
    description:
      "Key raw material suppliers raise prices. Upstream cost burden rises before any redesign can respond.",
    accent: "#e16f24",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "supplier") return node;
        return {
          ...node,
          costAdderPerUnit: ensureNodeCostAdder(node, 2.5) * 1.8,
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "factory_labor_strike",
    title: "Factory Labor Strike",
    category: "Operations",
    shortLabel: "Factory Strike",
    description:
      "Factory output becomes slower and more expensive. Manufacturing stages absorb longer delays and instability.",
    accent: "#8250df",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "factory") return node;
        return {
          ...node,
          stageTimeDays: Number(node.stageTimeDays || 0) * 1.8,
          costAdderPerUnit: ensureNodeCostAdder(node, 1.5) * 1.25,
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "demand_surge",
    title: "Demand Surge",
    category: "Demand",
    shortLabel: "Demand Surge",
    description:
      "A major market event spikes demand. Customer groups pull harder and variability rises with it.",
    accent: "#1a7f37",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "customer") return node;
        return {
          ...node,
          demand: {
            mu: Number((Number(node.demand?.mu || 0) * 1.3).toFixed(0)),
            sigma: Number((Number(node.demand?.sigma || 0) * 1.45).toFixed(0)),
          },
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "demand_whiplash",
    title: "Demand Whiplash",
    category: "Demand",
    shortLabel: "Whiplash",
    description:
      "Forecasts become unreliable. Average demand stays similar, but uncertainty jumps across customer groups.",
    accent: "#6e7781",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "customer") return node;
        return {
          ...node,
          demand: {
            mu: Number(node.demand?.mu || 0),
            sigma: Number((Number(node.demand?.sigma || 0) * 1.9).toFixed(0)),
          },
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "dc_outage",
    title: "DC Outage",
    category: "Distribution",
    shortLabel: "DC Outage",
    description:
      "A distribution center disruption slows downstream fulfillment and raises handling burden at stocking points.",
    accent: "#b35900",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "dc") return node;
        return {
          ...node,
          stageTimeDays: Number(node.stageTimeDays || 0) * 2.0,
          costAdderPerUnit: ensureNodeCostAdder(node, 3.5) * 1.35,
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "fuel_spike",
    title: "Fuel Spike",
    category: "Transport",
    shortLabel: "Fuel Spike",
    description:
      "Transport becomes more expensive across the network. Long flows feel heavier and inventory carrying gets slightly worse.",
    accent: "#c69026",
    apply: ({ nodes, edges, parameters }) => {
      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        L: Number((Number(edge.L || 0) * 1.12).toFixed(0)),
      }));

      const nextParameters = cloneParameters(parameters);
      nextParameters.carryingRate = Number(
        (Number(nextParameters.carryingRate || 0.25) * 1.1).toFixed(3)
      );

      return {
        nodes: cloneNodes(nodes),
        edges: nextEdges,
        parameters: nextParameters,
      };
    },
  },

  // New cards below

  {
    id: "cyberattack",
    title: "Cyberattack on Planning Systems",
    category: "Information",
    shortLabel: "Cyberattack",
    description:
      "Planning and coordination degrade. Replenishment becomes noisier and some stage times stretch while teams work manually.",
    accent: "#3b3f99",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "factory" || node.type === "dc" || node.type === "retail") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.25,
          };
        }
        return node;
      });

      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        s: Number((Number(edge.s || 0) * 1.45).toFixed(1)),
      }));

      return {
        nodes: nextNodes,
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "quality_recall",
    title: "Quality Recall",
    category: "Quality",
    shortLabel: "Recall",
    description:
      "A product quality issue triggers rework and tighter inspection. Factory and downstream handling slow down.",
    accent: "#a63d40",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "factory" || node.type === "dc" || node.type === "retail") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.35,
            costAdderPerUnit: ensureNodeCostAdder(node, 2.5) * 1.18,
          };
        }
        return node;
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "customs_crackdown",
    title: "Customs Crackdown",
    category: "Trade",
    shortLabel: "Customs",
    description:
      "Cross-border scrutiny increases. Offshore and Asia-linked flows face longer inspection delays and more variability.",
    accent: "#1f6feb",
    apply: ({ nodes, edges, parameters }) => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const nextEdges = cloneEdges(edges).map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);

        const affected =
          isOffshoreNode(from) ||
          isOffshoreNode(to) ||
          isAsianLocation(from?.location) ||
          isAsianLocation(to?.location);

        if (!affected) return edge;

        return {
          ...edge,
          L: Number(edge.L || 0) + 4,
          s: Number((Number(edge.s || 0) + 1.8).toFixed(1)),
        };
      });

      return {
        nodes: cloneNodes(nodes),
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "supplier_bankruptcy",
    title: "Supplier Bankruptcy",
    category: "Supply Base",
    shortLabel: "Bankruptcy",
    description:
      "Upstream disruption hits supplier reliability. Supplier stages become less predictable and costlier to replace short term.",
    accent: "#7d4cdb",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "supplier") return node;
        return {
          ...node,
          stageTimeDays: Number(node.stageTimeDays || 0) * 1.22,
          costAdderPerUnit: ensureNodeCostAdder(node, 2.2) * 1.28,
        };
      });

      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        s: Number((Number(edge.s || 0) * 1.3).toFixed(1)),
      }));

      return {
        nodes: nextNodes,
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "weather_disaster",
    title: "Regional Weather Disaster",
    category: "Environmental",
    shortLabel: "Weather",
    description:
      "Storm damage disrupts physical movement and local operations. Distribution and retail stages experience delays.",
    accent: "#0f766e",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "dc" || node.type === "retail") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.4,
          };
        }
        return node;
      });

      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        L: Number((Number(edge.L || 0) * 1.18).toFixed(0)),
      }));

      return {
        nodes: nextNodes,
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "energy_shortage",
    title: "Energy Shortage",
    category: "Utilities",
    shortLabel: "Energy",
    description:
      "Utility volatility raises plant and warehouse operating burden. Stage times and per-unit costs increase.",
    accent: "#b45309",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "factory" || node.type === "dc") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.22,
            costAdderPerUnit: ensureNodeCostAdder(node, 2.8) * 1.2,
          };
        }
        return node;
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "labor_tightness",
    title: "Labor Tightness",
    category: "Workforce",
    shortLabel: "Labor",
    description:
      "Hiring becomes difficult across operations. Handling-intensive stages take longer and cost more to run.",
    accent: "#9333ea",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "factory" || node.type === "dc" || node.type === "retail") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.18,
            costAdderPerUnit: ensureNodeCostAdder(node, 2.0) * 1.12,
          };
        }
        return node;
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "domestic_incentive",
    title: "Domestic Incentive Program",
    category: "Policy",
    shortLabel: "Incentive",
    description:
      "Policy incentives improve domestic operating economics. Domestic nodes become slightly cheaper and easier to replenish.",
    accent: "#15803d",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (!isDomesticNode(node)) return node;
        return {
          ...node,
          costAdderPerUnit: ensureNodeCostAdder(node, 2.0) * 0.9,
          stageTimeDays: Number(node.stageTimeDays || 0) * 0.95,
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "nearshore_capacity_boom",
    title: "Nearshore Capacity Boom",
    category: "Sourcing",
    shortLabel: "Nearshore Boom",
    description:
      "Nearshore partners add capacity and become more responsive. Nearshore nodes and associated flows improve modestly.",
    accent: "#0ea5e9",
    apply: ({ nodes, edges, parameters }) => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      const nextNodes = cloneNodes(nodes).map((node) => {
        if (!isNearshoreNode(node)) return node;
        return {
          ...node,
          stageTimeDays: Number(node.stageTimeDays || 0) * 0.9,
          costAdderPerUnit: ensureNodeCostAdder(node, 2.0) * 0.96,
        };
      });

      const nextEdges = cloneEdges(edges).map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!isNearshoreNode(from) && !isNearshoreNode(to)) return edge;

        return {
          ...edge,
          L: Math.max(0, Number(edge.L || 0) - 2),
          s: Number((Number(edge.s || 0) * 0.9).toFixed(1)),
        };
      });

      return {
        nodes: nextNodes,
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "peak_season_crunch",
    title: "Peak Season Crunch",
    category: "Seasonality",
    shortLabel: "Peak Season",
    description:
      "Fulfillment demand spikes late in the chain. Retail and DC stages feel both higher throughput and higher variability.",
    accent: "#dc2626",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "dc" || node.type === "retail") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.22,
            costAdderPerUnit: ensureNodeCostAdder(node, 2.4) * 1.15,
          };
        }

        if (node.type === "customer") {
          return {
            ...node,
            demand: {
              mu: Number((Number(node.demand?.mu || 0) * 1.18).toFixed(0)),
              sigma: Number((Number(node.demand?.sigma || 0) * 1.32).toFixed(0)),
            },
          };
        }

        return node;
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "forecast_breakthrough",
    title: "Forecasting Breakthrough",
    category: "Analytics",
    shortLabel: "Forecasting",
    description:
      "Analytics improve demand visibility. Customer variability declines, lowering noise throughout the network.",
    accent: "#059669",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type !== "customer") return node;
        return {
          ...node,
          demand: {
            mu: Number(node.demand?.mu || 0),
            sigma: Number((Number(node.demand?.sigma || 0) * 0.72).toFixed(0)),
          },
        };
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "expedite_program",
    title: "Emergency Expedite Program",
    category: "Mitigation",
    shortLabel: "Expedite",
    description:
      "Management authorizes expediting. Flows speed up, but the network pays for the privilege through higher operating burden.",
    accent: "#2563eb",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => ({
        ...node,
        costAdderPerUnit: ensureNodeCostAdder(node, 2.0) * 1.12,
      }));

      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        L: Math.max(0, Math.round(Number(edge.L || 0) * 0.82)),
        s: Number((Number(edge.s || 0) * 0.92).toFixed(1)),
      }));

      return {
        nodes: nextNodes,
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "supplier_collaboration_gain",
    title: "Supplier Collaboration Gain",
    category: "Relationship",
    shortLabel: "Collaboration",
    description:
      "Upstream coordination improves. Supplier handoffs get smoother, and inbound variability comes down modestly.",
    accent: "#0284c7",
    apply: ({ nodes, edges, parameters }) => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const nextEdges = cloneEdges(edges).map((edge) => {
        const from = nodeMap.get(edge.from);
        if (from?.type !== "supplier") return edge;

        return {
          ...edge,
          s: Number((Number(edge.s || 0) * 0.8).toFixed(1)),
          L: Math.max(0, Number(edge.L || 0) - 1),
        };
      });

      return {
        nodes: cloneNodes(nodes),
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "inventory_audit",
    title: "Inventory Accuracy Audit",
    category: "Controls",
    shortLabel: "Audit",
    description:
      "Inventory records improve. Buffer decisions become cleaner, trimming some hidden variability in execution.",
    accent: "#475569",
    apply: ({ nodes, edges, parameters }) => {
      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        s: Number((Number(edge.s || 0) * 0.88).toFixed(1)),
      }));

      const nextParameters = cloneParameters(parameters);
      nextParameters.carryingRate = Number(
        (Number(nextParameters.carryingRate || 0.25) * 0.98).toFixed(3)
      );

      return {
        nodes: cloneNodes(nodes),
        edges: nextEdges,
        parameters: nextParameters,
      };
    },
  },
  {
    id: "returns_wave",
    title: "Returns Wave",
    category: "Reverse Flow",
    shortLabel: "Returns",
    description:
      "A surge in returns burdens downstream handling. Retail and DC stages become slower and more expensive to run.",
    accent: "#be185d",
    apply: ({ nodes, edges, parameters }) => {
      const nextNodes = cloneNodes(nodes).map((node) => {
        if (node.type === "dc" || node.type === "retail") {
          return {
            ...node,
            stageTimeDays: Number(node.stageTimeDays || 0) * 1.28,
            costAdderPerUnit: ensureNodeCostAdder(node, 2.6) * 1.14,
          };
        }
        return node;
      });

      return {
        nodes: nextNodes,
        edges: cloneEdges(edges),
        parameters: cloneParameters(parameters),
      };
    },
  },
  {
    id: "carrier_capacity_crunch",
    title: "Carrier Capacity Crunch",
    category: "Transport",
    shortLabel: "Capacity Crunch",
    description:
      "Freight capacity tightens across the network. Shipments take longer to move and transport variability rises.",
    accent: "#7c3aed",
    apply: ({ nodes, edges, parameters }) => {
      const nextEdges = cloneEdges(edges).map((edge) => ({
        ...edge,
        L: Number(edge.L || 0) + 2,
        s: Number((Number(edge.s || 0) * 1.22).toFixed(1)),
      }));

      return {
        nodes: cloneNodes(nodes),
        edges: nextEdges,
        parameters: cloneParameters(parameters),
      };
    },
  },
];

export function shuffleDeck(cards = DISRUPTION_CARDS) {
  const deck = cloneDeck(cards);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function applyCard({ nodes, edges, parameters, card }) {
  if (!card?.apply) {
    return {
      nodes: cloneNodes(nodes),
      edges: cloneEdges(edges),
      parameters: cloneParameters(parameters),
    };
  }

  return card.apply({
    nodes: cloneNodes(nodes),
    edges: cloneEdges(edges),
    parameters: cloneParameters(parameters),
  });
}
