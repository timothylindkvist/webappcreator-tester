// api/health.js
export const runtime = "nodejs";
export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    time: new Date().toISOString()
  });
}
function setHeaders(res, version = "v8") {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Server-Version", version);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    setHeaders(res);
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: "Method Not Allowed" }));
    return;
  }

  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
  const body = {
    ok: true,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    OPENAI_MODEL: model,
    node: process.versions.node,
    region: process.env.VERCEL_REGION || "unknown",
    time: new Date().toISOString(),
  };

  setHeaders(res);
  res.end(JSON.stringify(body, null, 2));
}
