// api/health.js
export const runtime = "nodejs";

function setHeaders(res, version = "v8") {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Server-Version", version);
}

export default async function handler(req, res) {
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  const body = {
    ok: true,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    OPENAI_MODEL: model,
    node: process.versions.node,
    region: process.env.VERCEL_REGION || "unknown",
    time: new Date().toISOString()
  };

  setHeaders(res);
  res.status(200).end(JSON.stringify(body, null, 2));
}
