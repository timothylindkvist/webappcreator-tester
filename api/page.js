// api/page.js
import OpenAI from "openai";
import { buildSystemPrompt, MASTER_PROMPT } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v1-page") {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
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
      res.statusCode = 405;
      return res.end("Method Not Allowed");
    }
    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      return res.end("Missing OPENAI_API_KEY");
    }

    const { blueprint, pagePath, styleReference } = await readBody(req);
    if (!blueprint || !pagePath) {
      res.statusCode = 400;
      return res.end("Page error (400): 'blueprint' and 'pagePath' are required");
    }

    const MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemText = buildSystemPrompt({ styleReference, briefOrBlueprint: blueprint });
    const bpText = typeof blueprint === "string" ? blueprint : JSON.stringify(blueprint);

    const userText = `
You already created the site blueprint. Use it verbatim.

Return ONLY a single, complete HTML document for the page path "${pagePath}".
Start with <!doctype html> and include minimal, inline CSS.
No markdown fences, no JSON, no labels like "FILE:".

BLUEPRINT:
${bpText}
`.trim();

    setStreamHeaders(res, "v1-page");
    res.setHeader("X-Model", MODEL);
    res.flushHeaders?.();

    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemText || MASTER_PROMPT },
        { role: "user", content: userText }
      ],
    });

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content || "";
      if (delta) res.write(delta);
    }
    res.end();
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err?.message || String(err);
    if (!res.headersSent) setStreamHeaders(res, "v1-page");
    res.statusCode = 500;
    res.end(`Page error (500): ${msg}`);
  }
}
