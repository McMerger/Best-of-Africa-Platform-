# Best of Africa

> A premium pan-African media and intelligence platform functioning as a unified public relations and strategic narrative engine for the continent.

## Vision

"Best of Africa" strengthens Africa's image on the global stage by promoting—country by country—opportunities for **tourism**, **investment**, and **sustainable development** through an elegant, Guardian-inspired editorial interface.

Although it presents itself publicly as a **human-curated brand** to preserve authenticity and trust, at its core it is a **native artificial intelligence platform**: an autonomous backend that continuously collects, processes, and interprets data in real time to generate and refine articles, dashboards, and regional updates.

This internal **intelligence loop** allows the platform to:

- Identify and correct narrative gaps via the **Proactive Audit Scanner**
- Self-improve its editorial product via the **Human-in-the-Loop Feedback Loop**
- Transform knowledge into high-value strategic services through autonomous agent protocols

The platform serves **governments**, **investors**, and **institutional partners** seeking to leverage our reach, credibility, and intelligence—positioning itself not just as a media outlet, but as an **instrument of narrative diplomacy and market intelligence**.

---

## Platform Capabilities

### Autonomous Content Engine

- **Real-time data collection** from 50+ African news sources (RSS, NewsAPI)
- **Hybrid Agent Pipeline** - Decoupled queue-based generation using `automaton` and `nanobot` Python logic
- **AI-powered article generation** maintaining Guardian-style editorial voice and institutional tone
- **Continuous optimization** of format, headlines, and photorealistic R2-stored media
- **Narrative gap detection** and automatic content filling via autonomous audits

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
| AI (Generative) | Workers AI (Llama 3.1 70B & Stable Diffusion XL) |
| AI (Agentic) | `nanobot` (Python) + `openskills` orchestrated by `automaton` bridge |
| Semantic Search | Vectorize (BGE Base v1.5) |
| Job Queue | Cloudflare Queues + D1 Agent Tasks |
| Real-time | Durable Objects (Live Counters) |
| Analytics | Analytics Engine |
| Localization | LanguageContext (EN, PT, FR, AR, ZH, HI, DE) |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run Frontend
cd frontend && npm run dev

# Run Backend (Worker)
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Infrastructure & Governance

### 1. Contribution Workflow

The development process follows a strict branching and review model to ensure stability for institutional partners.

- **Primary Repo**: GitHub (Private)
- **Workflow**: See [Contribution Workflow](.gemini/antigravity/brain/7c4e9f4f-645c-4b04-8742-d65855e493e0/contribution_workflow.md)

### 2. Multi-Region Backup

To ensure narrative sovereignty and data persistence, the platform implements a daily cross-bucket and cross-jurisdictional backup strategy.

- **Strategy**: See [Multi-Region Backup Strategy](.gemini/antigravity/brain/7c4e9f4f-645c-4b04-8742-d65855e493e0/backup_strategy.md)

### 3. Security Hardening

- **Authentication**: JWT & Admin API Key enforcement on all management endpoints.
- **Dev Guards**: `X-Dev-Secret` required for all operational triggers.
- **Content Trust**: Integrated fact-checking and moderation pipeline.

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/articles` | List articles |
| GET | `/api/v1/articles/:slug` | Single article |
| GET | `/api/v1/countries` | All 54 African nations |
| GET | `/api/v1/market-intel/sectors` | All sector analyses |
| GET | `/api/v1/search?q=...` | Semantic search |

### Intelligence APIs (API Key Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/intel/country/:code/report` | Country intelligence report |
| GET | `/api/v1/intel/sector/:id/trends` | Sector trend analysis |
| GET | `/api/v1/market-intel/reports/:id` | Premium reports |

### Admin (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/api/v1/admin/articles` | Article management |
| POST | `/api/v1/admin/trigger/ingestion` | Manual ingestion trigger |
| POST | `/api/v1/admin/trigger/optimization` | Manual optimization trigger |
| POST | `/api/v1/audit/scan` | Trigger proactive content audit |
| POST | `/api/v1/self-improve/evolve` | Trigger agent instruction evolution |

---

## Scheduled Workers

| Schedule | Worker | Purpose |
|----------|--------|---------|
| Every 1 min | Ingestion | Collect news from 50+ Pan-African sources |
| Every 2 min | Optimization | Self-improve content, refresh dashboards |
| Daily 5am | Reporting | Generate daily intelligence summaries |

---

## License

Proprietary - Best of Africa (2026)
