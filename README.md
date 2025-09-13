# Sidesmith – Website Creator

A minimal Next.js app that generates site JSON via OpenAI and renders it.

## Quick start

1. Set env vars in Vercel (Project → Settings → Environment Variables):
   - `OPENAI_API_KEY` — required
   - `OPENAI_MODEL` — optional (defaults to `gpt-5`)

2. Deploy or run locally:

```bash
npm i
npm run dev
```

Open http://localhost:3000 and generate a site.
