# Backend Integration Plan: "The Rational Upgrade"

**Version:** 2.0 (Alignment with "Rational Intelligence" Frontend)
**Target:** Match the "Industrial Luxury" UI with "Institutional Grade" Data.

---

## 1. Executive Summary: The Gap

The Frontend currently presents a **"Geopolitical Terminal"** experience (`Deep Financial Data`, `Generative Summaries`, `Biometric-style Auth`).
The Backend currently provides a **"Media Monitor"** experience (`Article Counts`, `View Stats`).

**Objective:** Upgrade the backend from "News Aggregation" to "Market Intelligence".

---

## 2. Database Schema Updates (SQL)

We must introduce financial and scoring rigidity to the database.

### A. Market Intelligence (The "Finance" Layer)

**Gap:** Frontend `PremiumSectorTrends` page expects hard financial data, not just news volume.

```sql
-- [NEW] Market Metrics Table
CREATE TABLE market_metrics (
    id TEXT PRIMARY KEY, -- metric_sector_year (e.g., "energy_2026")
    sector_id TEXT REFERENCES sectors(id),
    year INTEGER NOT NULL,
    market_size_usd BIGINT,      -- Frontend: "market_size"
    growth_rate DECIMAL(5,2),    -- Frontend: "growth_rate"
    investment_volume_usd BIGINT, -- Frontend: "investment_volume"
    regulatory_outlook TEXT,     -- Frontend: "regulatory_outlook" (Enum: Positive, Stable, Volatile)
    top_companies_json TEXT,     -- JSON Array of names
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### B. Country Scoring (The "Intelligence" Layer)

**Gap:** Frontend `CountryOutlook` displays calculated scores like "Investment Readiness" and "Narrative Strength".

```sql
-- [NEW] Country Scores Table (Historical Tracking)
CREATE TABLE country_scores (
    id TEXT PRIMARY KEY, -- iso_date (e.g., "ng_2026-01-12")
    country_code TEXT REFERENCES countries(code),
    date DATE NOT NULL,
    diplomacy_score INTEGER,      -- 0-100
    investment_readiness INTEGER, -- 0-100
    security_rating INTEGER,      -- 0-100 (The "Stability Index")
    narrative_control INTEGER,    -- 0-100 (The "Media Alignment" Score)
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### C. Authentication (The "Security" Layer)

**Gap:** Frontend simulates "Biometric Scan". Backend needs real secure tokens.

```sql
-- [NEW] API Keys / Users
CREATE TABLE api_clients (
    id TEXT PRIMARY KEY,
    org_name TEXT,
    tier TEXT DEFAULT 'basic', -- basic, premium, sovereign
    api_key_hash TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. API Specification Updates

### A. Search & Briefings (`Briefing Mode`)

**Endpoint:** `GET /api/v1/search`
**Upgrade:** Implement **RAG (Retrieval Augmented Generation)** using Workers AI.

* **Current:** Returns list of articles.
* **New Field:** `summary` (string) - A 2-sentence synthesis of the top 5 results.
* **Logic:**
    1. Vector Search -> Top 5 Articles.
    2. Prompt Llama-3: *"Summarize the investment outlook for [Query] based on these 5 briefs: [...]"*
    3. Return generated text.

### B. Sector Trends

**Endpoint:** `GET /api/v1/intel/sector/:id/trends`
**Upgrade:** Join with `market_metrics` table.

* **Current:** Returns `{ monthly_trend: [{ count: 10 }] }`
* **New Response:**

```json
{
  "sector": { ... },
  "trends": [
    {
      "year": 2025,
      "market_size": 45000000000,
      "growth_rate": 5.2,
      "investment_volume": 1200000000,
      "regulatory_outlook": "Stable"
    }
  ],
  "top_companies": ["Dangote", "MTN", "Axios"]
}
```

### C. Authentication

**Endpoint:** `POST /api/v1/auth/login` (NEW)
**Request:** `{ "client_id": "...", "secret": "..." }`
**Response:** `{ "token": "jwt_...", "tier": "premium", "access_level": "High" }`
**Frontend Impact:** Update `LoginPage.tsx` to replace `setTimeout` mock with this real call.

### D. Real-Time Security Feed

**Endpoint:** `GET /api/v1/live/stream` (WebSocket)
**Function:** Powers the "Live" green dots and "Platform Status" indicators.

* **Logic:** Connect to `LiveCounter` Durable Object.
* **Events:** `{"type": "visitor_count", "count": 142}`, `{"type": "threat_level", "level": "LOW"}`

---

## 4. Implementation Checklist

### Phase 1: Foundation (Schema & Auth)

* [x] Run SQL migration for `market_metrics` and `country_scores`.
* [x] Create `auth.ts` router with robust JWT issuance.
* [x] Update `LoginPage.tsx` to consume real auth.

### Phase 2: Intelligence (AI & Finance)

* [x] Implement `Workers AI` binding in `search.ts`.
* [x] Update `market-intel.ts` to fetch from new `market_metrics` table.
* [x] Write a script to seed initial financial data (mock or researched).

### Phase 3: Real-Time (WebSockets)

* [x] Expose `LiveCounter` DO via WebSocket upgrade endpoint.

* [ ] Connect `NavBar` "Live" indicator to WS feed.
