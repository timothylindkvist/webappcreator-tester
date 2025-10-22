# Sidesmith Hardening & Polish — 2025-10-22 21:55

Changes applied:
- Removed duplicate `postcss.config.js` (kept ESM).
- Sanitized HTML in `components/sections/Html.tsx` using `isomorphic-dompurify`.
- Added tiny Edge-safe rate limiter (`lib/ratelimit.ts`). Default: 30 req/min per IP.
- Added structured logger with redaction (`lib/logger.ts`).
- Switched all API routes to Edge runtime (`export const runtime = 'edge'`), added zod import for validation, and rate limit guard.
- Added input-hash cache to `/api/images/background` route (if present).
- Added security headers (CSP, XFO, Referrer-Policy, Permissions-Policy) in `next.config.ts`.
- Upgraded SEO: `app/layout.tsx` metadata (OG/Twitter) + `app/robots.ts` + `app/sitemap.ts`.
- Added `app/error.tsx` and `app/loading.tsx` for better UX.

Follow-ups for you (not breaking changes):
- Replace any OpenAI SDK calls with **Responses API via fetch** for full Edge compatibility (note added to routes).
- Consider consolidating state (Context vs Zustand) to one solution.
- Add ARIA labels to any custom controls missed here and re-check contrast with your themes.
