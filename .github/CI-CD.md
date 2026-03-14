# CI/CD

This repo uses GitHub Actions for CI and optional CD. You are not locked into Vercel; the same pipeline works with any host.

## Workflows

| Workflow   | Trigger              | What it does |
|-----------|----------------------|--------------|
| **CI**    | Push/PR to `main`, `development` | Lint, unit tests, build, E2E (full app). |
| **Deploy**| Push to `main`       | Build and upload `dist` artifact. Use any host to deploy it. |

## CI (`.github/workflows/ci.yml`)

1. **Lint** – ESLint on `src/` and `api/`.
2. **Unit tests** – Vitest (excludes `e2e/`).
3. **Build** – `npm run build` (needs `VITE_*` secrets for a valid build).
4. **E2E** – Playwright against the built app served from the `dist` artifact.

### Required secrets (for CI build + E2E)

In **Settings → Secrets and variables → Actions** add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

Optional: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` if the E2E flow includes admin login.

### Running locally (same as CI)

```bash
npm run lint
npm run test:run
npm run build
npm run test:e2e   # after build: npx serve dist -l 4173, then PLAYWRIGHT_BASE_URL=http://localhost:4173 npm run test:e2e
```

## CD / Deployment

The **Deploy** workflow only builds and stores the artifact. You choose where to deploy:

- **Vercel** – Connect this repo in the Vercel dashboard (recommended). Vercel will build and deploy on push to `main`. You can instead add a job that runs `vercel deploy --prod` using the artifact.
- **Netlify** – Add a job that uses the `dist` artifact with the Netlify CLI or API.
- **Cloudflare Pages** – Add a job that uploads `dist` (e.g. Wrangler or Cloudflare API).
- **Other** – Download the `dist` artifact from the workflow run and deploy to any static host.

## Not depending on Vercel

- All quality gates (lint, test, build, E2E) run in GitHub Actions.
- The same `dist` output can be deployed to Vercel, Netlify, Cloudflare, or your own server.
- Keep production env vars (and optional deploy tokens) in your host’s dashboard or in GitHub Actions secrets.
