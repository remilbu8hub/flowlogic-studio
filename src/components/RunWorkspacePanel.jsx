import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle, cardStyle, money, num } from "../ui/formatters";

function statCard(label, value, tone = THEME.colors.textPrimary) {
  return (
    <div
      style={{
        border: `1px solid ${THEME.colors.border}`,
        borderRadius: THEME.radius.md,
        padding: scaleNum(10),
        background: THEME.colors.surfaceRow ?? THEME.colors.background,
      }}
    >
      <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted }}>
        {label}
      </div>
      <div
        style={{
          fontSize: scaleNum(16),
          fontWeight: 700,
          color: tone,
          marginTop: scaleNum(4),
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function RunWorkspacePanel({
  runState,
  runSummary,
  runHistory,
  onStep,
  onReset,
}) {
  const recentHistory = runHistory.slice(-6).reverse();
  const lastStepSummary = runState.lastStepSummary;

  return (
    <div style={{ display: "grid", gap: scaleNum(12) }}>
      <div
        style={{
          ...cardStyle(),
          display: "grid",
          gap: scaleNum(10),
        }}
      >
        <div
          style={{
            fontSize: scaleNum(14),
            fontWeight: 700,
            color: THEME.colors.textPrimary,
          }}
        >
          Run Controls
        </div>
        <div
          style={{
            fontSize: scaleNum(13),
            lineHeight: 1.5,
            color: THEME.colors.textMuted,
          }}
        >
          Step through a Beer Game-style flow where customer demand, delayed shipments,
          inventory targets, and internal backorders create overstock and service failures
          across the chain.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: scaleNum(8),
          }}
        >
          {statCard("Time step", num(runState.currentTimeStep, 0))}
          {statCard("In transit", num(runSummary.inTransitUnits, 0))}
          {statCard("Customer demand", num(runSummary.totalCustomerDemand, 0))}
          {statCard(
            "Service failures",
            num(runSummary.totalServiceFailure, 0),
            runSummary.totalServiceFailure > 0 ? THEME.colors.danger : THEME.colors.textPrimary
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: scaleNum(8),
          }}
        >
          {statCard("Inventory", num(runSummary.totalInventory, 0))}
          {statCard(
            "Internal backlog",
            num(runSummary.totalBacklog, 0),
            runSummary.totalBacklog > 0 ? THEME.colors.danger : THEME.colors.textPrimary
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: scaleNum(8),
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(10),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div
            style={{
              fontSize: scaleNum(13),
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Run costs
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: scaleNum(8),
            }}
          >
            {statCard("Holding", money(runSummary.cumulativeCosts.holding))}
            {statCard("Backorder", money(runSummary.cumulativeCosts.backorder), THEME.colors.danger)}
            {statCard("Service failure", money(runSummary.cumulativeCosts.serviceFailure), THEME.colors.danger)}
            {statCard("Total", money(runSummary.cumulativeCosts.total), THEME.colors.primary)}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: scaleNum(8),
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(10),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div
            style={{
              fontSize: scaleNum(13),
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Last step summary
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: scaleNum(8),
              fontSize: scaleNum(12),
            }}
          >
            <div>
              <div style={{ color: THEME.colors.textMuted }}>Demand served</div>
              <div style={{ color: THEME.colors.textPrimary, fontWeight: 700 }}>
                {num(lastStepSummary?.demandServed ?? 0, 0)}
              </div>
            </div>
            <div>
              <div style={{ color: THEME.colors.textMuted }}>Internal backlog created</div>
              <div
                style={{
                  color:
                    (lastStepSummary?.backlogCreated ?? 0) > 0
                      ? THEME.colors.danger
                      : THEME.colors.textPrimary,
                  fontWeight: 700,
                }}
              >
                {num(lastStepSummary?.backlogCreated ?? 0, 0)}
              </div>
            </div>
            <div>
              <div style={{ color: THEME.colors.textMuted }}>Shipments launched</div>
              <div style={{ color: THEME.colors.textPrimary, fontWeight: 700 }}>
                {num(lastStepSummary?.shipmentsLaunched ?? 0, 0)}
              </div>
            </div>
            <div>
              <div style={{ color: THEME.colors.textMuted }}>Shipments arrived</div>
              <div style={{ color: THEME.colors.textPrimary, fontWeight: 700 }}>
                {num(lastStepSummary?.shipmentsArrived ?? 0, 0)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: scaleNum(8),
            border: `1px solid ${THEME.colors.border}`,
            borderRadius: THEME.radius.md,
            padding: scaleNum(10),
            background: THEME.colors.surfaceRow ?? THEME.colors.background,
          }}
        >
          <div
            style={{
              fontSize: scaleNum(13),
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Run history
          </div>
          {recentHistory.length === 0 ? (
            <div style={{ fontSize: scaleNum(12), color: THEME.colors.textMuted }}>
              No history yet. Step the simulation to build a simple teaching timeline.
            </div>
          ) : (
            <div style={{ display: "grid", gap: scaleNum(6) }}>
              {recentHistory.map((entry) => (
                <div
                  key={`run-step-${entry.timestep}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr 1fr 1fr 1fr",
                    gap: scaleNum(8),
                    alignItems: "center",
                    fontSize: scaleNum(12),
                    color: THEME.colors.textPrimary,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>T{entry.timestep}</div>
                  <div>Inv {num(entry.totalInventory, 0)}</div>
                  <div style={{ color: entry.totalBacklog > 0 ? THEME.colors.danger : THEME.colors.textPrimary }}>
                    Backlog {num(entry.totalBacklog, 0)}
                  </div>
                  <div>Transit {num(entry.inTransitUnits, 0)}</div>
                  <div style={{ color: entry.serviceFailure > 0 ? THEME.colors.danger : THEME.colors.textPrimary }}>
                    Missed {num(entry.serviceFailure, 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: scaleNum(8),
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={onStep} style={buttonStyle("primary")}>
            Step
          </button>
          <button type="button" onClick={onReset} style={buttonStyle()}>
            Reset Run
          </button>
        </div>
      </div>
    </div>
  );
}
