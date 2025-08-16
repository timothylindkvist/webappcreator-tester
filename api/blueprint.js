// api/blueprint.js
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

  const { brief, styleReference, instruction } = await req.json().catch(() => ({}));

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemText = buildSystemPrompt(styleReference);

  const userText = [
    "TASK: Produce ONLY the Blueprint JSON for the site described below.",
    "STRICT OUTPUT: Return a SINGLE valid JSON object. No markdown fences, no labels, no commentary.",
    "SCOPE: Perform Step B (Blueprint JSON) ONLY. Skip any clarification steps.",
    instruction ? `ADDITIONAL INSTRUCTION: ${instruction}` : null,
    "",
    "CLIENT BRIEF:",
    brief || "(no brief provided)",
    "",
    "JSON SCHEMA (for guidance; return a concrete object):",
    JSON.stringify({
      site: {
        title: "",
        brand: { tagline: "", tone: "friendly|premium|playful|technical", palette: { primary: "#", accent: "#", bg: "#", text: "#" } },
        seo: { metaTitle: "", metaDescription: "", ogImageHint: "" },
        navigation: [{ label: "Home", href: "/" }],
        pages: [
          { path: "/", purpose: "landing", sections: [] },
          { path: "/features", purpose: "features", sections: [] },
          { path: "/pricing", purpose: "pricing", sections: [] },
          { path: "/contact", purpose: "contact", sections: [] }
        ],
        assets: { logoHint: "", illustrationStyle: "" },
        performance: { fonts: ["system-ui"], images: "inline tiny placeholders", analytics: false }
      }
    }, null, 2)
  ]
  .filter(Boolean)
  .join("\n");

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
        { role: "user", content: userText }
      ]
    })
  });

  if (!openaiRes.ok || !openaiRes.body) {
    const text = await openaiRes.text().catch(() => "");
    return new Response(`Blueprint error (${openaiRes.status}): ${text || "No body"}`, {
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
