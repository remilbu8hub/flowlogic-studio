import { useMemo, useState } from "react";
import { THEME } from "../config/theme";
import { buttonStyle, cardStyle, inputStyle } from "./formatters";

const GITHUB_ISSUE_BASE_URL =
  "https://github.com/remilbu8hub/flowlogic-studio/issues/new";

function buildGithubIssueUrl({
  message,
  name,
  email,
  scenarioName,
  mode,
  nodeCount,
  edgeCount,
  boundaryColumn,
  currentUrl,
}) {
  const titleSource = message.trim() || scenarioName.trim() || "Support request";
  const title = `FlowLogic Studio support: ${titleSource.slice(0, 72)}`;
  const body = [
    "## FlowLogic Studio Feedback",
    "",
    message.trim() || "Please describe the issue or request here.",
    "",
    "## Contact",
    "",
    `- Name: ${name.trim() || "Not provided"}`,
    `- Email: ${email.trim() || "Not provided"}`,
    "",
    "## FlowLogic Studio Context",
    "",
    `- Workspace: ${scenarioName || "Supply Chain Workspace"}`,
    `- Mode: ${mode}`,
    `- Nodes: ${nodeCount}`,
    `- Lanes: ${edgeCount}`,
    `- Boundary setting: ${boundaryColumn}`,
    `- Current URL: ${currentUrl || "Not available"}`,
  ].join("\n");

  return `${GITHUB_ISSUE_BASE_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

export default function SupportPage({
  mode,
  scenarioName,
  nodeCount,
  edgeCount,
  boundaryColumn,
}) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitState, setSubmitState] = useState({ status: "idle", detail: "" });
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;

  const githubIssueUrl = useMemo(() => {
    return buildGithubIssueUrl({
      message,
      name,
      email,
      scenarioName,
      mode,
      nodeCount,
      edgeCount,
      boundaryColumn,
      currentUrl,
    });
  }, [message, name, email, scenarioName, mode, nodeCount, edgeCount, boundaryColumn, currentUrl]);

  async function handleSubmitFeedback() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitState({
        status: "error",
        detail: "A message is required before feedback can be submitted.",
      });
      return;
    }

    setSubmitState({ status: "submitting", detail: "" });

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          email: email.trim() || "",
          name: name.trim() || "",
          scenarioName,
          mode,
          currentUrl,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Feedback could not be submitted right now.");
      }

      setMessage("");
      setEmail("");
      setName("");
      setSubmitState({
        status: "success",
        detail: "Feedback was submitted successfully.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        detail: error?.message || "Feedback could not be submitted right now.",
      });
    }
  }

  function openGithubIssue() {
    window.open(githubIssueUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        maxWidth: 960,
        minWidth: 0,
      }}
    >
      <div style={{ ...cardStyle(), display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, color: THEME.colors.textPrimary }}>FlowLogic Studio Support</h2>
        <p style={{ margin: 0, color: THEME.colors.textMuted, lineHeight: 1.7 }}>
          Use the form below for lightweight FlowLogic Studio feedback, or open a GitHub issue
          when you want a tracked report with richer detail. Both paths include workspace context
          so the issue is easier to understand and reproduce.
        </p>
        <p style={{ margin: 0, color: THEME.colors.textMuted, lineHeight: 1.7 }}>
          For tracked bugs or feature requests, GitHub Issues is the preferred path.
        </p>
      </div>

      <div style={{ ...cardStyle(), display: "grid", gap: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 12,
          }}
        >
          <div>
            <label
              htmlFor="support-name"
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 700,
                color: THEME.colors.textPrimary,
              }}
            >
              Name
            </label>
            <input
              id="support-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional name"
              style={inputStyle()}
            />
          </div>

          <div>
            <label
              htmlFor="support-email"
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 700,
                color: THEME.colors.textPrimary,
              }}
            >
              Email
            </label>
            <input
              id="support-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Optional email"
              style={inputStyle()}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="support-message"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 700,
              color: THEME.colors.textPrimary,
            }}
          >
            Message
          </label>
          <textarea
            id="support-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe the issue, question, or idea."
            rows={6}
            style={{
              ...inputStyle(),
              resize: "vertical",
              minHeight: 140,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            padding: 14,
            borderRadius: THEME.radius.md,
            background: THEME.colors.background,
            border: `1px solid ${THEME.colors.border}`,
            color: THEME.colors.textMuted,
            lineHeight: 1.6,
          }}
        >
          <div>
            <b>Feedback form:</b> sends a lightweight message to the FlowLogic Studio Vercel
            feedback endpoint.
          </div>
          <div>
            <b>GitHub issue:</b> opens a prefilled FlowLogic Studio issue for tracked bug reports,
            requests, or product feedback.
          </div>
        </div>

        {submitState.status !== "idle" ? (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: THEME.radius.md,
              background:
                submitState.status === "success"
                  ? "rgba(22, 163, 74, 0.08)"
                  : submitState.status === "error"
                    ? "rgba(220, 38, 38, 0.08)"
                    : THEME.colors.background,
              border: `1px solid ${
                submitState.status === "success"
                  ? THEME.colors.success
                  : submitState.status === "error"
                    ? THEME.colors.danger
                    : THEME.colors.border
              }`,
              color:
                submitState.status === "success"
                  ? THEME.colors.success
                  : submitState.status === "error"
                    ? THEME.colors.danger
                    : THEME.colors.textMuted,
            }}
          >
            {submitState.status === "submitting" ? "Submitting feedback..." : submitState.detail}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={handleSubmitFeedback}
            style={buttonStyle("primary")}
            disabled={submitState.status === "submitting"}
          >
            Submit Feedback
          </button>
          <button type="button" onClick={openGithubIssue} style={buttonStyle()}>
            Open GitHub Issue
          </button>
        </div>
      </div>
    </div>
  );
}
