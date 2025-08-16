import { streamChat } from "../utils/openai-client.js";
import { systemPage } from "../masterPrompt.js";

export default async function handler(req, res){
  if (req.method !== "POST") { res.status(405).send("Page error (405): POST only"); return; }
  try{
    const { blueprint, pagePath, styleReference } = req.body || {};
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    const ctrl = new AbortController();
    req.on("close", ()=>ctrl.abort());

    const messages = [
      { role: "system", content: systemPage },
      { role: "user", content: JSON.stringify({ blueprint, pagePath, styleReference }) }
    ];

    const resp = await streamChat({
      apiKey: process.env.OPENAI_API_KEY,
      messages
    });

    for await (const chunk of resp.body){
      res.write(chunk);
    }
    res.end();
  }catch(err){
    res.status(500).send(`Page error (500): ${String(err)}`);
  }
}
