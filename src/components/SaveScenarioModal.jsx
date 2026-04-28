import ModalShell from "./ModalShell";
import { buttonStyle, inputStyle } from "./formatters";
import { THEME } from "../config/theme";

export default function SaveScenarioModal({
  isOpen,
  saveName,
  saveNotes,
  canSave,
  onSaveNameChange,
  onSaveNotesChange,
  onClose,
  onSave,
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Save Scenario"
      subtitle="Capture this scenario and its current results in the leaderboard."
      size="sm"
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label
            htmlFor="save-scenario-name"
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Scenario name
          </label>
          <input
            id="save-scenario-name"
            type="text"
            placeholder="Scenario name"
            value={saveName}
            onChange={(event) => onSaveNameChange(event.target.value)}
            style={inputStyle()}
          />
        </div>

        <div>
          <label
            htmlFor="save-scenario-notes"
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Notes
          </label>
          <textarea
            id="save-scenario-notes"
            placeholder="Optional notes"
            value={saveNotes}
            onChange={(event) => onSaveNotesChange(event.target.value)}
            rows={4}
            style={{
              ...inputStyle(),
              resize: "vertical",
              minHeight: 104,
              fontFamily: "inherit",
            }}
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
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            style={{
              ...buttonStyle("primary"),
              opacity: canSave ? 1 : 0.5,
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Save Scenario
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
