import { scaleClamp, scaleNum } from "../theme/uiScale";

export default function WorkspaceShell({
  toolRibbon,
  leftSidebar,
  mainCanvas,
  rightSidebar,
  lowerPanels,
  isSmallLayout = false,
  leftPanelWidth = "clamp(240px, 16vw, 300px)",
  rightPanelWidth = "clamp(240px, 16vw, 320px)",
}) {
  return (
    <div style={{ display: "grid", gap: scaleNum(16), minWidth: 0 }}>
      {toolRibbon}

      <div
        style={{
          display: "flex",
          gap: scaleClamp(12, 2, 24),
          alignItems: "start",
          minWidth: 0,
          flexWrap: isSmallLayout ? "wrap" : "nowrap",
        }}
      >
        {leftSidebar ? (
          <div
            style={{
              flex: isSmallLayout ? "1 1 100%" : `0 0 ${leftPanelWidth}`,
              width: leftPanelWidth,
              minWidth: 240,
              maxWidth: isSmallLayout ? "100%" : leftPanelWidth,
            }}
          >
            {leftSidebar}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: scaleNum(16), minWidth: 0, flex: "1 1 auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: isSmallLayout ? "column" : "row",
              gap: scaleClamp(12, 2, 24),
              alignItems: "start",
              minWidth: 0,
            }}
          >
            <div
              style={{
                minWidth: 0,
                display: "grid",
                gap: scaleNum(10),
                flex: "1 1 auto",
              }}
            >
              {mainCanvas}
            </div>

            <div
              style={{
                flex: isSmallLayout ? "1 1 auto" : `0 0 ${rightPanelWidth}`,
                width: rightPanelWidth,
                minWidth: 240,
                maxWidth: isSmallLayout ? "100%" : rightPanelWidth,
              }}
            >
              {rightSidebar}
            </div>
          </div>

          {lowerPanels}
        </div>
      </div>
    </div>
  );
}
