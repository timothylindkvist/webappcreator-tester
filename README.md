# Real-Time Website Generator (Streaming on Vercel)

This project streams a **blueprint JSON** from a brief and then streams **page HTML** per route, with a Zillow-inspired visual style. It includes a full-screen preview toggle and a11y/perf/SEO guardrails.

## Structure
- `api/blueprint.js` — Edge function that streams **only content deltas** (plain text) parsed from OpenAI Chat Completions SSE.
- `api/page.js` — Edge function that streams **only HTML** deltas for a requested `pagePath`, using the given blueprint as context.
- `api/health.js` — Basic diagnostics JSON.
- `masterPrompt.js` — System prompt builder containing the quality bar & Zillow-like style notes.
- `public/index.html` — No-framework UI with streaming log, navigation, and live iframe preview.

## Environment Variables (Vercel → Project Settings → Environment Variables)
- `OPENAI_API_KEY` — **required**
- `OPENAI_MODEL` — optional (default `gpt-4o-mini`)

## Test Locally (DevTools Examples)

**Blueprint (should stream JSON text):**
```js
fetch('/api/blueprint',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body: JSON.stringify({
    brief:'Simple SaaS. Pages: Home, Features, Pricing, Contact. Tone: friendly. Primary CTA: Start free trial.',
    instruction:'Skip step A. Perform step B only. Return ONLY the raw Blueprint JSON.'
  })
}).then(r=>{
  console.log('headers:', Object.fromEntries(r.headers));
  return r.text();
}).then(t=>console.log('body:\\n', t));
```

**Page HTML (home page):**
```js
// Assume `bp` is the parsed object from the previous call
fetch('/api/page',{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ blueprint: bp, pagePath:'/' })
}).then(r=>r.text()).then(t=>console.log(t));
```

## Guardrails
- CSS ≤ ~12KB per page, system fonts only
- Semantic HTML, ARIA labels, skip link, focus outlines
- Streaming-first UX
- Per-page SEO tags and optional JSON-LD

## Notes
- Both API routes are **Edge functions** for simple streaming with Web Streams APIs.
- The server strips OpenAI’s SSE down to plain text content deltas, so the client can show raw blueprint JSON and HTML as it arrives.
