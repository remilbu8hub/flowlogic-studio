import { KPI_BY_ID } from "../config/kpis";
import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle, cardStyle, money, num, riskColor } from "../ui/formatters";

function metricDefinition(kpiId) {
  if (kpiId === "totalCost") {
    return {
      value: (snapshot) => Number(snapshot.metrics.totalCost || 0),
      display: (snapshot) => money(snapshot.metrics.totalCost),
    };
  }

  if (kpiId === "inventoryCost") {
    return {
      value: (snapshot) => Number(snapshot.metrics.inventoryCost || 0),
      display: (snapshot) => money(snapshot.metrics.inventoryCost),
    };
  }

  if (kpiId === "transportCost") {
    return {
      value: (snapshot) => Number(snapshot.metrics.transportCost || 0),
      display: (snapshot) => money(snapshot.metrics.transportCost),
    };
  }

  if (kpiId === "serviceLevel") {
    return {
      value: (snapshot) => Number(snapshot.metrics.serviceLevel || 0),
      display: (snapshot) => `${num(Number(snapshot.metrics.serviceLevel || 0) * 100, 0)}%`,
    };
  }

  if (kpiId === "responseTime") {
    return {
      value: (snapshot) => Number(snapshot.metrics.responseTime || 0),
      display: (snapshot) => `${num(snapshot.metrics.responseTime, 1)} days`,
    };
  }

  return {
    value: (snapshot) => Number(snapshot.metrics.aggregateRiskScore || 0),
    display: (snapshot) =>
      `${snapshot.metrics.aggregateRiskLabel ?? "N/A"} (${num(snapshot.metrics.aggregateRiskScore, 2)})`,
  };
}

function activeBaselineSnapshot(snapshots) {
  return snapshots.find((snapshot) => snapshot.isBaseline) ?? snapshots[0] ?? null;
}

function normalizedScores(snapshots, selectedKpis) {
  if (!snapshots.length || !selectedKpis.length) return [];

  const scoreById = new Map(snapshots.map((snapshot) => [snapshot.id, 0]));

  selectedKpis.forEach((kpiId) => {
    const kpi = KPI_BY_ID[kpiId];
    const definition = metricDefinition(kpiId);
    const values = snapshots.map((snapshot) => definition.value(snapshot));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const span = maxValue - minValue;

    snapshots.forEach((snapshot) => {
      const rawValue = definition.value(snapshot);
      let normalized = 1;

      if (span > 0) {
        normalized =
          kpi.direction === "maximize"
            ? (rawValue - minValue) / span
            : (maxValue - rawValue) / span;
      }

      scoreById.set(snapshot.id, scoreById.get(snapshot.id) + normalized);
    });
  });

  return snapshots
    .map((snapshot) => ({
      ...snapshot,
      aggregateScore: (scoreById.get(snapshot.id) / selectedKpis.length) * 100,
    }))
    .sort((a, b) => b.aggregateScore - a.aggregateScore);
}

function evaluateKpiCell(snapshot, snapshots, kpiId) {
  const kpi = KPI_BY_ID[kpiId];
  const definition = metricDefinition(kpiId);
  const values = snapshots.map((candidate) => definition.value(candidate));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const rawValue = definition.value(snapshot);
  const isFlat = minValue === maxValue;

  const isBest = !isFlat && (kpi.direction === "maximize" ? rawValue === maxValue : rawValue === minValue);
  const isWorst = !isFlat && (kpi.direction === "maximize" ? rawValue === minValue : rawValue === maxValue);

  return {
    rawValue,
    minValue,
    maxValue,
    isFlat,
    isBest,
    isWorst,
  };
}

function cellTone(kpiEvaluation) {
  if (kpiEvaluation.isFlat) {
    return {
      background: THEME.colors.surface,
      borderColor: THEME.colors.border,
      color: THEME.colors.textPrimary,
    };
  }

  if (kpiEvaluation.isBest) {
    return {
      background: "rgba(22,163,74,0.12)",
      borderColor: THEME.colors.success,
      color: THEME.colors.textPrimary,
    };
  }

  if (kpiEvaluation.isWorst) {
    return {
      background: "rgba(220,38,38,0.10)",
      borderColor: THEME.colors.danger,
      color: THEME.colors.textPrimary,
    };
  }

  return {
    background: THEME.colors.surface,
    borderColor: THEME.colors.border,
    color: THEME.colors.textPrimary,
  };
}

function cellIndicator(kpiEvaluation) {
  if (kpiEvaluation.isBest) {
    return {
      label: "↓ Better",
      color: THEME.colors.success,
      background: "rgba(22,163,74,0.12)",
      borderColor: THEME.colors.success,
    };
  }

  if (kpiEvaluation.isWorst) {
    return {
      label: "↑ Worse",
      color: THEME.colors.danger,
      background: "rgba(220,38,38,0.10)",
      borderColor: THEME.colors.danger,
    };
  }

  return null;
}

function formatSignedNumber(value, digits = 1) {
  const absolute = num(Math.abs(value), digits);
  if (value > 0) return `+${absolute}`;
  if (value < 0) return `-${absolute}`;
  return absolute;
}

function deltaCopy(kpiId, delta) {
  if (Math.abs(delta) < 1e-9) {
    return "No change";
  }

  if (kpiId === "totalCost" || kpiId === "inventoryCost" || kpiId === "transportCost") {
    return `${delta > 0 ? "+" : "-"}${money(Math.abs(delta)).replace("$", "$")} vs baseline`;
  }

  if (kpiId === "responseTime") {
    return `${formatSignedNumber(delta, 1)} days vs baseline`;
  }

  if (kpiId === "serviceLevel") {
    return `${formatSignedNumber(delta * 100, 0)} pts vs baseline`;
  }

  return `${formatSignedNumber(delta, 2)} score vs baseline`;
}

function deltaTone(kpiId, delta) {
  if (Math.abs(delta) < 1e-9) {
    return {
      label: "Baseline match",
      color: THEME.colors.textMuted,
    };
  }

  const kpi = KPI_BY_ID[kpiId];
  const isBetter =
    kpi.direction === "maximize"
      ? delta > 0
      : delta < 0;

  return {
    label: deltaCopy(kpiId, delta),
    color: isBetter ? THEME.colors.success : THEME.colors.danger,
  };
}

function sectionTitle(text) {
  return {
    fontSize: scaleNum(18),
    fontWeight: 700,
    color: THEME.colors.textPrimary,
    margin: 0,
  };
}

export default function OptimizeWorkspacePanel({
  selectedKpis,
  snapshots,
  currentScenarioName,
  onSaveSnapshot,
  onDuplicateSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onSetBaseline,
}) {
  const ranking = normalizedScores(snapshots, selectedKpis);
  const bestScenario = ranking[0] ?? null;
  const baselineSnapshot = activeBaselineSnapshot(snapshots);

  return (
    <div
      style={{
        ...cardStyle(),
        display: "grid",
        gap: scaleNum(16),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: scaleNum(12),
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: scaleNum(6) }}>
          <h2 style={sectionTitle("Optimize Mode")}>Optimize Mode</h2>
          <div
            style={{
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              lineHeight: 1.5,
            }}
          >
            Compare scenario snapshots using the currently selected Decision KPIs. This workspace supports structured tradeoff review; it does not perform automatic optimization.
          </div>
        </div>

        <button type="button" onClick={onSaveSnapshot} style={buttonStyle("primary")}>
          Save Snapshot
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: scaleNum(12),
        }}
      >
        <div
          style={{
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(12),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted, marginBottom: scaleNum(4) }}>
            Current scenario
          </div>
          <div style={{ fontSize: scaleNum(15), fontWeight: 700, color: THEME.colors.textPrimary }}>
            {currentScenarioName}
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(12),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted, marginBottom: scaleNum(4) }}>
            Decision KPIs
          </div>
          <div style={{ fontSize: scaleNum(13), color: THEME.colors.textPrimary, lineHeight: 1.5 }}>
            {selectedKpis.map((kpiId) => KPI_BY_ID[kpiId]?.label ?? kpiId).join(", ")}
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(12),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted, marginBottom: scaleNum(4) }}>
            Active baseline
          </div>
          <div style={{ fontSize: scaleNum(15), fontWeight: 700, color: THEME.colors.textPrimary }}>
            {baselineSnapshot?.name ?? "No snapshots yet"}
          </div>
          {baselineSnapshot ? (
            <div style={{ fontSize: scaleNum(12), color: THEME.colors.primary, marginTop: scaleNum(4) }}>
              {baselineSnapshot.isBaseline ? "Pinned baseline" : "Using first snapshot as baseline"}
            </div>
          ) : null}
        </div>

        <div
          style={{
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(12),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted, marginBottom: scaleNum(4) }}>
            Best scenario
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: scaleNum(8),
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: scaleNum(15), fontWeight: 700, color: THEME.colors.textPrimary }}>
              {bestScenario?.name ?? "No snapshots yet"}
            </div>
            {bestScenario ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                  borderRadius: 999,
                  background: "rgba(22,163,74,0.12)",
                  color: THEME.colors.success,
                  border: `1px solid ${THEME.colors.success}`,
                  fontSize: scaleNum(11),
                  fontWeight: 700,
                }}
              >
                Best
              </span>
            ) : null}
          </div>
          {bestScenario ? (
            <div style={{ fontSize: scaleNum(12), color: THEME.colors.success, marginTop: scaleNum(4) }}>
              Aggregate score: {num(bestScenario.aggregateScore, 1)}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gap: scaleNum(10) }}>
        <h3 style={sectionTitle("Decision KPI comparison")}>Decision KPI comparison</h3>
        {snapshots.length === 0 ? (
          <div
            style={{
              border: `1px dashed ${THEME.colors.border}`,
              borderRadius: THEME.radius.md,
              padding: scaleNum(18),
              color: THEME.colors.textMuted,
              background: THEME.colors.surfaceRow ?? THEME.colors.background,
            }}
          >
            Save at least one snapshot to compare scenarios across the selected Decision KPIs.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 760,
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: `${scaleNum(8)}px ${scaleNum(12)}px`,
                      background: THEME.colors.surfaceRow ?? THEME.colors.background,
                      borderBottom: `1px solid ${THEME.colors.border}`,
                      color: THEME.colors.textMuted,
                      fontSize: scaleNum(12),
                    }}
                  >
                    Decision KPI
                  </th>
                  {snapshots.map((snapshot) => (
                    <th
                      key={snapshot.id}
                      style={{
                        textAlign: "left",
                        padding: `${scaleNum(8)}px ${scaleNum(12)}px`,
                        background: THEME.colors.surfaceRow ?? THEME.colors.background,
                        borderBottom: `1px solid ${THEME.colors.border}`,
                        color: THEME.colors.textPrimary,
                        fontSize: scaleNum(13),
                        minWidth: 170,
                      }}
                    >
                      <div style={{ display: "grid", gap: scaleNum(4) }}>
                        <span>{snapshot.name}</span>
                        {snapshot.isBaseline ? (
                          <span
                            style={{
                              display: "inline-flex",
                              width: "fit-content",
                              padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                              borderRadius: 999,
                              background: THEME.colors.surface,
                              color: THEME.colors.primary,
                              fontSize: scaleNum(11),
                              fontWeight: 700,
                            }}
                          >
                            Baseline
                          </span>
                        ) : bestScenario?.id === snapshot.id ? null : null}
                        {baselineSnapshot?.id === snapshot.id && !snapshot.isBaseline ? (
                          <span
                            style={{
                              display: "inline-flex",
                              width: "fit-content",
                              padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                              borderRadius: 999,
                              background: THEME.colors.surface,
                              color: THEME.colors.primary,
                              border: `1px solid ${THEME.colors.primary}`,
                              fontSize: scaleNum(11),
                              fontWeight: 700,
                            }}
                          >
                            Baseline
                          </span>
                        ) : null}
                        {bestScenario?.id === snapshot.id ? (
                          <span
                            style={{
                              display: "inline-flex",
                              width: "fit-content",
                              padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                              borderRadius: 999,
                              background: "rgba(22,163,74,0.12)",
                              color: THEME.colors.success,
                              border: `1px solid ${THEME.colors.success}`,
                              fontSize: scaleNum(11),
                              fontWeight: 700,
                            }}
                          >
                            Best
                          </span>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedKpis.map((kpiId) => {
                  const kpi = KPI_BY_ID[kpiId];
                  const definition = metricDefinition(kpiId);

                  return (
                    <tr key={kpiId}>
                      <td
                        style={{
                          padding: `${scaleNum(8)}px ${scaleNum(12)}px`,
                          borderBottom: `1px solid ${THEME.colors.border}`,
                          color: THEME.colors.textPrimary,
                          fontWeight: 700,
                          verticalAlign: "top",
                        }}
                      >
                        <div>{kpi?.label ?? kpiId}</div>
                        <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted, marginTop: scaleNum(4) }}>
                          {kpi?.direction === "maximize" ? "Higher is better" : "Lower is better"}
                        </div>
                      </td>
                      {snapshots.map((snapshot) => {
                        const kpiEvaluation = evaluateKpiCell(snapshot, snapshots, kpiId);
                        const tone = cellTone(kpiEvaluation);
                        const indicator = cellIndicator(kpiEvaluation);
                        const baselineValue = baselineSnapshot
                          ? definition.value(baselineSnapshot)
                          : null;
                        const delta = baselineValue == null ? null : kpiEvaluation.rawValue - baselineValue;
                        const deltaStatus =
                          baselineSnapshot == null || delta == null
                            ? null
                            : deltaTone(kpiId, delta);
                        const isBaselineColumn = baselineSnapshot?.id === snapshot.id;

                        return (
                          <td
                            key={`${snapshot.id}-${kpiId}`}
                            style={{
                              padding: `${scaleNum(8)}px ${scaleNum(12)}px`,
                              borderBottom: `1px solid ${THEME.colors.border}`,
                              background: tone.background,
                              color: tone.color,
                              verticalAlign: "top",
                              boxShadow: `inset 0 0 0 1px ${tone.borderColor}`,
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                justifyItems: "end",
                                gap: scaleNum(4),
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>{definition.display(snapshot)}</div>
                              {indicator ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                                    borderRadius: 999,
                                    background: indicator.background,
                                    color: indicator.color,
                                    border: `1px solid ${indicator.borderColor}`,
                                    fontSize: scaleNum(11),
                                    fontWeight: 700,
                                  }}
                                >
                                  {indicator.label}
                                </span>
                              ) : null}
                              <div
                                style={{
                                  fontSize: scaleNum(11),
                                  color: isBaselineColumn
                                    ? THEME.colors.primary
                                    : deltaStatus?.color ?? THEME.colors.textMuted,
                                  fontWeight: isBaselineColumn || (deltaStatus && deltaStatus.color !== THEME.colors.textMuted) ? 700 : 500,
                                }}
                              >
                                {isBaselineColumn
                                  ? "Baseline"
                                  : deltaStatus?.label ?? "No baseline"}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ranking.length > 0 ? (
        <div style={{ display: "grid", gap: scaleNum(10) }}>
          <h3 style={sectionTitle("Decision KPI ranking")}>Decision KPI ranking</h3>
          <div
            style={{
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              lineHeight: 1.5,
            }}
          >
            Ranking uses only the selected Decision KPIs with equal weighting across those KPI rows.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: scaleNum(10),
            }}
          >
            {ranking.map((snapshot, index) => (
              <div
                key={snapshot.id}
                style={{
                  border: `1px solid ${index === 0 ? THEME.colors.success : THEME.colors.border}`,
                  borderRadius: THEME.radius.md,
                  padding: scaleNum(12),
                  background: index === 0 ? "rgba(22,163,74,0.12)" : THEME.colors.surface,
                  boxShadow: index === 0 ? `inset 0 0 0 1px ${THEME.colors.success}` : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: scaleNum(8),
                    marginBottom: scaleNum(4),
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted }}>
                    Rank #{index + 1}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: scaleNum(6), flexWrap: "wrap" }}>
                    {baselineSnapshot?.id === snapshot.id ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                          borderRadius: 999,
                          background: THEME.colors.surface,
                          color: THEME.colors.primary,
                          border: `1px solid ${THEME.colors.primary}`,
                          fontSize: scaleNum(11),
                          fontWeight: 700,
                        }}
                      >
                        Baseline
                      </span>
                    ) : null}
                    {index === 0 ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: `${scaleNum(2)}px ${scaleNum(8)}px`,
                          borderRadius: 999,
                          background: THEME.colors.success,
                          color: THEME.colors.surface,
                          fontSize: scaleNum(11),
                          fontWeight: 700,
                        }}
                      >
                        Best
                      </span>
                    ) : null}
                  </div>
                </div>
                <div style={{ fontSize: scaleNum(15), fontWeight: 700, color: THEME.colors.textPrimary }}>
                  {snapshot.name}
                </div>
                <div style={{ fontSize: scaleNum(13), color: index === 0 ? THEME.colors.success : THEME.colors.textMuted, marginTop: scaleNum(6) }}>
                  Aggregate score: {num(snapshot.aggregateScore, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: scaleNum(10) }}>
        <h3 style={sectionTitle("Snapshot controls")}>Snapshot controls</h3>
        {snapshots.length === 0 ? (
          <div style={{ fontSize: scaleNum(13), color: THEME.colors.textMuted }}>
            No snapshots saved in this session yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: scaleNum(10),
            }}
          >
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                style={{
                  border: `1px solid ${THEME.colors.border}`,
                  borderRadius: THEME.radius.md,
                  padding: scaleNum(12),
                  background: THEME.colors.surface,
                  display: "grid",
                  gap: scaleNum(10),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: scaleNum(10),
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    value={snapshot.name}
                    onChange={(event) => onRenameSnapshot(snapshot.id, event.target.value)}
                    style={{
                      flex: "1 1 220px",
                      minHeight: scaleNum(36),
                      padding: `${scaleNum(7)}px ${scaleNum(9)}px`,
                      borderRadius: THEME.radius.sm,
                      border: `1px solid ${THEME.colors.border}`,
                      background: THEME.colors.surfaceRow ?? THEME.colors.surface,
                      color: THEME.colors.textPrimary,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: scaleNum(8),
                      flexWrap: "wrap",
                    }}
                  >
                    <button type="button" onClick={() => onDuplicateSnapshot(snapshot.id)} style={buttonStyle()}>
                      Duplicate
                    </button>
                    <button type="button" onClick={() => onSetBaseline(snapshot.id)} style={buttonStyle()}>
                      {snapshot.isBaseline ? "Baseline Set" : "Set as Baseline"}
                    </button>
                    <button type="button" onClick={() => onDeleteSnapshot(snapshot.id)} style={buttonStyle("danger")}>
                      Delete
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: scaleNum(10),
                    flexWrap: "wrap",
                    fontSize: scaleNum(12),
                    color: THEME.colors.textMuted,
                  }}
                >
                  <span>Saved: {snapshot.savedAtLabel}</span>
                  <span style={{ color: riskColor(snapshot.metrics.aggregateRiskLabel) }}>
                    Risk: {snapshot.metrics.aggregateRiskLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
