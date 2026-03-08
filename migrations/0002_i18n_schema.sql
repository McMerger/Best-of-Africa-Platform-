-- Migration: 0002_i18n_schema.sql
-- 1. Editorial Audits (Migrated from SQLite)
CREATE TABLE IF NOT EXISTS article_audits (
    article_id TEXT PRIMARY KEY,
    country TEXT,
    topic TEXT,
    audit_report JSONB,
    variants JSONB,
    -- Stores localized variants: { "variant_tourist_en": "...", "variant_tourist_fr": "..." }
    translation_status JSONB DEFAULT '{}',
    -- Stores status: { "fr": "ready", "de": "pending" }
    metadata JSONB,
    confidence_score REAL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- 2. Translation Queue
CREATE TABLE IF NOT EXISTS translation_queue (
    id SERIAL PRIMARY KEY,
    article_id TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending, processing, completed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, target_lang)
);
-- 3. Usage Counters (Rate Limiting)
CREATE TABLE IF NOT EXISTS usage_counters (
    date DATE NOT NULL,
    service TEXT NOT NULL,
    -- 'translation', 'video_metadata'
    lang TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, service, lang)
);
-- 4. Update Videos Table (if not already compatible)
-- Ensure 'metadata' column exists and is JSONB
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'videos'
        AND column_name = 'metadata'
) THEN
ALTER TABLE videos
ADD COLUMN metadata JSONB DEFAULT '{}';
END IF;
END $$;