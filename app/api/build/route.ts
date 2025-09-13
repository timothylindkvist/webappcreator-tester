// app/api/build/route.ts
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const hasAnyKey = !!(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY);

const system = [
  "You are SiteCraft AI. Output ONLY valid JSON for a marketing site structure.",
  "JSON keys: theme, brand, hero, about, features, gallery, testimonials, pricing, faq, cta.",
  "Keep copy concise, friendly, and professional. Include at least hero and about.",
];

export async function POST(req: NextRequest) {
  try {
    const { brief = "" } = await req.json();
    if (!hasAnyKey) {
      // Fallback scaffold so local dev works without keys
      const fallback = {
        theme: { palette: { brand: "#7C3AED", accent: "#06B6D4", background: "#FFFFFF", foreground: "#0B0F19" }, density: "cozy" },
        brand: { name: "Sample Co.", tagline: "We make it simple." },
        hero: { title: brief ? brief : "Your new website in minutes.", subtitle: "Describe your business in the chat and we’ll build a site." },
        about: { heading: "About Us", body: "We’re a small team focused on great service and results." },
        features: { title: "What you get", items: [{ title: "Fast", body: "Quick setup with modern performance." }, { title: "Flexible", body: "Tweak design, colors, and sections." }, { title: "SEO-ready", body: "Semantic HTML and clean content." }] },
        cta: { title: "Ready to launch?", subtitle: "Ask the assistant to tailor it to your brand.", button: { label: "Get started", href: "#" } },
      };
      return new Response(JSON.stringify(fallback), { headers: { "Content-Type": "application/json" } });
    }

    const res = await generateText({
      model: openai(process.env.NEXT_PUBLIC_AI_MODEL || "gpt-5"),
      system,
      prompt: `Brief: ${brief}\nReturn ONLY a single JSON object (no backticks, no preface).`,
      temperature: 0.2,
    });

    // Best-effort JSON parse
    let json = "{}";
    const out = (res.text || "").trim();
    try {
      const start = out.indexOf("{");
      const end = out.lastIndexOf("}");
      json = start >= 0 && end >= 0 ? out.slice(start, end + 1) : "{}";
      JSON.parse(json); // validate
    } catch {
      json = "{}";
    }

    return new Response(json, { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Build API error:", err);
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  }
}
