import ModalShell from "./ModalShell";
import { buttonStyle, inputStyle } from "./formatters";
import { THEME } from "../config/theme";

export default function RenameWorkspaceModal({
  isOpen,
  workspaceName,
  onWorkspaceNameChange,
  onClose,
  onSave,
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Workspace"
      subtitle="Give this supply chain workspace a clear, memorable name."
      size="sm"
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label
            htmlFor="rename-workspace-name"
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Workspace name
          </label>
          <input
            id="rename-workspace-name"
            type="text"
            placeholder="Supply Chain Workspace"
            value={workspaceName}
            onChange={(event) => onWorkspaceNameChange(event.target.value)}
            style={inputStyle()}
            autoFocus
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button type="button" onClick={onClose} style={buttonStyle()}>
            Cancel
          </button>
          <button type="button" onClick={onSave} style={buttonStyle("primary")}>
            Save
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
