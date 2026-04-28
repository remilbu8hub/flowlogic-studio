// src/components/ParametersModal.jsx

import ModalShell from "../../ui/ModalShell";

function safeNum(x, fallback = 0) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function sectionStyle() {
  return {
    border: "1px solid #d0d7de",
    borderRadius: 12,
    padding: 16,
    background: "#ffffff",
  };
}

function inputStyle() {
  return {
    width: "100%",
    minHeight: 40,
    padding: "8px 10px",
    border: "1px solid #c7d0d9",
    borderRadius: 8,
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#1f2328",
  };
}

function smallNoteStyle() {
  return {
    fontSize: 12,
    color: "#57606a",
    marginTop: 6,
    lineHeight: 1.4,
  };
}

function labelStyle() {
  return {
    display: "block",
    fontWeight: 600,
    marginBottom: 6,
  };
}

function tableStyle() {
  return {
    width: "100%",
    borderCollapse: "collapse",
    background: "#ffffff",
  };
}

function thStyle() {
  return {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #d8dee4",
    background: "#f6f8fa",
    fontSize: 13,
    color: "#57606a",
  };
}

function tdStyle() {
  return {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f6",
    verticalAlign: "top",
  };
}

function calloutStyle() {
  return {
    border: "1px solid #bfd8ff",
    background: "#eef6ff",
    borderRadius: 12,
    padding: 14,
    color: "#0b3d91",
    lineHeight: 1.45,
  };
}

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  const next = structuredClone(obj ?? {});
  let cursor = next;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (typeof cursor[key] !== "object" || cursor[key] === null) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
  return next;
}

function NumberField({ label, value, onChange, step = "0.01", min, max, note }) {
  return (
    <div>
      <label style={labelStyle()}>{label}</label>
      <input
        type="number"
        value={safeNum(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        style={inputStyle()}
      />
      {note ? <div style={smallNoteStyle()}>{note}</div> : null}
    </div>
  );
}

function ParameterTable({ rows, onChange }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle()}>
        <thead>
          <tr>
            <th style={thStyle()}>Item</th>
            <th style={thStyle()}>Field</th>
            <th style={thStyle()}>Value</th>
            <th style={thStyle()}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.key}.${row.field}`}>
              <td style={tdStyle()}>{row.label}</td>
              <td style={tdStyle()}>{row.field}</td>
              <td style={tdStyle()}>
                <input
                  type="number"
                  value={safeNum(row.value)}
                  onChange={(e) => onChange(row.path, Number(e.target.value))}
                  step={row.step ?? "0.01"}
                  style={{ ...inputStyle(), minWidth: 120 }}
                />
              </td>
              <td style={tdStyle()}>{row.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ParametersModal({
  isOpen,
  onClose,
  parameters,
  updateParameters,
  resetParameters,
}) {
  const nodeCosts = parameters?.nodeCosts ?? {};
  const locationFactors = parameters?.locationFactors ?? {};
  const sourcingPostureFactors = parameters?.sourcingPostureFactors ?? {};
  const modeFactors = parameters?.modeFactors ?? {};
  const stockFormFactors = parameters?.stockFormFactors ?? {};
  const risk = parameters?.risk ?? {};

  function setParam(path, value) {
    updateParameters((prev) => setNestedValue(prev, path, value));
  }

  const nodeCostRows = [
    {
      key: "supplier",
      label: "Supplier",
      field: "costPerUnit",
      value: nodeCosts?.supplier?.costPerUnit,
      path: "nodeCosts.supplier.costPerUnit",
      meaning: "Base operating cost added per unit flowing through a supplier node.",
    },
    {
      key: "supplier",
      label: "Supplier",
      field: "baseRisk",
      value: nodeCosts?.supplier?.baseRisk,
      path: "nodeCosts.supplier.baseRisk",
      meaning: "Starting risk before location, posture, and structure effects are layered in.",
    },
    {
      key: "supplier",
      label: "Supplier",
      field: "stageTime",
      value: nodeCosts?.supplier?.stageTime,
      path: "nodeCosts.supplier.stageTime",
      meaning: "Default processing or wait time at this node type.",
    },

    {
      key: "factory",
      label: "Factory",
      field: "costPerUnit",
      value: nodeCosts?.factory?.costPerUnit,
      path: "nodeCosts.factory.costPerUnit",
      meaning: "Base operating cost added per unit flowing through a factory.",
    },
    {
      key: "factory",
      label: "Factory",
      field: "baseRisk",
      value: nodeCosts?.factory?.baseRisk,
      path: "nodeCosts.factory.baseRisk",
      meaning: "Starting risk before location, posture, and structure effects are layered in.",
    },
    {
      key: "factory",
      label: "Factory",
      field: "stageTime",
      value: nodeCosts?.factory?.stageTime,
      path: "nodeCosts.factory.stageTime",
      meaning: "Default processing or wait time at this node type.",
    },

    {
      key: "dc",
      label: "DC",
      field: "costPerUnit",
      value: nodeCosts?.dc?.costPerUnit,
      path: "nodeCosts.dc.costPerUnit",
      meaning: "Base operating cost added per unit flowing through a DC.",
    },
    {
      key: "dc",
      label: "DC",
      field: "baseRisk",
      value: nodeCosts?.dc?.baseRisk,
      path: "nodeCosts.dc.baseRisk",
      meaning: "Starting risk before location, posture, and structure effects are layered in.",
    },
    {
      key: "dc",
      label: "DC",
      field: "stageTime",
      value: nodeCosts?.dc?.stageTime,
      path: "nodeCosts.dc.stageTime",
      meaning: "Default processing or wait time at this node type.",
    },

    {
      key: "retail",
      label: "Retail",
      field: "costPerUnit",
      value: nodeCosts?.retail?.costPerUnit,
      path: "nodeCosts.retail.costPerUnit",
      meaning: "Base operating cost added per unit through the final fulfillment or retail stage.",
    },
    {
      key: "retail",
      label: "Retail",
      field: "baseRisk",
      value: nodeCosts?.retail?.baseRisk,
      path: "nodeCosts.retail.baseRisk",
      meaning: "Starting risk before location, posture, and structure effects are layered in.",
    },
    {
      key: "retail",
      label: "Retail",
      field: "stageTime",
      value: nodeCosts?.retail?.stageTime,
      path: "nodeCosts.retail.stageTime",
      meaning: "Default processing or wait time at this node type.",
    },

    {
      key: "customer",
      label: "Customer",
      field: "costPerUnit",
      value: nodeCosts?.customer?.costPerUnit,
      path: "nodeCosts.customer.costPerUnit",
      meaning: "Usually zero. Customer is treated as a demand sink, not a stocking stage.",
    },
    {
      key: "customer",
      label: "Customer",
      field: "baseRisk",
      value: nodeCosts?.customer?.baseRisk,
      path: "nodeCosts.customer.baseRisk",
      meaning: "Starting demand-side risk contribution before structural effects.",
    },
    {
      key: "customer",
      label: "Customer",
      field: "stageTime",
      value: nodeCosts?.customer?.stageTime,
      path: "nodeCosts.customer.stageTime",
      meaning: "Usually near zero.",
    },
  ];

  const locationRows = [
    {
      key: "north_america",
      label: "North America",
      field: "costMultiplier",
      value: locationFactors?.north_america?.costMultiplier,
      path: "locationFactors.north_america.costMultiplier",
      meaning: "Scales operating cost for nodes located in North America.",
    },
    {
      key: "north_america",
      label: "North America",
      field: "riskMultiplier",
      value: locationFactors?.north_america?.riskMultiplier,
      path: "locationFactors.north_america.riskMultiplier",
      meaning: "Scales inherent risk for nodes in North America.",
    },
    {
      key: "north_america",
      label: "North America",
      field: "leadTimeMultiplier",
      value: locationFactors?.north_america?.leadTimeMultiplier,
      path: "locationFactors.north_america.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nodes in North America.",
    },

    {
      key: "latin_america",
      label: "Latin America",
      field: "costMultiplier",
      value: locationFactors?.latin_america?.costMultiplier,
      path: "locationFactors.latin_america.costMultiplier",
      meaning: "Scales operating cost for nodes located in Latin America.",
    },
    {
      key: "latin_america",
      label: "Latin America",
      field: "riskMultiplier",
      value: locationFactors?.latin_america?.riskMultiplier,
      path: "locationFactors.latin_america.riskMultiplier",
      meaning: "Scales inherent risk for nodes in Latin America.",
    },
    {
      key: "latin_america",
      label: "Latin America",
      field: "leadTimeMultiplier",
      value: locationFactors?.latin_america?.leadTimeMultiplier,
      path: "locationFactors.latin_america.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nodes in Latin America.",
    },

    {
      key: "europe",
      label: "Europe",
      field: "costMultiplier",
      value: locationFactors?.europe?.costMultiplier,
      path: "locationFactors.europe.costMultiplier",
      meaning: "Scales operating cost for nodes located in Europe.",
    },
    {
      key: "europe",
      label: "Europe",
      field: "riskMultiplier",
      value: locationFactors?.europe?.riskMultiplier,
      path: "locationFactors.europe.riskMultiplier",
      meaning: "Scales inherent risk for nodes in Europe.",
    },
    {
      key: "europe",
      label: "Europe",
      field: "leadTimeMultiplier",
      value: locationFactors?.europe?.leadTimeMultiplier,
      path: "locationFactors.europe.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nodes in Europe.",
    },

    {
      key: "east_asia",
      label: "East Asia",
      field: "costMultiplier",
      value: locationFactors?.east_asia?.costMultiplier,
      path: "locationFactors.east_asia.costMultiplier",
      meaning: "Scales operating cost for nodes located in East Asia.",
    },
    {
      key: "east_asia",
      label: "East Asia",
      field: "riskMultiplier",
      value: locationFactors?.east_asia?.riskMultiplier,
      path: "locationFactors.east_asia.riskMultiplier",
      meaning: "Scales inherent risk for nodes in East Asia.",
    },
    {
      key: "east_asia",
      label: "East Asia",
      field: "leadTimeMultiplier",
      value: locationFactors?.east_asia?.leadTimeMultiplier,
      path: "locationFactors.east_asia.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nodes in East Asia.",
    },

    {
      key: "south_asia",
      label: "South Asia",
      field: "costMultiplier",
      value: locationFactors?.south_asia?.costMultiplier,
      path: "locationFactors.south_asia.costMultiplier",
      meaning: "Scales operating cost for nodes located in South Asia.",
    },
    {
      key: "south_asia",
      label: "South Asia",
      field: "riskMultiplier",
      value: locationFactors?.south_asia?.riskMultiplier,
      path: "locationFactors.south_asia.riskMultiplier",
      meaning: "Scales inherent risk for nodes in South Asia.",
    },
    {
      key: "south_asia",
      label: "South Asia",
      field: "leadTimeMultiplier",
      value: locationFactors?.south_asia?.leadTimeMultiplier,
      path: "locationFactors.south_asia.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nodes in South Asia.",
    },

    {
      key: "southeast_asia",
      label: "Southeast Asia",
      field: "costMultiplier",
      value: locationFactors?.southeast_asia?.costMultiplier,
      path: "locationFactors.southeast_asia.costMultiplier",
      meaning: "Scales operating cost for nodes located in Southeast Asia.",
    },
    {
      key: "southeast_asia",
      label: "Southeast Asia",
      field: "riskMultiplier",
      value: locationFactors?.southeast_asia?.riskMultiplier,
      path: "locationFactors.southeast_asia.riskMultiplier",
      meaning: "Scales inherent risk for nodes in Southeast Asia.",
    },
    {
      key: "southeast_asia",
      label: "Southeast Asia",
      field: "leadTimeMultiplier",
      value: locationFactors?.southeast_asia?.leadTimeMultiplier,
      path: "locationFactors.southeast_asia.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nodes in Southeast Asia.",
    },
  ];

  const postureRows = [
    {
      key: "domestic",
      label: "Domestic",
      field: "costMultiplier",
      value: sourcingPostureFactors?.domestic?.costMultiplier,
      path: "sourcingPostureFactors.domestic.costMultiplier",
      meaning: "Domestic sourcing is typically costlier but faster and safer.",
    },
    {
      key: "domestic",
      label: "Domestic",
      field: "riskMultiplier",
      value: sourcingPostureFactors?.domestic?.riskMultiplier,
      path: "sourcingPostureFactors.domestic.riskMultiplier",
      meaning: "Scales risk for domestic sourcing posture.",
    },
    {
      key: "domestic",
      label: "Domestic",
      field: "leadTimeMultiplier",
      value: sourcingPostureFactors?.domestic?.leadTimeMultiplier,
      path: "sourcingPostureFactors.domestic.leadTimeMultiplier",
      meaning: "Scales lane and stage time for domestic sourcing posture.",
    },

    {
      key: "nearshore",
      label: "Nearshore",
      field: "costMultiplier",
      value: sourcingPostureFactors?.nearshore?.costMultiplier,
      path: "sourcingPostureFactors.nearshore.costMultiplier",
      meaning: "Nearshore often lands between domestic and offshore on cost.",
    },
    {
      key: "nearshore",
      label: "Nearshore",
      field: "riskMultiplier",
      value: sourcingPostureFactors?.nearshore?.riskMultiplier,
      path: "sourcingPostureFactors.nearshore.riskMultiplier",
      meaning: "Scales risk for nearshore sourcing posture.",
    },
    {
      key: "nearshore",
      label: "Nearshore",
      field: "leadTimeMultiplier",
      value: sourcingPostureFactors?.nearshore?.leadTimeMultiplier,
      path: "sourcingPostureFactors.nearshore.leadTimeMultiplier",
      meaning: "Scales lane and stage time for nearshore sourcing posture.",
    },

    {
      key: "offshore",
      label: "Offshore",
      field: "costMultiplier",
      value: sourcingPostureFactors?.offshore?.costMultiplier,
      path: "sourcingPostureFactors.offshore.costMultiplier",
      meaning: "Offshore is often cheaper, but the speed and risk tradeoffs are larger.",
    },
    {
      key: "offshore",
      label: "Offshore",
      field: "riskMultiplier",
      value: sourcingPostureFactors?.offshore?.riskMultiplier,
      path: "sourcingPostureFactors.offshore.riskMultiplier",
      meaning: "Scales risk for offshore sourcing posture.",
    },
    {
      key: "offshore",
      label: "Offshore",
      field: "leadTimeMultiplier",
      value: sourcingPostureFactors?.offshore?.leadTimeMultiplier,
      path: "sourcingPostureFactors.offshore.leadTimeMultiplier",
      meaning: "Scales lane and stage time for offshore sourcing posture.",
    },
  ];

  const modeRows = [
    {
      key: "push",
      label: "Push",
      field: "inventoryMultiplier",
      value: modeFactors?.push?.inventoryMultiplier,
      path: "modeFactors.push.inventoryMultiplier",
      meaning: "Scales stocking burden for forecast-driven stages.",
    },
    {
      key: "push",
      label: "Push",
      field: "responseTimeMultiplier",
      value: modeFactors?.push?.responseTimeMultiplier,
      path: "modeFactors.push.responseTimeMultiplier",
      meaning: "Scales modeled response time for push stages.",
    },
    {
      key: "pull",
      label: "Pull",
      field: "inventoryMultiplier",
      value: modeFactors?.pull?.inventoryMultiplier,
      path: "modeFactors.pull.inventoryMultiplier",
      meaning: "Scales stocking burden for order-driven stages.",
    },
    {
      key: "pull",
      label: "Pull",
      field: "responseTimeMultiplier",
      value: modeFactors?.pull?.responseTimeMultiplier,
      path: "modeFactors.pull.responseTimeMultiplier",
      meaning: "Scales modeled response time for pull stages.",
    },
  ];

  const stockRows = [
    {
      key: "generic",
      label: "Generic",
      field: "inventoryMultiplier",
      value: stockFormFactors?.generic?.inventoryMultiplier,
      path: "stockFormFactors.generic.inventoryMultiplier",
      meaning: "Scales burden for generic upstream stock.",
    },
    {
      key: "generic",
      label: "Generic",
      field: "riskMultiplier",
      value: stockFormFactors?.generic?.riskMultiplier,
      path: "stockFormFactors.generic.riskMultiplier",
      meaning: "Scales risk for generic stock.",
    },

    {
      key: "configured",
      label: "Configured",
      field: "inventoryMultiplier",
      value: stockFormFactors?.configured?.inventoryMultiplier,
      path: "stockFormFactors.configured.inventoryMultiplier",
      meaning: "Scales burden for partially committed stock.",
    },
    {
      key: "configured",
      label: "Configured",
      field: "riskMultiplier",
      value: stockFormFactors?.configured?.riskMultiplier,
      path: "stockFormFactors.configured.riskMultiplier",
      meaning: "Scales risk for configured stock.",
    },

    {
      key: "finished",
      label: "Finished",
      field: "inventoryMultiplier",
      value: stockFormFactors?.finished?.inventoryMultiplier,
      path: "stockFormFactors.finished.inventoryMultiplier",
      meaning: "Scales burden for finished stock.",
    },
    {
      key: "finished",
      label: "Finished",
      field: "riskMultiplier",
      value: stockFormFactors?.finished?.riskMultiplier,
      path: "stockFormFactors.finished.riskMultiplier",
      meaning: "Scales risk for finished stock.",
    },

    {
      key: "packed",
      label: "Packed",
      field: "inventoryMultiplier",
      value: stockFormFactors?.packed?.inventoryMultiplier,
      path: "stockFormFactors.packed.inventoryMultiplier",
      meaning: "Scales burden for fully committed packed stock.",
    },
    {
      key: "packed",
      label: "Packed",
      field: "riskMultiplier",
      value: stockFormFactors?.packed?.riskMultiplier,
      path: "stockFormFactors.packed.riskMultiplier",
      meaning: "Scales risk for packed stock.",
    },
  ];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Parameter Library"
      subtitle="These assumptions shape how the simulator interprets cost, risk, inventory form, responsiveness, geography, and sourcing posture."
      size="xl"
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div style={calloutStyle()}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>How to use this window</div>
          <div>
            Treat this as an assumptions library, not a precise accounting model. The biggest value
            comes from tuning directional tradeoffs: offshore vs domestic, generic vs packed,
            push vs pull, and single-source vs diversified networks.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <div style={sectionStyle()}>
            <NumberField
              label="Carrying rate"
              value={parameters?.carryingRate}
              onChange={(value) => setParam("carryingRate", value)}
              step="0.01"
              min="0"
              note="Annualized burden applied to inventory value. Higher values make stock more expensive."
            />
          </div>

          <div style={sectionStyle()}>
            <NumberField
              label="Multi-source risk reduction"
              value={risk?.multiSourceReduction}
              onChange={(value) => setParam("risk.multiSourceReduction", value)}
              step="0.01"
              min="0"
              note="Multiplier applied when a node has more than one inbound source. Lower values mean a stronger diversification benefit."
            />
          </div>

          <div style={sectionStyle()}>
            <NumberField
              label="Risk score cap"
              value={risk?.maxCap}
              onChange={(value) => setParam("risk.maxCap", value)}
              step="0.01"
              min="1"
              note="Upper bound for modeled node risk after structure and multiplier effects."
            />
          </div>
        </div>

        <div style={sectionStyle()}>
          <h3 style={{ marginTop: 0 }}>Node type base assumptions</h3>
          <div style={smallNoteStyle()}>
            These are the starting assumptions for each node class before region, sourcing posture,
            stock form, and network structure are layered in.
          </div>
          <div style={{ marginTop: 12 }}>
            <ParameterTable rows={nodeCostRows} onChange={setParam} />
          </div>
        </div>

        <div style={sectionStyle()}>
          <h3 style={{ marginTop: 0 }}>Macro-region multipliers</h3>
          <div style={smallNoteStyle()}>
            This is geography. Use these values to express structural differences between operating
            in North America, Europe, East Asia, South Asia, and similar regions.
          </div>
          <div style={{ marginTop: 12 }}>
            <ParameterTable rows={locationRows} onChange={setParam} />
          </div>
        </div>

        <div style={sectionStyle()}>
          <h3 style={{ marginTop: 0 }}>Sourcing posture multipliers</h3>
          <div style={smallNoteStyle()}>
            This is strategy. Domestic, nearshore, and offshore sourcing can exist across many
            regions, and they influence speed, cost, and exposure differently.
          </div>
          <div style={{ marginTop: 12 }}>
            <ParameterTable rows={postureRows} onChange={setParam} />
          </div>
        </div>

        <div style={sectionStyle()}>
          <h3 style={{ marginTop: 0 }}>Push vs pull behavior</h3>
          <div style={smallNoteStyle()}>
            These multipliers influence how forecast-driven stages and order-driven stages behave in
            the simulation.
          </div>
          <div style={{ marginTop: 12 }}>
            <ParameterTable rows={modeRows} onChange={setParam} />
          </div>
        </div>

        <div style={sectionStyle()}>
          <h3 style={{ marginTop: 0 }}>Stock-form multipliers</h3>
          <div style={smallNoteStyle()}>
            More committed inventory should usually be more expensive and more exposed. Packed stock
            is typically the most burdensome.
          </div>
          <div style={{ marginTop: 12 }}>
            <ParameterTable rows={stockRows} onChange={setParam} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
          <button
            type="button"
            onClick={resetParameters}
            style={{
              border: "1px solid #cf222e",
              background: "#ffffff",
              color: "#cf222e",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset Parameters
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #0969da",
              background: "#0969da",
              color: "#ffffff",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
