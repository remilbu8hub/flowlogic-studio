// src/components/ModalShell.jsx

import { THEME } from "../config/theme";

function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 1000,
  };
}

function shellStyle(size) {
  const widthMap = {
    sm: 640,
    md: 860,
    lg: 1120,
    xl: 1320,
  };

  return {
    width: "100%",
    maxWidth: widthMap[size] ?? widthMap.lg,
    maxHeight: "90vh",
    background: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    border: `1px solid ${THEME.colors.border}`,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
}

function headerStyle() {
  return {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 20px 14px 20px",
    borderBottom: `1px solid ${THEME.colors.border}`,
    background: THEME.colors.background,
  };
}

function bodyStyle() {
  return {
    padding: 20,
    overflow: "auto",
    minHeight: 0,
  };
}

function closeButtonStyle() {
  return {
    border: `1px solid ${THEME.colors.border}`,
    background: THEME.colors.surface,
    color: THEME.colors.textPrimary,
    borderRadius: THEME.radius.md,
    padding: "8px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
    flexShrink: 0,
  };
}

export default function ModalShell({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  size = "lg",
  closeOnBackdrop = true,
}) {
  if (!isOpen) return null;

  function handleOverlayClick(event) {
    if (!closeOnBackdrop) return;
    if (event.target !== event.currentTarget) return;
    onClose?.();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      onClose?.();
    }
  }

  return (
    <div
      style={overlayStyle()}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
    >
      <div style={shellStyle(size)}>
        <div style={headerStyle()}>
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 28,
                lineHeight: 1.1,
                color: THEME.colors.textPrimary,
              }}
            >
              {title}
            </h2>

            {subtitle ? (
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  color: THEME.colors.textMuted,
                  fontSize: 15,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle()}>
            ✕
          </button>
        </div>

        <div style={bodyStyle()}>{children}</div>
      </div>
    </div>
  );
}
