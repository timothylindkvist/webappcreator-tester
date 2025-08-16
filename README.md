# Influencer Site Builder

A Next.js App Router project that uses **Vercel AI SDK v5** with **AI Gateway** to generate influencer websites.
Styling via Tailwind with fixed keyframes and dark theme variable scopes (resolves common CSS errors).

## Environment

Set these in Vercel → Project Settings → Environment Variables:

- `AI_GATEWAY_API_KEY` — your AI Gateway key (Server)
- `NEXT_PUBLIC_AI_MODEL` — optional; default is `openai/gpt-5`

## Develop

```bash
pnpm i
pnpm dev
```

Open http://localhost:3000

## Deploy to Vercel

- Push to GitHub and import the repo in Vercel
- Ensure env vars above are set for **Production** and **Preview**
