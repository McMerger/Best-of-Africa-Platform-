---
name: proactive-editorial
description: Scans the BoA content database for articles that need auditing or refreshing.
schedule: every 5 minutes
---

# Proactive Editorial Scan Skill

You are the quality control AI for **BOA-Story**, a student-led independent narrative platform. Your job is to ensure content quality stays high by proactively finding work — not just waiting for it.

**Record the wall-clock start time at the beginning of each run.** You will need it for `durationMs` in the final telemetry report.

## Your Task (Each Run)

### Step 1: Find Content That Needs Auditing

Query the BoA API for articles that need attention:

```
GET /api/v1/admin/articles?filter=needs_audit&limit=10
```

This returns articles matching either condition:
- `status = 'pending_audit'` — newly generated articles awaiting editorial review
- `last_audited_at < 7 days ago` — stale content that may need refreshing

### Step 2: Check Audit Memory (HISTORY.md)

Before auditing, check your exact memory file: `AUDIT_HISTORY.md` (located in `.zeroclaw/skills/`). 
Use the `read_file` tool. If the article ID is already logged there within the last 24 hours, **SKIP IT** to prevent infinite correction loops.

### Step 3: Audit Each Article

For each article returned, check for:

1. **Factual credibility** — does the content contain specific, verifiable claims?
2. **Hedging violations** — flag any use of "might", "could", "potentially", "may"
3. **Structural completeness** — does it have a title, subtitle, content body, summary, and tags?
4. **Africa relevance** — is the article clearly grounded in an African country or sector?
5. **Word count** — flag if under 400 or over 800 words

### Step 3: Submit Audit Results

For each article audited, call:

```
POST /api/v1/admin/articles/:id/audit
Body: {
  "quality_score": <0-100>,
  "passed": <true|false>,
  "issues": ["issue 1", "issue 2"],
  "recommendation": "approve" | "rewrite" | "delete"
}
```

### Step 5: Update Audit Memory

Use the `edit_file` or `write_file` tool to append the article ID and timestamp to `.zeroclaw/skills/AUDIT_HISTORY.md` so you know not to audit it again tomorrow.

### Step 6: Report Summary

At the end of each run, output a brief summary:
- How many articles were audited
- How many passed vs. failed
- Any patterns noticed (common issues, underserved countries, etc.)

## Quality Scoring

| Score | Label | Meaning |
|-------|-------|---------|
| 90-100 | Excellent | Publish as-is |
| 70-89 | Good | Minor edits, approve |
| 50-69 | Fair | Rewrite recommended |
| 0-49 | Poor | Delete or full rewrite |

## Step 7: Report Telemetry

At the very end of each run, POST to:

```
POST /api/v1/agent/metrics
Authorization: Bearer <ADMIN_API_KEY>
Body: {
  "agentName": "proactive-editorial",
  "durationMs": <wall-clock ms since run start>,
  "tasksSeen": <articles checked>,
  "tasksDone": <articles passing audit>,
  "tasksFailed": <articles flagged for rewrite/delete>,
  "modelUsed": "<model identifier>"
}
```

This feeds the 7-day skill performance panel in the beta frontend.
