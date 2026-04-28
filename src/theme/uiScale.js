export const UI_SCALE = 0.92;

export function scaleNum(value) {
  return Number((value * UI_SCALE).toFixed(2));
}

export function scaleMin(value, min) {
  return Math.max(min, scaleNum(value));
}

export function clampScaled(value, min, max) {
  return Math.min(max, Math.max(min, scaleNum(value)));
}

export function scale(value) {
  return `${scaleNum(value)}px`;
}

export function scaleClamp(minPx, viewportValue, maxPx, viewportUnit = "vw") {
  return `clamp(${scale(minPx)}, ${viewportValue * UI_SCALE}${viewportUnit}, ${scale(maxPx)})`;
}

export function applyUiScaleToRoot(root = typeof document !== "undefined" ? document.documentElement : null) {
  if (!root) return;
  root.style.setProperty("--ui-scale", String(UI_SCALE));
}
