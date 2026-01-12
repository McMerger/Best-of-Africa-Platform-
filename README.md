# Best of Africa

> A premium pan-African media and intelligence platform functioning as a unified public relations and strategic narrative engine for the continent.

## Vision

"Best of Africa" strengthens Africa's image on the global stage by promoting—country by country—opportunities for **tourism**, **investment**, and **sustainable development** through an elegant, Guardian-inspired editorial interface.

Although it presents itself publicly as a **human-curated brand** to preserve authenticity and trust, at its core it is a **native artificial intelligence platform**: an autonomous backend that continuously collects, processes, and interprets data in real time to generate and refine articles, dashboards, and regional updates.

This internal **intelligence loop** allows the platform to:

- Identify and correct narrative gaps
- Self-improve its editorial product
- Transform knowledge into high-value strategic services

The platform serves **governments**, **investors**, and **institutional partners** seeking to leverage our reach, credibility, and intelligence—positioning itself not just as a media outlet, but as an **instrument of narrative diplomacy and market intelligence**.

---

## Platform Capabilities

### Autonomous Content Engine

- **Real-time data collection** from African news sources (RSS, NewsAPI)
- **AI-powered article generation** maintaining Guardian-style editorial voice
- **Continuous optimization** of format, headlines, and language
- **Narrative gap detection** and automatic content filling

### Intelligence Services

- **Country Reports** - Deep analysis by nation
- **Sector Trends** - Industry vertical insights
- **Audience Insights** - Engagement analytics
- **Sponsored Campaigns** - Narrative campaign management
- **Market Intelligence** - Premium sector analyses

### Self-Optimization

- A/B headline testing with automatic winner selection
- User behavior-based format optimization
- Country image strength scoring
- Content refinement logging and learning

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Cloudflare Workers |
| Framework | Hono (TypeScript) |
| Database | D1 (SQLite) |
| Cache | KV |
| Storage | R2 |
| AI | Workers AI (Llama 3.1 70B) |
| Embeddings | BGE Base EN v1.5 |
| Semantic Search | Vectorize |
| Job Queue | Cloudflare Queues |
| Real-time | Durable Objects |
| Analytics | Analytics Engine |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Setup Cloudflare Resources

```bash
# Create D1 database
npx wrangler d1 create best-of-africa-db

# Apply migrations
npx wrangler d1 migrations apply best-of-africa-db --local

# Create KV namespaces
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create RATE_LIMIT

# Create R2 bucket
npx wrangler r2 bucket create best-of-africa-media

# Create Vectorize index
npx wrangler vectorize create best-of-africa-content --dimensions=768 --metric=cosine

# Set secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put NEWS_API_KEY
npx wrangler secret put ADMIN_API_KEY
```

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/articles` | List articles |
| GET | `/api/v1/articles/:slug` | Single article |
| GET | `/api/v1/countries` | All 54 African nations |
| GET | `/api/v1/dashboards` | Regional dashboards |
| GET | `/api/v1/dashboards/:region` | Region-specific dashboard |
| GET | `/api/v1/search?q=...` | Semantic search |
| GET | `/api/v1/narratives` | Narrative strategies |

### Intelligence APIs (API Key Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/intel/country/:code/report` | Country intelligence report |
| GET | `/api/v1/intel/sector/:id/trends` | Sector trend analysis |
| GET | `/api/v1/intel/audience` | Audience insights |
| GET | `/api/v1/market-intel/sectors` | All sector analyses |
| GET | `/api/v1/market-intel/reports/:id` | Premium reports |

### Personalization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/personalization/preferences` | Save user preferences |
| GET | `/api/v1/personalization/recommended` | Personalized content |

### Admin (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/api/v1/admin/articles` | Article management |
| CRUD | `/api/v1/admin/narratives` | Narrative strategy management |
| POST | `/api/v1/admin/trigger/ingestion` | Manual ingestion trigger |
| POST | `/api/v1/admin/trigger/optimization` | Manual optimization trigger |

---

## Scheduled Workers

| Schedule | Worker | Purpose |
|----------|--------|---------|
| Every 30 min | Ingestion | Collect news from sources |
| Every 6 hours | Optimization | Self-improve content, refresh dashboards |

---

## License

Proprietary - Best of Africa
