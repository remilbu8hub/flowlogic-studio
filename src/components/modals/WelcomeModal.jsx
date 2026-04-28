// src/components/WelcomeModal.jsx

function modeButtonStyle(isSelected) {
  return {
    width: "100%",
    textAlign: "left",
    padding: "18px 18px 16px 18px",
    borderRadius: 16,
    border: isSelected ? "2px solid #0b2545" : "1px solid #d6cfc5",
    background: isSelected ? "#eef4fb" : "#ffffff",
    color: "#1f2328",
    cursor: "pointer",
    transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
    boxShadow: isSelected ? "0 10px 26px rgba(11,37,69,0.14)" : "0 2px 8px rgba(0,0,0,0.05)",
  };
}

export default function WelcomeModal({
  isOpen,
  currentMode,
  modeOptions,
  onSelectMode,
  projectTitle = "FlowLogic Studio",
  affiliation = "University of Wyoming",
  purpose = "An interactive supply chain design sandbox for exploring flow, cost, risk, response time, and disruption exposure.",
}) {
  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes welcomeOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes welcomeCardRise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.975);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes welcomeGlowDrift {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.22; }
          50% { transform: translate3d(18px, -12px, 0) scale(1.06); opacity: 0.30; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.22; }
        }

        @keyframes welcomeLineSweep {
          from { transform: scaleX(0.2); opacity: 0.35; }
          to { transform: scaleX(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.48)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: 28,
          animation: "welcomeOverlayFade 260ms ease-out",
        }}
      >
        <div
          style={{
            width: "min(1320px, 97vw)",
            minHeight: "min(820px, 90vh)",
            borderRadius: 24,
            overflow: "hidden",
            background: "#ffffff",
            boxShadow: "0 34px 90px rgba(0,0,0,0.34)",
            display: "grid",
            gridTemplateColumns: "2.3fr 1fr",
            animation: "welcomeCardRise 380ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <div
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #08213f 0%, #103761 52%, #184c82 100%)",
              color: "#ffffff",
              padding: "64px 58px 52px 58px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -80,
                top: -40,
                width: 340,
                height: 340,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(244,185,66,0.22) 0%, rgba(244,185,66,0.06) 45%, rgba(244,185,66,0) 72%)",
                animation: "welcomeGlowDrift 6s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 140,
                bottom: -120,
                width: 420,
                height: 420,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 42%, rgba(255,255,255,0) 70%)",
                animation: "welcomeGlowDrift 8s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  opacity: 0.88,
                  marginBottom: 20,
                }}
              >
                {affiliation.toUpperCase()}
              </div>

              <div
                style={{
                  fontSize: 92,
                  fontWeight: 900,
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  marginBottom: 8,
                  textShadow: "0 3px 14px rgba(0,0,0,0.18)",
                }}
              >
                FLOWLOGIC
              </div>

              <div
                style={{
                  fontSize: 68,
                  fontWeight: 900,
                  color: "#f4b942",
                  lineHeight: 0.98,
                  letterSpacing: "-0.02em",
                  marginBottom: 24,
                  textShadow: "0 3px 14px rgba(0,0,0,0.16)",
                }}
              >
                STUDIO
              </div>

              <div
                style={{
                  width: 180,
                  height: 5,
                  borderRadius: 999,
                  background: "#f4b942",
                  marginBottom: 28,
                  transformOrigin: "left center",
                  animation: "welcomeLineSweep 700ms ease-out 120ms both",
                }}
              />

              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1.6,
                  maxWidth: 760,
                  opacity: 0.95,
                }}
              >
                {purpose}
              </div>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 1,
                marginTop: 42,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#f4b942",
                }}
              >
                DESIGN | EXPLORE | UNDERSTAND | COMPARE
              </div>

              <div
                style={{
                  fontSize: 16,
                  opacity: 0.8,
                }}
              >
                Select a mode to control visibility, guidance, and decision detail.
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f8f5f0",
              padding: "48px 36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderLeft: "5px solid #f4b942",
              gap: 24,
            }}
          >
            <div>
              <div style={labelStyle()}>STARTUP MODE</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#1f2328",
                  marginBottom: 10,
                  lineHeight: 1.15,
                }}
              >
                Select how you want to use the simulator
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "#57606a",
                  lineHeight: 1.5,
                  marginBottom: 18,
                }}
              >
                Both modes use the same simulation engine. The mode only changes the interface,
                what controls are exposed, and how much detail is shown.
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {modeOptions.map((modeOption) => {
                  const isSelected = modeOption.id === currentMode;

                  return (
                    <button
                      key={modeOption.id}
                      type="button"
                      onClick={() => onSelectMode(modeOption.id)}
                      style={modeButtonStyle(isSelected)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 22, fontWeight: 900 }}>{modeOption.label}</div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            color: isSelected ? "#0b2545" : "#8a6b2f",
                            textTransform: "uppercase",
                          }}
                        >
                          {isSelected ? "Selected" : "Choose"}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          color: "#4f5b66",
                          lineHeight: 1.5,
                          marginBottom: 10,
                        }}
                      >
                        {modeOption.description}
                      </div>

                      <div style={{ display: "grid", gap: 6, fontSize: 13, color: "#334155" }}>
                        <div>
                          Coaching: <b>{modeOption.showCoaching ? "Visible" : "Hidden"}</b>
                        </div>
                        <div>
                          Advanced controls:{" "}
                          <b>{modeOption.showAdvancedControls ? "Visible" : "Hidden"}</b>
                        </div>
                        <div>
                          Detailed cost view:{" "}
                          <b>{modeOption.showDetailedCost ? "Visible" : "Simplified"}</b>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #e6ddd1",
                paddingTop: 16,
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.5,
              }}
            >
              Project: <b>{projectTitle}</b>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function labelStyle() {
  return {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.08em",
    color: "#8a6b2f",
    marginBottom: 10,
  };
}
