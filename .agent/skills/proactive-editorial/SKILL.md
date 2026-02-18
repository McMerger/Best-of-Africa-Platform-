---
name: proactive-editorial
description: Scans the BoA content database for articles that need auditing or refreshing.
---

# Proactive Editorial Scan

This skill defines the logic for finding work.

## Purpose

To ensure the agent is not just reactive but actively looks for:

1. New content (`status = 'pending_audit'`)
2. Stale content (`last_audited_at < X days ago`)

## Usage

The `scanner.py` module provides a function `scan_for_pending_audits(db_path, limit=5)` that returns a list of article IDs and metadata.

## Integration

The Nanobot Agent should call this via a `Cron` job or a background loop in `boa_agent.py`.
