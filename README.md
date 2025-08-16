# Universal Site Builder

Generate beautiful websites for any business or idea with AI.
- Style presets (professional / relaxed / playful / minimal / bold)
- First-time **Generate**; afterwards default to **Edit** (Regenerate available)
- Quick editor to tweak copy & theme colors (CSS variables)
- Uses `OPENAI_*` envs; compatible with Vercel AI Gateway

## Env
- `OPENAI_API_KEY` (required) — use your OpenAI key **or** your Vercel AI Gateway key
- `OPENAI_MODEL` (recommended) — e.g. `gpt-5`
- `OPENAI_BASE_URL` (optional) — set to your Vercel AI Gateway **Base URL** to proxy via Gateway

## Dev
```bash
npm i
npm run dev
```

## Deploy on Vercel
- Framework: **Next.js**
- Output Directory: *(leave empty)*
- Add the env vars above in Project Settings
