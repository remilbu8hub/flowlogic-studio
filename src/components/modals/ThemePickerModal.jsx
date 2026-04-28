import ModalShell from "../../ui/ModalShell";
import { THEME, getThemePaletteEntries } from "../../config/theme";

function paletteButtonStyle(isActive) {
  return {
    border: `2px solid ${isActive ? THEME.colors.primary : THEME.colors.border}`,
    borderRadius: THEME.radius.lg,
    padding: 14,
    background: THEME.colors.surface,
    color: THEME.colors.textPrimary,
    cursor: "pointer",
    display: "grid",
    gap: 10,
    textAlign: "left",
    boxShadow: isActive ? THEME.shadow.focus : "none",
  };
}

function swatchStyle(color) {
  return {
    width: 24,
    height: 24,
    borderRadius: 8,
    background: color,
    border: `1px solid ${THEME.colors.border}`,
    flexShrink: 0,
  };
}

export default function ThemePickerModal({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
}) {
  const palettes = getThemePaletteEntries();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Theme"
      subtitle="Switch palettes to compare the app's visual direction. Changes apply immediately."
      size="md"
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {palettes.map((palette) => {
            const isActive = palette.id === activeThemeId;
            const paletteCardSurface = palette.colors.surface;
            const paletteCardBorder = palette.colors.border;
            const paletteCardText = palette.colors.textPrimary;
            const paletteCardMuted = palette.colors.textMuted;

            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => onSelectTheme(palette.id)}
                style={{
                  ...paletteButtonStyle(isActive),
                  background: paletteCardSurface,
                  borderColor: isActive ? THEME.colors.primary : paletteCardBorder,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, color: paletteCardText }}>
                    {palette.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                      color: isActive ? THEME.colors.primary : paletteCardMuted,
                    }}
                  >
                    {isActive ? "Active theme" : "Apply"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <div title="Background" style={swatchStyle(palette.colors.background)} />
                  <div title="Surface" style={swatchStyle(palette.colors.surface)} />
                  <div title="Primary" style={swatchStyle(palette.colors.primary)} />
                  <div title="Success" style={swatchStyle(palette.colors.success)} />
                  <div title="Warning" style={swatchStyle(palette.colors.warning)} />
                  <div title="Danger" style={swatchStyle(palette.colors.danger)} />
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 10,
                    borderRadius: THEME.radius.md,
                    background: palette.colors.background,
                    border: `1px solid ${palette.colors.border}`,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: paletteCardText }}>
                    Surface preview
                  </div>
                  <div style={{ fontSize: 13, color: paletteCardMuted, lineHeight: 1.5 }}>
                    Background, panel, action, semantic status, and lane colors update across the
                    main app surfaces.
                  </div>
                </div>

                <div style={{ fontSize: 12, color: paletteCardMuted, lineHeight: 1.5 }}>
                  Status colors stay semantic across themes so danger actions remain red and low
                  risk stays positive.
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}
