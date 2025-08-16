# Real-Time Website Generator


---

## Using GPT‑5 via Vercel AI Gateway (default)

This project calls the **OpenAI‑compatible endpoint** on Vercel AI Gateway and defaults to the **GPT‑5** family.

1) In your Vercel project, open **AI Gateway → API keys → Create key**.
2) Set these environment variables:
   - `VERCEL_AI_GATEWAY_API_KEY`: the key from step 1 (preferred)
   - `AI_GATEWAY_URL`: `https://ai-gateway.vercel.sh/v1` (default already)
   - `OPENAI_MODEL`: `openai/gpt-5` (or `openai/gpt-5-mini` / `openai/gpt-5-nano`)
3) Deploy. `/api/health` will report the active settings.

You can still BYO OpenAI key:
- Set `OPENAI_API_KEY` (used only if `VERCEL_AI_GATEWAY_API_KEY` is not set)
- Leave the base URL as the Gateway to benefit from routing/observability

### Why Gateway?
- Unified API and simple **model string switch** (e.g. `openai/gpt-5`)
- **Retries, failover, quotas, analytics** without code changes
- Works with **streaming** just like the OpenAI API
