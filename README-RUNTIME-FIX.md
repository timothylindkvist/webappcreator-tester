# Vercel Runtime Fix

**Why this exists:** Your deployment shows  
`Error: Function Runtimes must have a valid version, for example now-php@1.0.0`.

That error typically means your project is using a legacy/invalid runtime config.

## Fix (drop-in)

1) Put this `vercel.json` in the **repo root** (next to your package.json).
2) Commit and redeploy.

```json
{
  "version": 2,
  "functions": {
    "api/*.js": { "runtime": "nodejs22.x" },
    "api/*.ts": { "runtime": "nodejs22.x" }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/public/index.html" }
  ]
}
```

## Also check

- **Remove** any legacy `now.json` or `"builds"` key in old `vercel.json`.
- In Vercel **Project → Settings → Build & Output Settings**:
  - Clear any custom "Build Command" that sets an old builder.
  - Ensure no old **Serverless Function Runtime** is forced via UI.
- If your API files are ESM (type: module), add `"engines": { "node": ">=20" }` to `package.json`.
- If you **don’t** use API routes at all, delete `/api` and remove the `routes` rule that forwards `/api/(.*)`.

