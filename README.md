# Universal Website Generator (Non‑streaming fix)

This version returns **pure HTML** from `/api/generate` (no SSE framing), so the iframe renders the page instead of showing raw text.

- Next.js App Router
- `generateText` with `model: "openai/gpt-5"` (Vercel AI Gateway-ready)
- Tailwind CDN injected into HTML
- Preference controls for tone/palette/density/brand/sections
- Export `.zip` endpoint
