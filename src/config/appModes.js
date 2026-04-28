export const APP_MODES = {
  educator: {
    id: "educator",
    label: "Educator Mode",
    shortLabel: "Educator",
    description:
      "Teaching-first view with coaching available and less parameter exposure.",
    showCoaching: true,
    showAdvancedControls: false,
    showTransportModes: false,
    showDetailedCost: false,
    defaults: {
      coachingEnabled: true,
    },
    labels: {
      headerSubtitle:
        "An interactive supply chain design sandbox for exploring flow, cost, risk, and response time.",
      welcomeAction: "Enter in Educator Mode",
    },
  },
  business: {
    id: "business",
    label: "Business Mode",
    shortLabel: "Business",
    description:
      "Decision-focused view with advanced controls and detailed cost visibility.",
    showCoaching: false,
    showAdvancedControls: true,
    showTransportModes: true,
    showDetailedCost: true,
    defaults: {
      coachingEnabled: false,
    },
    labels: {
      headerSubtitle:
        "A decision-focused supply chain design sandbox for comparing flow, cost, risk, and response time.",
      welcomeAction: "Enter in Business Mode",
    },
  },
};

export const DEFAULT_APP_MODE = "educator";

export function getAppModeConfig(mode) {
  return APP_MODES[mode] ?? APP_MODES[DEFAULT_APP_MODE];
}

export function getAppModeEntries() {
  return Object.values(APP_MODES);
}
