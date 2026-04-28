export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const message = String(body.message ?? "").trim();

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const payload = {
    product: "FlowLogic Studio",
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    message,
    scenarioName: String(body.scenarioName ?? "").trim() || "Supply Chain Workspace",
    mode: String(body.mode ?? "").trim() || "educator",
    currentUrl: String(body.currentUrl ?? "").trim(),
    receivedAt: new Date().toISOString(),
  };

  console.log("[flowlogic-studio-feedback]", JSON.stringify(payload, null, 2));

  return res.status(200).json({
    ok: true,
    message: "Feedback received.",
  });
}
