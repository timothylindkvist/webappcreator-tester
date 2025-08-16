export const runtime = "nodejs";

import OpenAI from "openai";
import { buildSystemPrompt } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v8") {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Server-Version", version);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      setStreamHeaders(res);
      res.statusCode = 405;
      res.end("Page error (405): Method Not Allowed");
      return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

    if (!OPENAI_API_KEY) {
      setStreamHeaders(res);
      res.statusCode = 500;
      res.end("Page error (500): OPENAI_API_KEY missing");
      return;
    }

    const body = await readBody(req);
    const { blueprint, pagePath, styleReference } = body || {};
    if (!blueprint || !pagePath) {
      setStreamHeaders(res);
      res.statusCode = 400;
      res.end("Page error (400): 'blueprint' and 'pagePath' are required");
      return;
    }

    const bpText = typeof blueprint === "string" ? blueprint : JSON.stringify(blueprint);
    const systemText = buildSystemPrompt({ styleReference, briefOrBlueprint: blueprint });

    const userText = `
You already created the site blueprint. Use it verbatim.

Return ONLY a single, complete HTML document for the page path "${pagePath}".
Do NOT include markdown code fences, JSON, prose, or any labels such as "FILE: /index.html".
Start with <!doctype html> and include <html>, <head>, and <body>.

REQUIREMENTS:
- Semantic landmarks (<header>, <nav>, <main id="main">, <footer>) with correct heading order.
- Include a visible "Skip to content" link to #main.
- Navigation with aria-current="page" on the active link.
- Per-page SEO: <title>, <meta name="description">, Open Graph tags; add JSON-LD when relevant.
- CSS inline ≤ ~12 KB. Use system font stack only, clamp() typography, CSS variables for theme.
- Respect prefers-reduced-motion, lazy-load noncritical images, avoid layout shift.
- Responsive layout (grid/flex), rounded corners, subtle shadows, tasteful gradients.

BLUEPRINT JSON (use this as the single source of truth; do not echo it):
${bpText}
`.trim();

    setStreamHeaders(res);
    res.setHeader("X-Model", MODEL);
    res.flushHeaders?.();

    const client = new OpenAI({ apiKey: OPENAI_API_KEY });
    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.6,
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: userText },
      ],
    });

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content || "";
      if (delta) res.write(delta);
    }
    res.end();
  } catch (err) {
    const msg =
      err?.response?.data?.error?.message ||
      err?.error?.message ||
      err?.message ||
      String(err);
    if (!res.headersSent) setStreamHeaders(res);
    res.statusCode = 500;
    res.end(`Page error (500): ${msg}`);
    console.error("[/api/page] Error:", err);
  }
}
