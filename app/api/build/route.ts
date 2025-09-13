
// app/api/build/route.ts
import { NextRequest } from "next/server";

// HARD REQUIREMENT: must have OPENAI_API_KEY. No fallbacks.
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { brief = "" } = await req.json();

    const system = [
      "You are SiteCraft AI. Output ONLY valid JSON for a marketing site structure.",
      "JSON keys: theme, brand, hero, about, features, gallery, testimonials, pricing, faq, cta.",
      "Keep copy concise, friendly, professional. Include at least hero and about."
    ].join("\n");

    const model = process.env.NEXT_PUBLIC_AI_MODEL || "gpt-5";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Brief: ${brief}\nReturn ONLY a single JSON object (no backticks, no preface).` },
        ],
        response_format: { type: "text" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI error:", text);
      return new Response(JSON.stringify({ error: "OpenAI error", detail: text }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const out = (data?.choices?.[0]?.message?.content || "").trim();

    // Strict JSON extraction
    const start = out.indexOf("{");
    const end = out.lastIndexOf("}");
    if (start < 0 || end < 0) {
      return new Response(JSON.stringify({ error: "Model did not return JSON" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }
    const json = out.slice(start, end + 1);

    // Validate JSON before returning
    try { JSON.parse(json); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON from model" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(json, { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("Build API error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
