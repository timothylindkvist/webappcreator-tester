# Influencer Website Generator

A Lovable-inspired builder that chats with GPT-5 via **Vercel AI Gateway** and streams a live preview.

## Quickstart
```bash
pnpm install
pnpm dev
```

## Environment (Vercel)
Set **AI_GATEWAY_API_KEY** (and, if required, your Gateway base URL as OPENAI_BASE_URL). The app calls the model using `model: "openai/gpt-5"`—no direct OpenAI key in code.

## Deploy
Push to GitHub and import to Vercel.

## Notes
- Preview uses Tailwind via CDN inside the generated HTML, so it looks great in the iframe.
- `/api/export` zips the last HTML for quick download.
