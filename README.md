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



## Universal (topic-agnostic) mode

The builder now accepts **any business/topic** (cooking, cars, SaaS, cafés, portfolios, etc.) and returns a structured page with:
- `theme` (vibe & palette),
- `brand` (name/tagline/industry),
- optional `nav`,
- sections: `hero`, `about`, optional `features`, `gallery`, `testimonials`, `pricing`, `faq`, and a closing `cta`.

UI conditionally renders whatever sections are returned and applies palette colors via CSS variables.
