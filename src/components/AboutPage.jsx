import { THEME } from "../config/theme";
import { cardStyle } from "./formatters";

function sectionStyle() {
  return {
    ...cardStyle(),
    display: "grid",
    gap: 10,
    minWidth: 0,
  };
}

function bulletListStyle() {
  return {
    margin: 0,
    paddingLeft: 20,
    color: THEME.colors.textMuted,
    lineHeight: 1.7,
  };
}

export default function AboutPage() {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        maxWidth: 1040,
        minWidth: 0,
      }}
    >
      <div style={sectionStyle()}>
        <h2 style={{ margin: 0, color: THEME.colors.textPrimary }}>What FlowLogic Studio Does</h2>
        <p style={{ margin: 0, color: THEME.colors.textMuted, lineHeight: 1.7 }}>
          FlowLogic Studio is an interactive supply chain structure simulator built to make
          network design choices visible, fast to test, and easy to explain. It gives users a
          sandbox for exploring how structure changes cost, response time, inventory exposure,
          and risk.
        </p>
        <p style={{ margin: 0, color: THEME.colors.textMuted, lineHeight: 1.7 }}>
          The simulator is intentionally lightweight. It is designed for rapid iteration and
          practical understanding, not heavy configuration or hidden optimization.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 16,
        }}
      >
        <div style={sectionStyle()}>
          <h3 style={{ margin: 0, color: THEME.colors.textPrimary }}>Who It Is For</h3>
          <ul style={bulletListStyle()}>
            <li>Educators and students learning how structural choices shape supply chain behavior.</li>
            <li>Business users comparing tradeoffs before moving into deeper planning workflows.</li>
            <li>Teams that need a fast, explainable conversation tool instead of a black-box model.</li>
          </ul>
        </div>

        <div style={sectionStyle()}>
          <h3 style={{ margin: 0, color: THEME.colors.textPrimary }}>What It Models</h3>
          <ul style={bulletListStyle()}>
            <li>Push-pull boundary behavior across the actual supply chain graph.</li>
            <li>Transport tradeoffs across truck, air, and ship lanes.</li>
            <li>Inventory posture and where stock is held or delayed.</li>
            <li>Cost accumulation, variability, disruption exposure, and response speed.</li>
          </ul>
        </div>
      </div>

      <div style={sectionStyle()}>
        <h3 style={{ margin: 0, color: THEME.colors.textPrimary }}>What It Is Not</h3>
        <ul style={bulletListStyle()}>
          <li>It is not an ERP system or execution platform.</li>
          <li>It is not a production planning system.</li>
          <li>It is not a formal optimizer looking for one mathematically best answer.</li>
          <li>It is not a full financial model or digital twin of every real-world detail.</li>
        </ul>
      </div>

      <div style={sectionStyle()}>
        <h3 style={{ margin: 0, color: THEME.colors.textPrimary }}>How To Use It</h3>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            color: THEME.colors.textMuted,
            lineHeight: 1.7,
          }}
        >
          <li>Start with a simple scenario or build a small baseline network.</li>
          <li>Save the baseline, then change one structural choice at a time.</li>
          <li>Compare graph behavior, cost buildup, inventory burden, and risk together.</li>
          <li>Use educator mode for guided learning or business mode for denser controls.</li>
        </ol>
      </div>
    </div>
  );
}
