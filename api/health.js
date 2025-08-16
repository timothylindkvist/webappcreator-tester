// api/health.js
export const config = { runtime: "edge" };

export default async function handler(req) {
  const body = {
    ok: true,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    ts: new Date().toISOString()
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-cache",
      "x-accel-buffering": "no",
      "x-server-version": "v5"
    }
  });
}
