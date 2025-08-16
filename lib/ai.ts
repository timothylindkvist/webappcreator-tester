import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.AI_GATEWAY_BASE_URL,
});

export async function streamModelText(prompt: string) {
  return streamText({
    model: openai.chat("gpt-5"),
    prompt,
  });
}
