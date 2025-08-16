# Universal Website Generator

Tailored websites for **any** idea (businesses, hobbies, nonprofits, creators). The UI captures preferences (tone, palette, density, brand hints, sections) and streams a complete HTML page — no API keys in code.

- Next.js App Router + Edge streaming via `ai` (**GPT‑5** through **Vercel AI Gateway**)
- Tailwind via CDN inside generated HTML for instant iframe preview
- Export .zip endpoint (Node runtime) for downloads

## Dev
pnpm install
pnpm dev

## Deploy on Vercel
Configure your **AI Gateway** env (e.g. OPENAI_API_KEY or gateway-provided key). The code uses `model: "openai/gpt-5"` so requests route through the Gateway.
