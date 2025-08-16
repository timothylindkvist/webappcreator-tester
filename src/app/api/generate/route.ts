import { NextRequest } from "next/server";
import { streamText } from "ai";
export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const system = [
    "You are an elite product+frontend engineer with taste for creator brands.",
    "Return ONLY one complete HTML document.",
    "MUST include <script src=\"https://cdn.tailwindcss.com\"></script> in <head> so Tailwind classes work in a standalone iframe.",
    "Use accessible semantic HTML, mobile-first, smooth animations, vivid gradients, and glassmorphism.",
    "Sections: sticky header, hero with bold headline, subcopy, primary CTA; social badges; KPI metrics; about/features; responsive portfolio grid; testimonials; contact form; beautiful footer.",
    "Keep inline <style> minimal; prefer Tailwind classes.",
    "Do NOT wrap your output in code fences."
  ].join("\n");

  const response = await streamText({
    model: "openai/gpt-5",
    messages: [
      { role: "system", content: system },
      { role: "user", content: String(prompt || "Create a cool website for influencers.") },
    ],
  });

  return response.toAIStreamResponse();
}
