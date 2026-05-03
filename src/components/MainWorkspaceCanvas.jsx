import { scaleNum } from "../theme/uiScale";

export default function MainWorkspaceCanvas({
  children,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: scaleNum(4),
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}
