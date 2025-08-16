# Env Setup (Vercel)

You already set **VERCEL_AI_GATEWAY_API_KEY** in Vercel. That is the **only** env this project uses.

- No `OPENAI_API_KEY` needed.
- No `AI_GATEWAY_URL` or `OPENAI_MODEL` needed (we hardcode Gateway URL and default to GPT-5 in code).

If you run locally **without** Vercel:
- Create `.env.local` with:
  `VERCEL_AI_GATEWAY_API_KEY=your_key_here`
