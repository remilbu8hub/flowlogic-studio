// src/components/formatters.jsx

import { THEME } from "../config/theme";

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
    borderRadius: THEME.radius.lg,
    padding: 16,
    background: THEME.colors.surface,
    boxShadow: THEME.shadow.card,
  };
}

export function buttonStyle(variant = "default") {
  const base = {
    borderRadius: THEME.radius.md,
    padding: "10px 14px",
    fontSize: 14,
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
    minHeight: 40,
    padding: "8px 10px",
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radius.sm,
    boxSizing: "border-box",
    background: THEME.colors.surface,
    color: THEME.colors.textPrimary,
  };
}
