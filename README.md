# Lovable-style Next.js Starter

A sleek, Lovable-inspired UI with streaming AI via **Vercel AI Gateway** (no keys in code).

## Quickstart

```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
```

## Deploy on Vercel

1. Push this folder to a GitHub repo.
2. Import into Vercel.
3. Set env vars (Project Settings → Environment Variables):
   - `AI_GATEWAY_API_KEY` = your Vercel AI Gateway key
   - `AI_GATEWAY_BASE_URL` = your AI Gateway base URL
4. Deploy.

> Uses `@ai-sdk/openai` + `ai` and calls `openai.chat("gpt-5")` — matching the Vercel AI Gateway GPT-5 docs.

## Stack

- Next.js App Router (Edge runtime for API route)
- TailwindCSS
- Minimal custom UI components (soft shadows, rounded 2xl, gradient accents)
- Streaming responses with `ai`

## Notes

- No API keys are committed to code. Configure via environment variables in Vercel.
- Feel free to add shadcn/ui if you want richer primitives.
