import ModalShell from "../ui/ModalShell";
import { KPI_OPTIONS, kpiDirectionLabel } from "../config/kpis";
import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle } from "../ui/formatters";

function optionStyle(isSelected) {
  return {
    border: `1px solid ${isSelected ? THEME.colors.primary : THEME.colors.border}`,
    borderRadius: THEME.radius.md,
    padding: scaleNum(12),
    background: isSelected ? THEME.colors.surfaceRow ?? THEME.colors.background : THEME.colors.surface,
    color: THEME.colors.textPrimary,
    display: "grid",
    gap: scaleNum(4),
    cursor: "pointer",
    textAlign: "left",
  };
}

export default function KpiSelectorPanel({
  selectedKpis,
  onToggleKpi,
  isOpen,
  onOpen,
  onClose,
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: scaleNum(10),
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontSize: scaleNum(13),
            color: THEME.colors.textMuted,
            lineHeight: 1.45,
          }}
        >
          Business analysis priorities control which KPI cards are shown in the primary dashboard. They change emphasis and analysis framing only, not simulation math.
        </div>
        <button type="button" onClick={onOpen} style={buttonStyle()}>
          Decision KPIs: {selectedKpis.length} shown
        </button>
      </div>

      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Decision Priorities"
        subtitle="Choose which KPIs Business Mode should show and emphasize. This changes dashboard visibility and framing, not simulation math."
        size="sm"
      >
        <div
          style={{
            display: "grid",
            gap: scaleNum(12),
          }}
        >
          <div
            style={{
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              lineHeight: 1.5,
            }}
          >
            At least one KPI must remain selected. Service level is available for future use, but it is not a default KPI in the current model.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: scaleNum(10),
            }}
          >
            {KPI_OPTIONS.map((kpi) => {
              const isSelected = selectedKpis.includes(kpi.id);

              return (
                <button
                  key={kpi.id}
                  type="button"
                  onClick={() => onToggleKpi(kpi.id)}
                  aria-pressed={isSelected}
                  style={optionStyle(isSelected)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: scaleNum(8),
                    }}
                  >
                    <span style={{ fontSize: scaleNum(14), fontWeight: 700 }}>{kpi.label}</span>
                    {isSelected ? (
                      <span
                        style={{
                          fontSize: scaleNum(11),
                          fontWeight: 700,
                          color: THEME.colors.primary,
                        }}
                      >
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted }}>
                    {kpi.category} - {kpiDirectionLabel(kpi.direction)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </ModalShell>
    </>
  );
}
