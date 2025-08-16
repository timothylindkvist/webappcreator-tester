import { NextRequest } from "next/server";
import { generateText } from "ai";
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
    "Include <!DOCTYPE html> and <meta charset='utf-8'>.",
    "MUST include <script src=\"https://cdn.tailwindcss.com\"></script> so Tailwind classes work in an iframe.",
    "Use semantic, accessible HTML, mobile-first, tasteful motion, and modern design tokens.",
    "Honor preferences: tone, palette, density, brand info, audience, industry, components list.",
    "Create on-brand copy tailored to niche + audience. No lorem ipsum.",
    "Add a small <style> with CSS variables --color-primary and --color-accent, derived from provided hex or an appropriate palette.",
    "Sections: sticky header/nav; components requested; responsive grids; focus-visible states; good contrast; polished footer."
  ].join("\n");

  const user = {
    brief,
    preferences: { tone, industry, palette, layoutDensity, colors, brand, components },
    paletteGuidance: {
      vibrant: ["#b21cff","#4b73ff"],
      neutral: ["#111827","#6b7280"],
      earth:   ["#8a5a44","#2e4f3a"],
      pastel:  ["#c3b2ff","#ffa3cf"],
      cyber:   ["#00d1ff","#7a00ff"]
    }
  };

  const result = await generateText({
    model: "openai/gpt-5",
    system,
    prompt: JSON.stringify(user),
  });

  const html = result.text?.trim() || "";
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
