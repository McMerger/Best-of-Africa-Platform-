# Production Deployment Guide

## Pre-flight Checklist

### 1. Secrets (run once per environment)

```bash
wrangler secret put JWT_SECRET        # openssl rand -hex 32
wrangler secret put ADMIN_API_KEY     # random key for /admin and /self-improve endpoints
wrangler secret put NEWS_API_KEY      # newsapi.org — required for ingestion
wrangler secret put DEV_SECRET        # protects /dev/* endpoints in production
```

Optional AI providers (platform falls back to Workers AI if unset):
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GOOGLE_AI_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

Optional integrations:
```bash
wrangler secret put KOFI_TOKEN         # Ko-fi webhook verification
wrangler secret put ELEVENLABS_API_KEY # AI audio briefings
```

### 2. Cloudflare Resources

Verify these exist in your Cloudflare account before deploying:

```bash
wrangler d1 list             # must include: best-of-africa-db
wrangler kv:namespace list   # must include: CACHE and RATE_LIMIT namespaces
wrangler r2 bucket list      # must include: best-of-africa-media
wrangler vectorize list      # must include: best-of-africa-content
```

Create Queues if they do not exist:
```bash
wrangler queues create content-generation
wrangler queues create headline-optimization
```

### 3. Database Migrations

```bash
npm run db:migrate:prod
```

Note: `migrations/9999_test_task.sql` is a neutralized placeholder — delete it
before running migrations. Test fixtures live in `fixtures/test_task_seed.sql`
and should only be applied locally:
```bash
wrangler d1 execute best-of-africa-db --local --file=fixtures/test_task_seed.sql
```

### 4. Deploy the Worker

```bash
npm run deploy
# or with explicit environment profile:
wrangler deploy --env production
```

### 5. Deploy the Frontend (Cloudflare Pages)

Set the following in your Pages project environment variables (Settings > Environment variables):
```
VITE_API_URL = https://api.bestofafrica.com/api/v1
```

Build command: `cd frontend && npm install && npm run build`
Output directory: `frontend/dist`

The Vite build will throw an error at build time if VITE_API_URL is unset in production mode.

---

## Local Development

```bash
# 1. Copy the env template and fill in values
cp .env.example .dev.vars

# 2. Set the frontend API URL for local dev
echo "VITE_API_URL=http://localhost:8787/api/v1" > frontend/.env.local

# 3. Apply local DB migrations
npm run db:migrate

# 4. Start backend and frontend concurrently
npm run dev
```

CORS: add `ADDITIONAL_ORIGINS=http://localhost:5173,http://localhost:5174` to `.dev.vars`
so the local frontend can reach the local Worker.

---

## Environment Profiles

| Profile | Command | ENVIRONMENT value |
|---|---|---|
| Production | `wrangler deploy --env production` | `production` |
| Staging | `wrangler deploy --env staging` | `staging` |
| Local | `wrangler dev` with `.dev.vars` | `development` |

---

## Post-Deploy Verification

```bash
# Health check
curl https://api.bestofafrica.com/health

# Agent status
curl https://api.bestofafrica.com/api/v1/agent/status

# Trigger self-improvement run
curl -X GET https://api.bestofafrica.com/api/v1/self-improve/evolve \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```
