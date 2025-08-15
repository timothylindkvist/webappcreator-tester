# Real‑Time Website Generator (Streaming on Vercel)

Turn a short **client brief** into a site blueprint (JSON) and then into page HTML — both **streamed** in real time.

## Hosting & Runtime
- Deploy on **Vercel** as Node serverless.
- Endpoints stream with `text/plain` to keep the UI responsive.

## Endpoints
- `POST /api/blueprint` → streams **Blueprint JSON** (Chat Completions).
- `POST /api/page` → streams **HTML** for a given `pagePath`.
- `POST /api/blueprint-edit` → *(optional prototype)* minimally edits a blueprint.
- `GET  /api/health` → diagnostics.

All streaming endpoints set:
- `Content-Type: text/plain; charset=utf-8`
- `Cache-Control: no-cache`
- `X-Accel-Buffering: no`
- `X-Server-Version: v6` marker

## Environment
Set in Vercel → Project → Settings → Environment Variables:
- `OPENAI_API_KEY` (**required**)
- `OPENAI_MODEL` (optional; defaults to `gpt-4o-mini`)

## Contracts
### /api/blueprint (input → output)
**Input:** `{ brief: string, styleReference?: string, instruction?: string }`  
**Output:** **raw JSON** (schema in `masterPrompt.js`). *No code fences, no prose.*

### /api/page (input → output)
**Input:** `{ blueprint: object|string, pagePath: string, styleReference?: string }`  
**Output:** **single full HTML document**. *No fences, no prose, no "FILE:" labels.*

Includes:
- Semantic landmarks, skip link, aria-current.
- Per-page SEO, Open Graph, and JSON-LD when relevant.
- Inline CSS ≤ ~12 KB, system fonts, responsive layout, clamp() type, prefers‑reduced‑motion.

## Front-end (no framework)
`public/index.html`:
- Shows controls (brief, optional style ref, instruction), progress bar, **Cancel**.
- Streams the blueprint into a log panel.
- Builds nav from `blueprint.site.pages[].path` and streams each page into an `<iframe>`.
- Sanitizers strip accidental code fences / labels.
- Cached HTML per page (in-memory), smooth progressive preview (throttled).

## DevTools sanity checks
```js
// Blueprint
fetch('/api/blueprint', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ brief:'Simple SaaS. Pages: Home, Features, Pricing, Contact. Tone: friendly. Primary CTA: Start free trial.',
                          instruction:'Skip step A. Perform step B only. Return ONLY the raw Blueprint JSON.' }) })
 .then(r => (console.log('headers', Object.fromEntries(r.headers)), r.text()))
 .then(t => console.log('body\n', t));

// Page HTML
// After parsing the blueprint into variable 'bp':
fetch('/api/page', {method:'POST', headers:{'Content-Type':'application/json'},
  body: JSON.stringify({ blueprint: bp, pagePath:'/' }) })
 .then(r => r.text()).then(t => console.log(t));
```

## Notes
- The **STYLE REFERENCE** (if provided) is added as a fenced HTML block **inside the system message** for context; outputs remain pure JSON/HTML.
- If you ever see an error stream, the UI will show its raw text in a `<pre>` for easy debugging.
- The optional `blueprint-edit` endpoint is a prototype for incremental editing.

— Built 2025-08-15T22:52:13.976678Z
