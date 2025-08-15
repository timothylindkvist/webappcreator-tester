# Real-Time Website Generator — v2

- Strict streaming contracts (Blueprint JSON → Page HTML)
- Agnostic styling driven by **Client Brief** and optional **Style Reference**
- **Conditional style playbooks** (real estate / SaaS / e-commerce / portfolio) that auto-apply only when detected
- **Expand / Fullscreen / Pop-out** preview controls
- Code-hidden UI with soft status lines

## Endpoints
- `POST /api/blueprint` — streams Blueprint JSON (Chat Completions, 2025-08-15T23:58:13.429759Z build)
- `POST /api/page` — streams per-page HTML
- `POST /api/blueprint-edit` — optional minimal-edit endpoint
- `GET  /api/health` — diagnostics

## Env
- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional, default `gpt-4o-mini`)

## Notes
- The **Style Reference** is injected inside the system message for context only; outputs remain pure JSON/HTML.
- Playbooks are *nudges*, not fixed tokens; if the brief doesn’t match an industry, nothing is injected.
