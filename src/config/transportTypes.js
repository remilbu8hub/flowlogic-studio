import { THEME } from "./theme";
import {
  getDefaultTransportTypeForNodes,
  isTransportTypeAllowedForNodes,
} from "../sim/laneGeography";

export const TRANSPORT_TYPES = {
  truck: {
    label: "Truck",
    costMultiplier: 1.0,
    leadTimeMultiplier: 1.0,
    riskMultiplier: 1.0,
    color: THEME.colors.transport.truck,
  },
  air: {
    label: "Air",
    costMultiplier: 2.5,
    leadTimeMultiplier: 0.4,
    riskMultiplier: 1.3,
    color: THEME.colors.transport.air,
  },
  ship: {
    label: "Ship",
    costMultiplier: 0.7,
    leadTimeMultiplier: 2.5,
    riskMultiplier: 1.2,
    color: THEME.colors.transport.ship,
  },
};

export function getTransportTypeConfig(transportType) {
  return TRANSPORT_TYPES[transportType] ?? TRANSPORT_TYPES.truck;
}

export function normalizeTransportEdge(edge) {
  const transportType =
    typeof edge?.transportType === "string" && TRANSPORT_TYPES[edge.transportType]
      ? edge.transportType
      : "truck";
  const config = getTransportTypeConfig(transportType);

  return {
    ...edge,
    transportType,
    costMultiplier: config.costMultiplier,
    leadTimeMultiplier: config.leadTimeMultiplier,
    riskMultiplier: config.riskMultiplier,
    isOutsourced: Boolean(edge?.isOutsourced),
  };
}

export function normalizeTransportEdgeForNodes(edge, nodes) {
  const normalizedEdge = normalizeTransportEdge(edge);

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return normalizedEdge;
  }

  const fromNode = nodes.find((node) => node.id === normalizedEdge.from) ?? null;
  const toNode = nodes.find((node) => node.id === normalizedEdge.to) ?? null;

  if (!fromNode || !toNode) {
    return normalizedEdge;
  }

  if (isTransportTypeAllowedForNodes(normalizedEdge.transportType, fromNode, toNode)) {
    return normalizedEdge;
  }

  return normalizeTransportEdge({
    ...normalizedEdge,
    transportType: getDefaultTransportTypeForNodes(fromNode, toNode),
  });
}
