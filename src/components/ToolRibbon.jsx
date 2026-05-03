import WorkspaceSelector from "./WorkspaceSelector";
import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { buttonStyle, cardStyle } from "../ui/formatters";
import { BookOpen, Eye, Link2, Medal, MousePointer2, Palette, Save, Settings2, Trash2, RotateCcw } from "lucide-react";

const TOOL_OPTIONS = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "connectNodes", label: "Connect", Icon: Link2 },
  { id: "delete", label: "Delete", Icon: Trash2 },
  { id: "editNode", label: "Inspect", Icon: Eye },
];

export default function ToolRibbon({
  currentWorkspace,
  workspaces,
  onChangeWorkspace,
  activeTool = "select",
  onChangeActiveTool,
  showParameters = true,
  onOpenSaveScenario,
  onOpenParameters,
  onOpenLearning,
  onOpenLeaderboard,
  onOpenThemePicker,
  onResetScenario,
}) {
  function toolButtonStyle(isActive) {
    return {
      ...buttonStyle(isActive ? "primary" : "default"),
      display: "inline-flex",
      alignItems: "center",
      gap: scaleNum(6),
      minHeight: scaleNum(34),
      padding: `${scaleNum(6)}px ${scaleNum(10)}px`,
      fontSize: scaleNum(12),
      whiteSpace: "nowrap",
    };
  }

  function iconButtonStyle(variant = "default") {
    return {
      ...buttonStyle(variant),
      display: "inline-flex",
      alignItems: "center",
      gap: scaleNum(6),
      minHeight: scaleNum(34),
      padding: `${scaleNum(6)}px ${scaleNum(10)}px`,
      fontSize: scaleNum(12),
      whiteSpace: "nowrap",
    };
  }

  function groupStyle() {
    return {
      display: "flex",
      alignItems: "center",
      gap: scaleNum(6),
      flexWrap: "wrap",
      minWidth: 0,
    };
  }

  function groupLabelStyle() {
    return {
      fontSize: scaleNum(11),
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: THEME.colors.textMuted,
      marginRight: scaleNum(2),
      whiteSpace: "nowrap",
    };
  }

  return (
    <div
      style={{
        ...cardStyle(),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: scaleNum(12),
        flexWrap: "wrap",
        padding: scaleNum(10),
        marginBottom: scaleNum(12),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: scaleNum(12),
          flexWrap: "wrap",
          minWidth: 0,
          flex: "1 1 720px",
        }}
      >
        <div style={groupStyle()}>
          <span style={groupLabelStyle()}>Workspace</span>
          <WorkspaceSelector
            currentWorkspace={currentWorkspace}
            workspaces={workspaces}
            onChange={onChangeWorkspace}
            showLabel={false}
          />
        </div>

        <div style={groupStyle()}>
          <span style={groupLabelStyle()}>Canvas Tools</span>
          {TOOL_OPTIONS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onChangeActiveTool?.(tool.id)}
              style={toolButtonStyle(activeTool === tool.id)}
              aria-pressed={activeTool === tool.id}
            >
              <tool.Icon size={16} strokeWidth={2} aria-hidden="true" />
              {tool.label}
            </button>
          ))}
        </div>

        <div style={groupStyle()}>
          <span style={groupLabelStyle()}>Scenario</span>
          <button type="button" onClick={onOpenSaveScenario} style={iconButtonStyle("primary")}>
            <Save size={16} strokeWidth={2} aria-hidden="true" />
            Save Scenario
          </button>
          <button type="button" onClick={onResetScenario} style={iconButtonStyle("danger")}>
            <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
            Reset Scenario
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: scaleNum(6),
          flexWrap: "wrap",
          minWidth: 0,
          flex: "0 1 auto",
        }}
      >
        <span style={groupLabelStyle()}>Utilities</span>
        {showParameters ? (
          <button type="button" onClick={onOpenParameters} style={iconButtonStyle()}>
            <Settings2 size={16} strokeWidth={2} aria-hidden="true" />
            Parameters
          </button>
        ) : null}

        <button type="button" onClick={onOpenLearning} style={iconButtonStyle()}>
          <BookOpen size={16} strokeWidth={2} aria-hidden="true" />
          Learning
        </button>

        <button type="button" onClick={onOpenLeaderboard} style={iconButtonStyle()}>
          <Medal size={16} strokeWidth={2} aria-hidden="true" />
          Leaderboard
        </button>

        <button type="button" onClick={onOpenThemePicker} style={iconButtonStyle()}>
          <Palette size={16} strokeWidth={2} aria-hidden="true" />
          Theme
        </button>
      </div>
    </div>
  );
}
