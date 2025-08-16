import { NextRequest } from "next/server";
import { streamText } from "ai";
export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const brief: string = body?.brief ?? "";
  const prefs = body?.prefs ?? {};
  const tone = prefs?.tone ?? "professional";
  const industry = prefs?.industry ?? "general";
  const palette = prefs?.palette ?? "vibrant";
  const layoutDensity = prefs?.layoutDensity ?? "comfortable";
  const colors = prefs?.colors ?? {};
  const brand = prefs?.brand ?? {};
  const components = Array.isArray(prefs?.components) && prefs.components.length ? prefs.components : ["hero","about","features","services","pricing","gallery","testimonials","faq","contact","footer"];

  const system = [
    "You are an elite full‑stack product+frontend engineer with strong brand/UX instincts.",
    "Return ONLY one complete HTML document. No markdown, no backticks.",
    "MUST include <script src=\"https://cdn.tailwindcss.com\"></script> so Tailwind classes work in an iframe without build.",
    "Use semantic, accessible HTML, mobile-first, with tasteful motion and modern design tokens.",
    "Respect preferences exactly: tone, palette, density, brand info, audience, industry, components list.",
    "Visually: gradients and/or clean neutrals depending on tone; glassmorphism when appropriate. Avoid gaudy overload if tone is professional/elegant.",
    "Typography: use web-safe or Google fonts via <link> only.",
    "Create on-brand copy tailored to niche + audience. Avoid lorem ipsum.",
    "Implement CSS variables in a <style> block: --color-primary, --color-accent based on palette or provided hex. Use them for gradients and emphasis.",
    "Include a sticky header with nav; requested sections; responsive grid; focus-visible states; high contrast.",
    "Include lightweight SVG icons where helpful. Keep output self-contained."
  ].join("\n");

  const user = {
    brief,
    preferences: { tone, industry, palette, layoutDensity, colors, brand, components },
    toneTokens: {
      professional: { radius: 12, motion: 0.4, shadow: "md" },
      relaxed:      { radius: 16, motion: 0.7, shadow: "lg" },
      playful:      { radius: 18, motion: 1.0, shadow: "xl" },
      elegant:      { radius: 14, motion: 0.35, shadow: "md" },
      bold:         { radius: 14, motion: 0.9, shadow: "xl" }
    },
    densityTokens: {
      cozy:        { space: "gap-6", pad: "p-6" },
      comfortable: { space: "gap-8", pad: "p-8" },
      compact:     { space: "gap-4", pad: "p-4" }
    },
    paletteGuidance: {
      vibrant: ["#b21cff","#4b73ff"],
      neutral: ["#111827","#6b7280"],
      earth:   ["#8a5a44","#2e4f3a"],
      pastel:  ["#c3b2ff","#ffa3cf"],
      cyber:   ["#00d1ff","#7a00ff"]
    }
  };

  const response = await streamText({
    model: "openai/gpt-5",
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) },
    ],
  });

  return response.toAIStreamResponse();
}
