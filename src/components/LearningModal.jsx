// src/components/LearningModal.jsx

import ModalShell from "./ModalShell";
import { sampleScenarios } from "../data/sampleScenarios";
import { useAppMode } from "../state/appModeContext";
import { THEME } from "../config/theme";

function sectionStyle() {
  return {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.lg,
    padding: 18,
    background: THEME.colors.surface,
    marginBottom: 16,
  };
}

function calloutStyle(variant = "default") {
  const palette = {
    default: {
      background: THEME.colors.background,
      border: THEME.colors.border,
      color: THEME.colors.textPrimary,
    },
    tip: {
      background: "#eef6ff",
      border: "#8cb4ff",
      color: "#0b3d91",
    },
    warning: {
      background: "#fff8e6",
      border: "#e3b341",
      color: "#7a4d00",
    },
    success: {
      background: "#edf7ed",
      border: "#7bc47f",
      color: "#1b5e20",
    },
  };

  const chosen = palette[variant] ?? palette.default;

  return {
    background: chosen.background,
    border: `1px solid ${chosen.border}`,
    color: chosen.color,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  };
}

function tableStyle() {
  return {
    width: "100%",
    borderCollapse: "collapse",
    background: THEME.colors.surface,
  };
}

function thStyle() {
  return {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: `1px solid ${THEME.colors.border}`,
    background: THEME.colors.background,
    fontSize: 13,
    color: THEME.colors.textMuted,
  };
}

function tdStyle() {
  return {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f6",
    verticalAlign: "top",
    lineHeight: 1.5,
    color: THEME.colors.textPrimary,
  };
}

function inlineCodeStyle() {
  return {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    background: THEME.colors.background,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: "0.95em",
  };
}

function FormulaBlock({ children, note }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 12,
        padding: 16,
        background: "#fbfcfe",
        marginTop: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 20,
          lineHeight: 1.5,
          color: "#1f2328",
        }}
      >
        {children}
      </div>
      {note ? (
        <div style={{ marginTop: 10, color: "#57606a", fontSize: 14 }}>{note}</div>
      ) : null}
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, lineHeight: 1.7 }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function TOCLink({ href, children }) {
  return (
    <a
      href={href}
      style={{
        color: "#0969da",
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  );
}

function scenarioCardStyle() {
  return {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.lg,
    padding: 14,
    background: THEME.colors.surface,
    display: "grid",
    gap: 10,
    minWidth: 0,
  };
}

function loadButtonStyle() {
  return {
    border: `1px solid ${THEME.colors.primary}`,
    background: THEME.colors.primary,
    color: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    padding: "10px 12px",
    fontWeight: 600,
    cursor: "pointer",
  };
}

function scenarioModeWeight(intendedMode, currentMode) {
  if (intendedMode === currentMode) return 0;
  if (intendedMode === "both") return 1;
  return 2;
}

function scenarioModeLabel(intendedMode) {
  if (intendedMode === "educator") return "Educator";
  if (intendedMode === "business") return "Business";
  return "Both Modes";
}

function scenarioBadgeStyle(intendedMode) {
  if (intendedMode === "educator") {
    return {
      background: "#eef6ff",
      border: "#8cb4ff",
      color: "#0b3d91",
    };
  }

  if (intendedMode === "business") {
    return {
      background: "#edf7ed",
      border: "#7bc47f",
      color: "#1b5e20",
    };
  }

  return {
    background: "#f6f8fa",
    border: "#d0d7de",
    color: "#57606a",
  };
}

export default function LearningModal({ isOpen, onClose, onLoadScenario }) {
  const { mode } = useAppMode();
  const orderedScenarios = [...sampleScenarios].sort((scenarioA, scenarioB) => {
    const weightDelta =
      scenarioModeWeight(scenarioA.intendedMode, mode) -
      scenarioModeWeight(scenarioB.intendedMode, mode);

    if (weightDelta !== 0) return weightDelta;
    return String(scenarioA.title).localeCompare(String(scenarioB.title));
  });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Learning Center"
      subtitle="A structured guide to what the simulator is modeling, why the outputs move, and how to use it like a decision lab."
      size="xl"
    >
      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 18 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            alignSelf: "start",
            border: "1px solid #d0d7de",
            borderRadius: 12,
            padding: 16,
            background: "#ffffff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Contents</h3>
          <div style={{ display: "grid", gap: 8, lineHeight: 1.5 }}>
            <TOCLink href="#sample-scenarios">0. Start with a scenario</TOCLink>
            <TOCLink href="#why-model">1. Why model a supply chain?</TOCLink>
            <TOCLink href="#core-idea">2. What this simulator actually does</TOCLink>
            <TOCLink href="#v2-features">3. Supply chain design concepts</TOCLink>
            <TOCLink href="#nodes-edges">3. How the network is represented</TOCLink>
            <TOCLink href="#math-overview">4. The math behind the simulator</TOCLink>
            <TOCLink href="#inventory-logic">5. Pipeline stock and safety stock</TOCLink>
            <TOCLink href="#service-level">6. Service level and the k factor</TOCLink>
            <TOCLink href="#cost-model">7. Cost model and carrying logic</TOCLink>
            <TOCLink href="#risk-model">8. Risk model and vulnerability scoring</TOCLink>
            <TOCLink href="#push-pull">9. Push-pull boundaries</TOCLink>
            <TOCLink href="#inventory-forms">10. Inventory forms and commitment</TOCLink>
            <TOCLink href="#parameters">11. Parameters explained</TOCLink>
            <TOCLink href="#tradeoffs">12. Reading tradeoffs correctly</TOCLink>
            <TOCLink href="#experiments">13. Suggested experiments</TOCLink>
            <TOCLink href="#worked-example">14. Worked example</TOCLink>
            <TOCLink href="#teaching-notes">15. Teaching notes and caveats</TOCLink>
          </div>

          <div style={calloutStyle("tip")}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Best workflow</div>
            <div>
              Load a simple scenario, save a baseline, change one structural choice, then use the
              comparison and coaching panels to understand what moved.
            </div>
          </div>
        </div>

        <div>
          <section id="sample-scenarios" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>0. Start with a Scenario</h2>
            <p>
              The fastest way to understand this simulator is to begin with an existing network.
              A scenario gives you a structure, a demand pattern, and a starting set of tradeoffs.
              From there, you can learn by controlled experimentation instead of building every
              supply chain from scratch.
            </p>

            <div style={calloutStyle("success")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Recommended workflow</div>
              <div>
                Load a scenario → observe the baseline → save it → change one variable at a time →
                compare cost, response, inventory, and risk.
              </div>
            </div>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Prioritized for {mode === "business" ? "Business" : "Educator"} mode
              </div>
              <div>
                Scenarios aligned to your current mode appear first, while the full scenario
                library remains available.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                gap: 12,
                marginTop: 12,
              }}
            >
              {orderedScenarios.map((scenario) => {
                const badge = scenarioBadgeStyle(scenario.intendedMode);
                const purpose =
                  mode === "business"
                    ? scenario.businessPurpose || scenario.learningPurpose
                    : scenario.learningPurpose || scenario.businessPurpose;

                return (
                <div key={scenario.id} style={scenarioCardStyle()}>
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: `1px solid ${badge.border}`,
                        background: badge.background,
                        color: badge.color,
                        fontSize: 12,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      Best for: {scenarioModeLabel(scenario.intendedMode)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                      {scenario.title}
                    </div>
                    <div style={{ color: "#57606a", lineHeight: 1.5, marginBottom: 8 }}>
                      {scenario.shortDescription}
                    </div>
                    {purpose ? (
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                        <b>{mode === "business" ? "Planning focus:" : "Learning focus:"}</b>{" "}
                        {purpose}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ fontSize: 13, color: "#57606a", lineHeight: 1.5 }}>
                    Service level: {Math.round((scenario.serviceLevel ?? 0.95) * 100)}%
                    <br />
                    Boundary position: {scenario.boundaryColumn}
                    <br />
                    Nodes: {scenario.nodes.length} | Lanes: {scenario.edges.length}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadScenario?.(scenario);
                      onClose?.();
                    }}
                    style={loadButtonStyle()}
                  >
                    Load Scenario
                  </button>
                </div>
                );
              })}
            </div>
          </section>

          <section id="why-model" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>1. Why Model a Supply Chain?</h2>

            <p>
              A supply chain is a structured system, not just a collection of vendors and shipping
              events. The design of that system determines how quickly demand information travels,
              where inventory accumulates, how exposed the network is to disruption, and what the
              system costs to operate.
            </p>

            <p>
              Most day-to-day supply chain problems are symptoms of structural choices. Late
              deliveries, chronic stockouts, high inventory, overreliance on one supplier, and slow
              recovery after shocks often trace back to the same root cause:
            </p>

            <FormulaBlock note="This is the mindset shift behind the simulator.">
              Weak structure creates predictable operational pain.
            </FormulaBlock>

            <p>
              That is why a structural simulator is valuable. It helps you ask not only, “What
              happened?” but also, “What about this network made that outcome likely?”
            </p>

            <div style={calloutStyle("success")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Core principle</div>
              <div>
                Most supply chain outcomes are not accidents. They are structural consequences.
              </div>
            </div>
          </section>

          <section id="core-idea" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>2. What This Simulator Actually Does</h2>

            <p>
              This tool is best understood as a decision lab. It is not an ERP replacement, a full
              optimization engine, or an accounting model. Its purpose is to make structural
              tradeoffs visible.
            </p>

            <FormulaBlock note="This is the question that drives the entire simulator.">
              What changes when I change the structure of the supply chain?
            </FormulaBlock>

            <p>
              In practice, the simulator translates structural decisions into four major outputs:
            </p>

            <BulletList
              items={[
                "Cost: how much burden the network carries",
                "Inventory: how much stock the system requires to support flow and service",
                "Response time: how long the chain takes to react and fulfill",
                "Risk: how vulnerable the network is to uncertainty and structural fragility",
              ]}
            />

            <p>
              The most important use of the simulator is comparative. You change a design choice and
              then ask which outputs moved, how much they moved, and why they moved.
            </p>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Interpret outputs directionally</div>
              <div>
                The model is strongest when you use it to compare structures, not when you treat it
                as a literal financial forecast.
              </div>
            </div>
          </section>

          <section id="v2-features" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>3. Supply Chain Design Concepts</h2>

            <p>
              A few high-value features shape how you read the network without changing the spirit
              of the simulator. These are still teaching-oriented features, so the goal is clarity,
              not heavy optimization.
            </p>

            <h3 style={{ marginTop: 18 }}>Structure-aware push-pull boundary</h3>
            <p>
              The boundary follows the structure of the supply chain graph. Push and pull are
              assigned using actual network depth instead of only node type order. Branching
              structures are handled more honestly, and retail nodes pushed too far upstream are
              flagged as a warning.
            </p>

            <h3 style={{ marginTop: 18 }}>Transport mode tradeoffs</h3>
            <p>
              Lanes can use truck, air, or ship. Air is faster but more expensive. Ship is slower
              but cheaper. Truck stays in the middle. These settings help you see how flow speed
              and transport burden move together.
            </p>

            <h3 style={{ marginTop: 18 }}>3PL outsourcing</h3>
            <p>
              A lane can be marked as outsourced to a 3PL. In the current model, that keeps the
              same transport mode logic but lowers lane transport cost to reflect logistics
              specialization and economies of scale.
            </p>

            <h3 style={{ marginTop: 18 }}>Cost accumulation view</h3>
            <p>
              The workspace can switch from the graph view to a cost accumulation view. That second
              view helps you see where cost builds across nodes and lanes instead of only seeing the
              final total.
            </p>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>How to use these well</div>
              <div>
                Change one lane or one boundary choice at a time, then compare the graph, the cost
                buildup, and the coaching notes together.
              </div>
            </div>
          </section>

          <section id="nodes-edges" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>3. How the Network Is Represented</h2>

            <p>
              The supply chain is modeled as a directed graph. This is important because the graph is
              not just visual. It determines how demand, delay, inventory, and risk propagate.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Element</th>
                    <th style={thStyle()}>Meaning in the model</th>
                    <th style={thStyle()}>Operational interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Supplier node</td>
                    <td style={tdStyle()}>Upstream source of material or components</td>
                    <td style={tdStyle()}>Vendor, component source, qualified external supplier</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Factory node</td>
                    <td style={tdStyle()}>Transformation or configuration stage</td>
                    <td style={tdStyle()}>Manufacturing, assembly, late customization</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>DC node</td>
                    <td style={tdStyle()}>Distribution and holding stage</td>
                    <td style={tdStyle()}>Warehouse, regional fulfillment center</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Retail node</td>
                    <td style={tdStyle()}>Customer-facing downstream stocking point</td>
                    <td style={tdStyle()}>Store, regional delivery stock, final market buffer</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Customer node</td>
                    <td style={tdStyle()}>Demand sink</td>
                    <td style={tdStyle()}>Market, segment, channel, customer group</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Lane / edge</td>
                    <td style={tdStyle()}>Flow relationship between stages</td>
                    <td style={tdStyle()}>Freight lane, internal transfer, replenishment path</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Demand starts at customer nodes and moves upstream. Inventory and response time behave
              differently depending on how many stages exist, how they are connected, and where the
              push-pull boundary sits.
            </p>

            <div style={calloutStyle()}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Why the graph matters</div>
              <div>
                A graph is a compact way to represent dependency. If one node slows down, every
                downstream dependent node feels it.
              </div>
            </div>
          </section>

          <section id="math-overview" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>4. The Math Behind the Simulator</h2>

            <p>
              The simulator uses simplified but standard supply chain logic. It is not mathematically
              exhaustive, but it is structured enough to teach the right relationships.
            </p>

            <p>The main mathematical ideas are:</p>

            <BulletList
              items={[
                "Demand propagates upstream",
                "Variability combines nonlinearly",
                "Lead time creates pipeline stock",
                "Uncertainty creates safety stock",
                "Service level increases required buffers",
                "Structure changes where stock and risk sit in the network",
              ]}
            />

            <p>
              The model does not solve every real-world detail such as capacity allocation,
              transportation mode optimization, contractual constraints, or nonlinear pricing. It
              focuses instead on the structural logic that most clearly explains why different
              designs behave differently.
            </p>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>The right way to read the math</div>
              <div>
                Ask whether the formula teaches the right direction and sensitivity, not whether it
                perfectly reproduces a specific firm's accounting ledger.
              </div>
            </div>
          </section>

          <section id="inventory-logic" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>5. Pipeline Stock and Safety Stock</h2>

            <p>
              Inventory in the simulator is split into two conceptually different pieces. This is
              one of the most important ideas in supply chain thinking.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Inventory component</th>
                    <th style={thStyle()}>Why it exists</th>
                    <th style={thStyle()}>What increases it</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Pipeline stock</td>
                    <td style={tdStyle()}>Material is committed while time passes</td>
                    <td style={tdStyle()}>Higher demand, longer lead time</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Safety stock</td>
                    <td style={tdStyle()}>Protection against uncertainty</td>
                    <td style={tdStyle()}>Higher service level, higher variability, longer review cycles</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: 18 }}>Pipeline Stock</h3>
            <FormulaBlock note="Pipeline stock grows linearly with average demand and average lead time.">
              PS = μ × L
            </FormulaBlock>

            <p>
              This is the inventory required simply because the system takes time to replenish. If
              demand is high or replenishment is slow, pipeline stock rises.
            </p>

            <h3 style={{ marginTop: 18 }}>Safety Stock</h3>
            <FormulaBlock note="This combines demand uncertainty with lead-time and review-period exposure.">
              SS = k × √( μ² × s² + (L + R) × σ² )
            </FormulaBlock>

            <p>
              Safety stock exists because the future is uncertain. It increases when the system is
              more variable, more delayed, or asked to provide higher service.
            </p>

            <div style={calloutStyle("warning")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Interpretation rule</div>
              <div>
                Pipeline stock is mostly a speed problem. Safety stock is mostly an uncertainty
                problem.
              </div>
            </div>
          </section>

          <section id="service-level" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>6. Service Level and the k Factor</h2>

            <p>
              Service level represents how aggressively the system tries to avoid stockouts. In the
              simulator, service level maps to a <span style={inlineCodeStyle()}>k</span> factor
              that scales safety stock.
            </p>

            <FormulaBlock note="Higher service level means larger buffers.">
              Higher target service → higher k → higher safety stock
            </FormulaBlock>

            <p>Typical intuition looks like this:</p>

            <BulletList
              items={[
                "90% service level: less aggressive buffering",
                "95% service level: moderate, common target",
                "99% service level: much larger stock commitment",
              ]}
            />

            <p>
              The relationship is nonlinear. Small increases in target service near the top end can
              produce disproportionate increases in safety stock and cost.
            </p>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Managerial meaning</div>
              <div>
                Very high service targets are expensive. They are often justified only when lost
                sales or mission critical failures are extremely costly.
              </div>
            </div>
          </section>

          <section id="cost-model" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>7. Cost Model and Carrying Logic</h2>

            <p>
              The simulator treats cost as a combination of inventory burden and node operating
              burden. That keeps the model simple while still making structure matter.
            </p>

            <h3 style={{ marginTop: 16 }}>Inventory Cost</h3>
            <p>
              Inventory cost is driven by:
            </p>
            <BulletList
              items={[
                "How much pipeline stock exists",
                "How much safety stock exists",
                "What each unit is worth",
                "The carrying rate applied to that value",
              ]}
            />

            <p>
              Carrying rate represents the cost of holding inventory. In real settings this can
              include capital cost, storage, obsolescence, insurance, handling burden, and shrink.
            </p>

            <h3 style={{ marginTop: 16 }}>Node Operating Cost</h3>
            <p>
              Nodes also impose per-unit operating burden. More throughput through a stage creates
              more activity, and more activity creates more cost.
            </p>

            <FormulaBlock note="This is a simplified throughput-based operating burden.">
              Node operating burden ≈ flow × per-unit node cost
            </FormulaBlock>

            <p>
              This means that extra stages can create value if they improve resilience or response
              enough, but they can also become expensive if they add complexity without solving a
              real structural problem.
            </p>

            <div style={calloutStyle()}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>What cost means here</div>
              <div>
                Cost in this simulator is not full accounting cost. It is a structural burden score
                expressed in financially interpretable terms.
              </div>
            </div>
          </section>

          <section id="risk-model" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>8. Risk Model and Vulnerability Scoring</h2>

            <p>
              Risk in this simulator is a composite indicator of vulnerability. It is not the
              probability of failure. It is a structured score that reflects how fragile or exposed
              a node or network is.
            </p>

            <p>Risk is influenced by several components:</p>

            <BulletList
              items={[
                "Demand variability",
                "Lead-time and review-time exposure",
                "Single-source dependence",
                "Geographic concentration",
                "Downstream dependence and boundary exposure",
                "Inventory commitment at later stages",
              ]}
            />

            <p>
              Structural adders and reducers modify risk depending on whether the network is
              concentrated or diversified. For example, one supplier feeding a critical stage is
              usually more fragile than multiple qualified sources feeding that same stage.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Pattern</th>
                    <th style={thStyle()}>Typical effect on risk</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Single source</td>
                    <td style={tdStyle()}>Risk rises because one disruption can stop flow</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Multiple inbound sources</td>
                    <td style={tdStyle()}>Risk tends to fall through diversification</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Offshore dependence</td>
                    <td style={tdStyle()}>Lead time and exposure often rise</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Late-stage committed inventory</td>
                    <td style={tdStyle()}>Commitment risk rises because flexibility falls</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={calloutStyle("warning")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Important limitation</div>
              <div>
                This is a teaching-oriented risk score. It is intended to make vulnerability
                visible, not replace a formal resilience or enterprise risk model.
              </div>
            </div>
          </section>

          <section id="push-pull" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>9. Push-Pull Boundaries</h2>

            <p>
              The push-pull boundary is one of the highest-leverage concepts in the simulator. It
              marks the point in the network where the system stops acting on forecasts and starts
              reacting to realized demand.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Mode</th>
                    <th style={thStyle()}>What it means</th>
                    <th style={thStyle()}>Typical benefit</th>
                    <th style={thStyle()}>Typical downside</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Push</td>
                    <td style={tdStyle()}>Commit and position inventory ahead of actual demand</td>
                    <td style={tdStyle()}>Faster downstream response</td>
                    <td style={tdStyle()}>More inventory exposure and forecast dependence</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Pull</td>
                    <td style={tdStyle()}>Wait for better demand information before final commitment</td>
                    <td style={tdStyle()}>Less committed inventory, more flexibility</td>
                    <td style={tdStyle()}>Longer customer-facing response time</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Moving the boundary downstream tends to improve speed while increasing inventory
              commitment. Moving it upstream tends to reduce inventory while increasing response time
              sensitivity.
            </p>

            <p>
              This boundary follows the structure of the graph. That matters in branching networks,
              because the simulator looks at actual depth from suppliers instead of assuming a
              simple type sequence is always correct.
            </p>

            <div style={calloutStyle("success")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Practical meaning</div>
              <div>
                Boundary placement is really a decision about where uncertainty should be absorbed.
              </div>
            </div>
          </section>

          <section id="inventory-forms" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>10. Inventory Forms and Commitment</h2>

            <p>
              Not all inventory is equally risky or equally expensive. The simulator distinguishes
              between different inventory forms because later-stage inventory is usually more
              committed and less flexible.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Inventory form</th>
                    <th style={thStyle()}>General meaning</th>
                    <th style={thStyle()}>Typical behavior</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Generic</td>
                    <td style={tdStyle()}>Flexible upstream inventory</td>
                    <td style={tdStyle()}>Lower holding burden, lower commitment</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Configured</td>
                    <td style={tdStyle()}>Partially committed inventory</td>
                    <td style={tdStyle()}>Moderate flexibility, moderate cost</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Finished</td>
                    <td style={tdStyle()}>Customer-ready inventory</td>
                    <td style={tdStyle()}>Higher cost, faster service, lower flexibility</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Packed</td>
                    <td style={tdStyle()}>Most committed downstream form</td>
                    <td style={tdStyle()}>Highest service readiness, highest commitment exposure</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              This is why downstream inventory can improve customer response while simultaneously
              increasing cost and risk. Fast systems often carry later-stage inventory. Flexible
              systems often delay commitment.
            </p>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>A useful rule</div>
              <div>
                The later the inventory sits relative to the customer, the faster it serves and the
                more expensive a wrong forecast becomes.
              </div>
            </div>
          </section>

          <section id="parameters" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>11. Parameters Explained</h2>

            <p>
              The parameter set is what gives the simulator its behavior. These values shape how
              aggressively cost, time, and risk respond to structural changes.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Parameter</th>
                    <th style={thStyle()}>Meaning</th>
                    <th style={thStyle()}>Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}><span style={inlineCodeStyle()}>μ</span></td>
                    <td style={tdStyle()}>Average demand per time period</td>
                    <td style={tdStyle()}>Higher mean flow increases throughput and pipeline stock</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}><span style={inlineCodeStyle()}>σ</span></td>
                    <td style={tdStyle()}>Demand variability</td>
                    <td style={tdStyle()}>Higher uncertainty increases safety stock and risk</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}><span style={inlineCodeStyle()}>L</span></td>
                    <td style={tdStyle()}>Average replenishment lead time</td>
                    <td style={tdStyle()}>Longer delay increases inventory and response time</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}><span style={inlineCodeStyle()}>s</span></td>
                    <td style={tdStyle()}>Lead-time variability</td>
                    <td style={tdStyle()}>Higher time uncertainty increases safety stock</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}><span style={inlineCodeStyle()}>R</span></td>
                    <td style={tdStyle()}>Review or reorder lag</td>
                    <td style={tdStyle()}>Longer review windows increase exposure</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Unit value</td>
                    <td style={tdStyle()}>Value per unit of inventory</td>
                    <td style={tdStyle()}>Converts stock into economic burden</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Carrying rate</td>
                    <td style={tdStyle()}>Annual holding burden</td>
                    <td style={tdStyle()}>Converts inventory value into cost</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Node cost</td>
                    <td style={tdStyle()}>Per-unit throughput burden at a node</td>
                    <td style={tdStyle()}>Makes extra structure economically meaningful</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Location multipliers</td>
                    <td style={tdStyle()}>Cost, time, and risk modifiers by region</td>
                    <td style={tdStyle()}>Allows domestic, nearshore, and offshore tradeoffs</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Mode multipliers</td>
                    <td style={tdStyle()}>Push/pull behavioral effects</td>
                    <td style={tdStyle()}>Changes where inventory and exposure sit</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={calloutStyle()}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Parameter philosophy</div>
              <div>
                The goal is not to make every number “perfect.” The goal is to create believable
                relative behavior so that structural lessons are clear.
              </div>
            </div>
          </section>

          <section id="tradeoffs" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>12. Reading Tradeoffs Correctly</h2>

            <p>
              Strong supply chain analysis is not about finding a single “best” answer. It is about
              understanding what you are buying and what you are giving up.
            </p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>If this improves…</th>
                    <th style={thStyle()}>…something else often worsens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Customer response time</td>
                    <td style={tdStyle()}>Inventory cost or commitment often rises</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Resilience</td>
                    <td style={tdStyle()}>Redundancy and operating burden often rise</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Simplicity</td>
                    <td style={tdStyle()}>The network may become more fragile</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Low inventory</td>
                    <td style={tdStyle()}>The chain may become slower or less tolerant of shocks</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              That is why this simulator presents multiple metrics together. A design that improves
              cost while degrading risk may still be reasonable. A design that improves resilience
              while increasing cost may also be reasonable. The correct question is:
            </p>

            <FormulaBlock note="This is the real decision lens.">
              Which tradeoff best matches the priority of the system?
            </FormulaBlock>

            <div style={calloutStyle("tip")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Do not chase one metric</div>
              <div>
                Low cost alone is not a good design target if the network becomes fragile, slow, or
                structurally unmanageable.
              </div>
            </div>
          </section>

          <section id="experiments" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>13. Suggested Experiments</h2>

            <p>
              The simulator teaches best when you change one idea at a time and observe how the
              outputs move.
            </p>

            <BulletList
              items={[
                "Add a parallel supplier and compare the change in risk and cost",
                "Move the push-pull boundary downstream and observe how inventory and response change",
                "Switch sourcing posture from domestic to offshore and compare speed versus cost",
                "Add a new stage and ask whether the extra structure solves a real problem",
                "Draw a disruption card and redesign the network around the new shock",
                "Split customers into multiple branches and watch how demand aggregation changes",
              ]}
            />

            <div style={calloutStyle("success")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Experiment design rule</div>
              <div>
                Change one thing, save a baseline, and compare. Otherwise, you will not know what
                actually caused the output to move.
              </div>
            </div>
          </section>

          <section id="worked-example" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>14. Worked Example</h2>

            <p>
              Consider a simple chain with one supplier, one factory, one DC, and one customer
              market. Suppose average demand is stable and lead times are moderate.
            </p>

            <p>
              Now imagine three changes:
            </p>

            <BulletList
              items={[
                "You add a parallel supplier",
                "You move the push-pull boundary downstream",
                "You increase the target service level",
              ]}
            />

            <p>What should happen conceptually?</p>

            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={thStyle()}>Decision</th>
                    <th style={thStyle()}>Expected effect</th>
                    <th style={thStyle()}>Why</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle()}>Add parallel supplier</td>
                    <td style={tdStyle()}>Risk falls, cost may rise slightly</td>
                    <td style={tdStyle()}>Diversification improves resilience but adds coordination burden</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Move boundary downstream</td>
                    <td style={tdStyle()}>Response improves, inventory burden rises</td>
                    <td style={tdStyle()}>More stock is committed closer to demand</td>
                  </tr>
                  <tr>
                    <td style={tdStyle()}>Raise service level</td>
                    <td style={tdStyle()}>Safety stock rises</td>
                    <td style={tdStyle()}>Higher target availability requires larger buffers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              This kind of reasoning is exactly what the simulator is designed to teach. The value
              is not just the output. The value is understanding why the output moved.
            </p>
          </section>

          <section id="teaching-notes" style={sectionStyle()}>
            <h2 style={{ marginTop: 0 }}>15. Teaching Notes and Caveats</h2>

            <p>
              This simulator is intentionally simplified so that structural relationships are easy to
              see. Real supply chains are more complicated than this model.
            </p>

            <BulletList
              items={[
                "Capacity constraints are not explicitly modeled",
                "Pricing and contract behavior are not modeled",
                "Transportation mode selection is simplified",
                "Quality yield losses and rework are simplified",
                "The risk score is educational, not actuarial",
                "The cost structure is calibrated for learning, not exact accounting",
              ]}
            />

            <p>
              These limitations are not flaws in the context of the course. They are part of the
              teaching design. The model strips away enough detail that the student can see the
              structural logic clearly.
            </p>

            <div style={calloutStyle("warning")}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Responsible interpretation</div>
              <div>
                Use this simulator to understand system behavior, reveal weak structures, and ask
                better operations questions. Do not use it as a substitute for detailed execution,
                engineering, or financial modeling.
              </div>
            </div>
          </section>
        </div>
      </div>
    </ModalShell>
  );
}
