# Universal Site Builder (Stable)

Generate **beautiful, tailored websites for any idea or business** with AI.
- Style presets: professional, relaxed, playful, minimal, bold
- First-time **Generate** only; afterwards default to **Edit** mode
- Edit panel: adjust copy and theme palette live
- API uses Vercel **AI Gateway** + `NEXT_PUBLIC_AI_MODEL` (default `openai/gpt-5`)

## Env
- `AI_GATEWAY_API_KEY`
- `NEXT_PUBLIC_AI_MODEL` (optional; defaults to `openai/gpt-5`)

## Dev
```bash
npm i
npm run dev
```

## Deploy (Vercel)
- Framework Preset: **Next.js**
- Output Directory: *(leave empty)*
