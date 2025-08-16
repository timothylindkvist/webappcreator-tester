// api/page.js
import { buildSystemPrompt } from "../masterPrompt.js";
import { sseToTextStream } from "./_sseToText.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const { blueprint, pagePath, styleReference } = await req.json().catch(() => ({}));

  if (!blueprint || !pagePath) {
    return new Response("Missing required fields: { blueprint, pagePath }", { status: 400 });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemText = buildSystemPrompt(styleReference);

  const blueprintText = typeof blueprint === "string" ? blueprint : JSON.stringify(blueprint, null, 2);

  const htmlOnlyInstruction = [
    `Return ONLY the complete HTML document for ${pagePath}.`,
    "Do NOT include code fences, JSON, prose, or 'FILE:' labels.",
    "Include: semantic landmarks (<header>, <nav>, <main>, <footer>), a skip link, accessible nav with aria-current, responsive grid, clamp() typography, per-page SEO tags, optional JSON-LD, CSS ≤ ~12KB, system fonts, and respect prefers-reduced-motion.",
    "Design style: Zillow-inspired — modern, spacious, trust-centric visuals with rounded cards and subtle shadows.",
    "",
    "Use this site blueprint strictly as source of truth:",
    "<BLUEPRINT>",
    blueprintText,
    "</BLUEPRINT>"
  ].join("\n");

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: htmlOnlyInstruction }
      ]
    })
  });

  if (!openaiRes.ok || !openaiRes.body) {
    const text = await openaiRes.text().catch(() => "");
    return new Response(`Page error (${openaiRes.status}): ${text || "No body"}`, {
      status: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-cache",
        "x-accel-buffering": "no",
        "x-server-version": "v5"
      }
    });
  }

  const textStream = sseToTextStream(openaiRes.body);

  return new Response(textStream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache",
      "x-accel-buffering": "no",
      "x-server-version": "v5"
    }
  });
}
