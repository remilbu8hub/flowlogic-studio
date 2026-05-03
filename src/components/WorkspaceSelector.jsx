import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";

export default function WorkspaceSelector({
  currentWorkspace = "design",
  workspaces = [],
  onChange,
  showLabel = true,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: scaleNum(4),
        minWidth: scaleNum(180),
      }}
    >
      {showLabel ? (
        <label
          htmlFor="workspace-selector"
          style={{
            fontSize: scaleNum(11),
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: THEME.colors.textMuted,
          }}
        >
          Workspace
        </label>
      ) : null}
      <select
        id="workspace-selector"
        value={currentWorkspace}
        onChange={(event) => onChange?.(event.target.value)}
        style={{
          minHeight: scaleNum(38),
          padding: `${scaleNum(7)}px ${scaleNum(10)}px`,
          borderRadius: THEME.radius.md,
          border: `1px solid ${THEME.colors.border}`,
          background: THEME.colors.surface,
          color: THEME.colors.textPrimary,
          fontSize: scaleNum(13),
          fontWeight: 600,
        }}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.label}
          </option>
        ))}
      </select>
    </div>
  );
}
