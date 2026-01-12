# Best of Africa - Fully Optimized Architecture

## Requirements Audit

| Requirement | Current | Gap | Fix |
|-------------|---------|-----|-----|
| AI-native article generation | ✅ Workers AI | — | — |
| Self-optimizing headlines | ✅ Optimizer Worker | — | — |
| Real-time user behavior | ⚠️ Custom events table | Slow aggregation | **Analytics Engine** |
| Fix narrative gaps automatically | ❌ Missing | No semantic understanding | **Vectorize** for embeddings |
| Regional updates/dashboards | ⚠️ Basic | No real-time aggregation | **Durable Objects** |
| Sponsor campaigns & distribution | ❌ Missing | No outbound channel | **Email Workers** |
| Paid intelligence API | ✅ Routes defined | — | — |

---

## Optimized Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC LAYER                                   │
│  ┌─────────────────┐    ┌─────────────────────────────────────────────┐    │
│  │ Cloudflare Pages│───▶│            Hono API (Workers)               │    │
│  │   (Frontend)    │    │  /articles /countries /intel /analytics     │    │
│  └─────────────────┘    └──────────────────┬──────────────────────────┘    │
└────────────────────────────────────────────┼────────────────────────────────┘
                                             │
┌────────────────────────────────────────────┼────────────────────────────────┐
│                              DATA LAYER    │                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  ┌──────────────────────────┐  │
│  │    D1    │  │    KV    │  │    R2    │  │  │      Vectorize           │  │
│  │ Articles │  │  Cache   │  │  Media   │  │  │  Content Embeddings      │  │
│  │ Users    │  │ Sessions │  │  Images  │  │  │  Semantic Search         │  │
│  │ Countries│  │ Limits   │  │  Assets  │  │  │  Narrative Gap Detection │  │
│  └──────────┘  └──────────┘  └──────────┘  │  └──────────────────────────┘  │
│                                            │                                │
│  ┌──────────────────────────────────────┐  │  ┌──────────────────────────┐  │
│  │        Analytics Engine              │◀─┘  │    Durable Objects       │  │
│  │  Real-time user behavior             │     │  Live dashboard counters │  │
│  │  Engagement metrics at scale         │     │  Real-time aggregation   │  │
│  │  Audience segmentation               │     │  WebSocket connections   │  │
│  └──────────────────────────────────────┘     └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTELLIGENCE LAYER                                 │
│  ┌───────────────┐     ┌────────────────────────────────────┐              │
│  │   Ingestion   │────▶│           Queues                   │              │
│  │  (Cron 30min) │     │  - content-generation              │              │
│  └───────────────┘     │  - headline-optimization           │              │
│         │              │  - narrative-gap-filler            │              │
│         ▼              └─────────────┬──────────────────────┘              │
│  ┌──────────────────────────────────┐│                                     │
│  │         Workers AI               ││                                     │
│  │  ┌─────────────┐ ┌─────────────┐ ▼│  ┌─────────────────────────────┐    │
│  │  │ Llama 3.1   │ │ BGE v1.5    │  │  │     Optimizer Worker        │    │
│  │  │ 70B Instruct│ │ Embeddings  │  │  │     (Cron 6hr)              │    │
│  │  │ Articles    │ │ Vectorize   │  │  │  - A/B test headlines       │    │
│  │  │ Headlines   │ │ Similarity  │  │  │  - Adjust prompts           │    │
│  │  └─────────────┘ └─────────────┘  │  │  - Fill narrative gaps      │    │
│  └───────────────────────────────────┘  └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DISTRIBUTION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Email Workers                                   │   │
│  │  - Newsletter delivery to subscribers                                │   │
│  │  - Partner/government report distribution                           │   │
│  │  - Sponsor campaign notifications                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Additions

### 1. Vectorize (Semantic Layer)

- Stores embeddings of all articles using `@cf/baai/bge-base-en-v1.5`
- Enables **narrative gap detection**: find topics/countries with low coverage
- Powers **semantic search**: "investment opportunities in renewable energy"
- Identifies **content clusters** to avoid repetition

### 2. Analytics Engine (Real-time Behavior)

- Native Cloudflare service for high-volume event ingestion
- Powers the self-optimization loop with actual metrics
- Enables audience segmentation for paid intelligence tier

### 3. Durable Objects (Live Dashboards)

- Real-time counters for trending articles
- Live visitor counts per country page
- WebSocket support for admin dashboard

### 4. Email Workers (Distribution)

- Newsletter automation
- Partner report delivery
- Sponsor campaign distribution

---

## Updated File Structure

```
e:\Best Of Africa Platform\
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── articles.ts
│   │   ├── countries.ts
│   │   ├── analytics.ts
│   │   ├── intelligence.ts
│   │   └── search.ts          # NEW: Vectorize-powered search
│   ├── workers/
│   │   ├── ingestion.ts
│   │   ├── generator.ts
│   │   ├── optimizer.ts
│   │   └── email.ts           # NEW: Distribution
│   ├── durable-objects/
│   │   └── live-counter.ts    # NEW: Real-time aggregation
│   ├── lib/
│   │   ├── ai.ts
│   │   ├── vectorize.ts       # NEW: Embeddings
│   │   ├── auth.ts
│   │   └── rate-limit.ts
│   └── types/
│       └── index.ts
├── migrations/
│   └── 0001_schema.sql
├── wrangler.toml
├── package.json
└── tsconfig.json
```

---

## Verification Plan

```bash
npm install && npm run dev
npx wrangler d1 migrations apply best-of-africa-db
npx wrangler vectorize create best-of-africa-vectors --dimensions=768
npm run deploy
```
