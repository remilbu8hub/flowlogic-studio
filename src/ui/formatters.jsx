// src/components/formatters.jsx

import { THEME } from "../config/theme";
import { scaleMin, scaleNum } from "../theme/uiScale";

export function money(x) {
  return Number(x || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function num(x, digits = 2) {
  return Number(x || 0).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

export function riskColor(label) {
  const s = String(label || "").toLowerCase();
  if (s === "low") return THEME.colors.success;
  if (s === "medium") return THEME.colors.warning;
  if (s === "high") return THEME.colors.danger;
  return THEME.colors.textPrimary;
}

export function cardStyle() {
  return {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: scaleNum(THEME.radius.lg),
    padding: scaleNum(14),
    background: THEME.colors.surface,
    boxShadow: THEME.shadow.card,
  };
}

export function buttonStyle(variant = "default") {
  const base = {
    borderRadius: scaleNum(THEME.radius.md),
    padding: `${scaleMin(8, 6)}px ${scaleMin(12, 10)}px`,
    fontSize: scaleMin(13, 12),
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${THEME.colors.border}`,
    background: THEME.colors.surface,
    color: THEME.colors.textPrimary,
  };

  if (variant === "primary") {
    return {
      ...base,
      background: THEME.colors.primary,
      color: THEME.colors.surface,
      border: `1px solid ${THEME.colors.primary}`,
    };
  }

  if (variant === "danger") {
    return {
      ...base,
      background: THEME.colors.danger,
      color: THEME.colors.surface,
      border: `1px solid ${THEME.colors.danger}`,
    };
  }

  return base;
}

export function inputStyle() {
  return {
    width: "100%",
    minHeight: scaleMin(38, 36),
    padding: `${scaleNum(7)}px ${scaleNum(9)}px`,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: scaleNum(THEME.radius.sm),
    boxSizing: "border-box",
    background: THEME.colors.surfaceRow ?? THEME.colors.surface,
    color: THEME.colors.textPrimary,
  };
}
