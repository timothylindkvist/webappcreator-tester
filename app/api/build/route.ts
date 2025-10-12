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

    if (!parsed.hero) throw new Error("Missing hero section in JSON");
    parsed.hero.backgroundImage = imageUrl;
    if (Array.isArray((parsed as any).blocks)) {
      (parsed as any).blocks = (parsed as any).blocks.map((block: any) => {
        if (block?.type !== "hero") return block;
        const data = typeof block?.data === "object" && block.data !== null ? block.data : {};
        return {
          ...block,
          data: {
            ...data,
            backgroundImage: imageUrl,
          },
        };
      });
    }

    // === 3️⃣ Final sanity checks ===
    if (!parsed.theme?.palette?.brand) throw new Error("Incomplete theme palette from GPT-5");

    return Response.json({ ok: true, data: parsed });
  } catch (err: any) {
    console.error("Build error:", err);
    return Response.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
