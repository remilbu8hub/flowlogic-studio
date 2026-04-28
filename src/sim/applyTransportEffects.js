export function applyTransportEffects(edges) {
  return edges.map((edge) => {
    const L = Number(edge.L ?? 0);
    const s = Number(edge.s ?? 0);

    return {
      ...edge,
      effectiveL: L * (edge.leadTimeMultiplier ?? 1),
      effectiveSigma: s * (edge.riskMultiplier ?? 1),
      effectiveCost: (edge.cost ?? 0) * (edge.costMultiplier ?? 1),
    };
  });
}
