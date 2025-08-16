import { NextRequest } from "next/server";
import { streamModelText } from "@/lib/ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return new Response("Invalid prompt", { status: 400 });
  }

  const result = await streamModelText(prompt);
  return result.toDataStreamResponse();
}
