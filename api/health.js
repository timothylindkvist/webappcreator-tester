// api/health.js
export const runtime = "nodejs";

function setHeaders(res, version = "v6") {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Server-Version", version);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    setHeaders(res);
    res.end("Health error (405): Method Not Allowed");
    return;
  }
  const body = {
    ok: true,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    time: new Date().toISOString(),
  };
  setHeaders(res);
  res.end(JSON.stringify(body, null, 2));
}
