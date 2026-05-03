import { THEME } from "../config/theme";
import { scaleNum } from "../theme/uiScale";
import { cardStyle } from "../ui/formatters";

export default function LeftInspector({ title, subtitle, children }) {
  return (
    <div
      style={{
        ...cardStyle(),
        display: "grid",
        gap: scaleNum(12),
      }}
    >
      <div style={{ display: "grid", gap: scaleNum(4) }}>
        <div
          style={{
            fontSize: scaleNum(18),
            fontWeight: 700,
            color: THEME.colors.textPrimary,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: scaleNum(13),
              color: THEME.colors.textMuted,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
