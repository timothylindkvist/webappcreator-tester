import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { ok: false, error: "Missing OPENAI_API_KEY" },
      { status: 401 }
    );
  }

  try {
    const { brief } = await req.json();

    if (!brief || typeof brief !== "string") {
      return Response.json(
        { ok: false, error: "Missing or invalid brief" },
        { status: 400 }
      );
    }

    // === 1️⃣ Create the full site structure from GPT-5 ===
    const refined = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a professional web app designer.
Return a valid JSON object describing the complete website layout for the given brief.
The JSON must always include:
{
  "theme": { "palette": { "brand": string, "accent": string, "background": string, "foreground": string }, "density": string },
  "hero": { "title": string, "subtitle": string },
  "sections": array or object of any other content.
}
Do not include markdown or code fences. Only return valid JSON.`,
        },
        { role: "user", content: brief },
      ],
    });

    const raw = refined.choices?.[0]?.message?.content?.trim() || "";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("GPT-5 did not return valid JSON");
    }

    // === 2️⃣ Generate the DALL·E background image ===
    const image = await client.images.generate({
      model: "dall-e-3",
      prompt: `High-quality, professional website background image for: ${brief}`,
      size: "1792x1024",
    });

    const imageUrl = image.data?.[0]?.url;
    if (!imageUrl) throw new Error("Image generation failed");

     const applyHeroBackground = (site: any, url: string) => {
      if (!site || typeof site !== "object") return;

      if (typeof site.hero === "object" && site.hero !== null) {
        site.hero = { ...site.hero, backgroundImage: url };
      } else if (site.hero === undefined) {
        site.hero = { backgroundImage: url };
      }

      if (typeof site.heroImage === "object" && site.heroImage !== null) {
        site.heroImage = { ...site.heroImage, url };
      } else if (site.heroImage === undefined) {
        site.heroImage = { url };
      }

      if (typeof site.media === "object" && site.media !== null) {
        const heroMedia = typeof site.media.hero === "object" && site.media.hero !== null ? site.media.hero : {};
        site.media = { ...site.media, hero: { ...heroMedia, url } };
      }

      const normaliseHeroBlock = (block: any) => {
        if (!block || typeof block !== "object") return block;
        if (block.type === "hero") {
          const data = typeof block.data === "object" && block.data !== null ? block.data : {};
          return {
            ...block,
            data: { ...data, backgroundImage: url },
          };
        }

        if (typeof block.id === "string" && block.id.toLowerCase().includes("hero")) {
          const data = typeof block.data === "object" && block.data !== null ? block.data : undefined;
          if (data) {
            return {
              ...block,
              data: { ...data, backgroundImage: url },
            };
          }
        }

        return block;
      };

      if (Array.isArray(site.blocks)) {
        site.blocks = site.blocks.map((block: any) => normaliseHeroBlock(block));
      } else if (typeof site.blocks === "object" && site.blocks !== null) {
        const nextBlocks: Record<string, any> = {};
        for (const [key, value] of Object.entries(site.blocks)) {
          if (key === "hero" && value && typeof value === "object" && !Array.isArray(value)) {
            nextBlocks[key] = { ...value, backgroundImage: url };
          } else {
            nextBlocks[key] = value;
          }
        }
        site.blocks = nextBlocks;
      }

      if (Array.isArray(site.sections)) {
        site.sections = site.sections.map((section: any) => normaliseHeroBlock(section));
      } else if (typeof site.sections === "object" && site.sections !== null) {
        const nextSections: Record<string, any> = {};
        for (const [key, value] of Object.entries(site.sections)) {
          if (key === "hero" && value && typeof value === "object" && !Array.isArray(value)) {
            nextSections[key] = { ...value, backgroundImage: url };
          } else {
            nextSections[key] = value;
          }
        }
        site.sections = nextSections;
      }
    };

    applyHeroBackground(parsed, imageUrl)