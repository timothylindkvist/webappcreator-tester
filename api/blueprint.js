import { streamChat } from "../utils/openai-client.js";
import { systemBlueprint } from "../masterPrompt.js";

export const config = { runtime: "nodejs18.x" };

export default async function handler(req, res){
  if (req.method !== "POST") { res.status(405).send("Blueprint error (405): POST only"); return; }
  try{
    const { brief, styleReference, instruction } = req.body || {};
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    const ctrl = new AbortController();
    req.on("close", ()=>ctrl.abort());

    const messages = [
      { role: "system", content: systemBlueprint },
      { role: "user", content: JSON.stringify({ brief, styleReference, instruction }) }
    ];
    const resp = await streamChat({
      apiKey: process.env.OPENAI_API_KEY,
      messages,
      response_format: { type: "json_schema", json_schema: { name: "blueprint", schema: { type: "object" }, strict: false } }
    });

    for await (const chunk of resp.body){
      res.write(chunk);
    }
    res.end();
  }catch(err){
    res.status(500).send(`Blueprint error (500): ${String(err)}`);
  }
}
