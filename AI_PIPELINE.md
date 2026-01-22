# AI Content Pipeline Architecture

## Overview

The Best of Africa platform operates an **autonomous AI content engine** that continuously gathers, transforms, and publishes premium African business intelligence without requiring users to manage any API keys.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AUTONOMOUS CONTENT ENGINE                                │
│                      "The AI That Works While You Sleep"                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   38 RSS    │     │  Ingestion  │     │  Generator  │     │  Published  │
  │   Sources   │────▶│   Worker    │────▶│   Worker    │────▶│   Article   │
  │   (Free)    │     │  (30 min)   │     │  (Queue)    │     │   (D1)      │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
        │                    │                   │                   │
        │                    │                   │                   │
        ▼                    ▼                   ▼                   ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  NewsAPI    │     │   Full      │     │  Workers AI │     │  Vectorize  │
  │  (1 Key)    │     │   Scraper   │     │  LLM + EMB  │     │  (Semantic) │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Components

### 1. Ingestion Worker (`src/workers/ingestion.ts`)

**Trigger**: Cron every 30 minutes

**Sources (38 total)**:

- 8 General African news
- 4 Business/Investment
- 6 Technology/Startups
- 4 Energy/Mining
- 2 Agriculture
- 1 Tourism
- 13 Country-specific (NG, KE, ZA, EG, GH, RW, MA)

**Flow**:

1. Fetch RSS feeds and NewsAPI
2. Filter for Africa-related content
3. Scrape full article content if RSS summary is short (<500 chars)
4. Deduplicate against existing items
5. Queue for AI processing

### 2. Generator Worker (`src/workers/generator.ts`)

**Trigger**: Queue message `generate_article`

**AI Operations**:

1. **Identify Country** - Extracts ISO code from content
2. **Identify Sector** - Classifies into 8 sector categories
3. **Generate Article** - Rewrites as premium Guardian-style content
4. **Generate Embedding** - Creates vector for semantic search
5. **Index in Vectorize** - Stores for RAG queries

### 3. Optimizer Worker (`src/workers/optimizer.ts`)

**Trigger**: Cron every 6 hours

**Self-Improvement Functions**:

- A/B headline testing for low-engagement articles
- Automatic gap-filling for underrepresented countries/sectors
- Dashboard refresh for all regions
- Country image strength recalculation

---

## AI Models Used

| Model | Purpose | Provider |
|-------|---------|----------|
| `llama-3.1-70b-instruct` | Article generation, headlines | Workers AI |
| `bge-base-en-v1.5` | Embeddings for search | Workers AI |

---

## Centralized API Keys

All external API keys are managed server-side. Users never need credentials.

| Service | Env Variable | Required |
|---------|--------------|----------|
| NewsAPI | `NEWS_API_KEY` | Optional |
| Workers AI | Built-in | Automatic |
| Vectorize | Built-in | Automatic |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `sources` | Configured RSS/API sources |
| `ingested_items` | Raw fetched news items |
| `articles` | Published transformed articles |
| `headline_tests` | A/B test variants |
| `content_refinements` | AI self-improvement log |
| `dashboards` | Generated regional summaries |

---

## Deployment

### Cron Configuration (`wrangler.toml`)

```toml
[triggers]
crons = [
  "*/30 * * * *",  # Ingestion every 30 min
  "0 */6 * * *"    # Optimization every 6 hours
]
```

### Queue Configuration

```toml
[[queues.consumers]]
queue = "content-queue"
max_batch_size = 10
max_retries = 3
```

---

## Monitoring

### Content Generation Metrics

- Articles generated per day
- Queue depth and processing time
- Scraping success rate

### Quality Metrics

- Average engagement score
- A/B test win rate
- Coverage by country/sector
