-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0027: Full 54-Country Diplomacy & Investment Image Scores
-- Source: Mo Ibrahim Index 2023, EIU Democracy Index 2023, World Bank Governance
-- Does NOT touch: ZA, NG, KE, EG, MA, GH, RW, ET, TZ, SN (already seeded in 0005)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── NORTH AFRICA ─────────────────────────────────────────────────────────────
UPDATE countries SET diplomacy_score = 0.52, image_strength_score = 0.48 WHERE code = 'DZ';
UPDATE countries SET diplomacy_score = 0.22, image_strength_score = 0.18 WHERE code = 'LY';
UPDATE countries SET diplomacy_score = 0.45, image_strength_score = 0.42 WHERE code = 'MR';
UPDATE countries SET diplomacy_score = 0.25, image_strength_score = 0.20 WHERE code = 'SD';
UPDATE countries SET diplomacy_score = 0.66, image_strength_score = 0.70 WHERE code = 'TN';

-- ── WEST AFRICA ──────────────────────────────────────────────────────────────
UPDATE countries SET diplomacy_score = 0.55, image_strength_score = 0.58 WHERE code = 'BJ';
UPDATE countries SET diplomacy_score = 0.30, image_strength_score = 0.28 WHERE code = 'BF';
UPDATE countries SET diplomacy_score = 0.72, image_strength_score = 0.74 WHERE code = 'CV';
UPDATE countries SET diplomacy_score = 0.55, image_strength_score = 0.65 WHERE code = 'CI';
UPDATE countries SET diplomacy_score = 0.52, image_strength_score = 0.50 WHERE code = 'GM';
UPDATE countries SET diplomacy_score = 0.35, image_strength_score = 0.40 WHERE code = 'GN';
UPDATE countries SET diplomacy_score = 0.30, image_strength_score = 0.28 WHERE code = 'GW';
UPDATE countries SET diplomacy_score = 0.42, image_strength_score = 0.45 WHERE code = 'LR';
UPDATE countries SET diplomacy_score = 0.28, image_strength_score = 0.25 WHERE code = 'ML';
UPDATE countries SET diplomacy_score = 0.25, image_strength_score = 0.22 WHERE code = 'NE';
UPDATE countries SET diplomacy_score = 0.44, image_strength_score = 0.42 WHERE code = 'SL';
UPDATE countries SET diplomacy_score = 0.42, image_strength_score = 0.48 WHERE code = 'TG';

-- ── EAST AFRICA ──────────────────────────────────────────────────────────────
UPDATE countries SET diplomacy_score = 0.30, image_strength_score = 0.28 WHERE code = 'BI';
UPDATE countries SET diplomacy_score = 0.40, image_strength_score = 0.38 WHERE code = 'KM';
UPDATE countries SET diplomacy_score = 0.48, image_strength_score = 0.55 WHERE code = 'DJ';
UPDATE countries SET diplomacy_score = 0.18, image_strength_score = 0.15 WHERE code = 'ER';
UPDATE countries SET diplomacy_score = 0.40, image_strength_score = 0.48 WHERE code = 'MG';
UPDATE countries SET diplomacy_score = 0.50, image_strength_score = 0.45 WHERE code = 'MW';
UPDATE countries SET diplomacy_score = 0.78, image_strength_score = 0.84 WHERE code = 'MU';
UPDATE countries SET diplomacy_score = 0.44, image_strength_score = 0.50 WHERE code = 'MZ';
UPDATE countries SET diplomacy_score = 0.66, image_strength_score = 0.72 WHERE code = 'SC';
UPDATE countries SET diplomacy_score = 0.18, image_strength_score = 0.15 WHERE code = 'SO';
UPDATE countries SET diplomacy_score = 0.20, image_strength_score = 0.18 WHERE code = 'SS';
UPDATE countries SET diplomacy_score = 0.64, image_strength_score = 0.60 WHERE code = 'ST';
UPDATE countries SET diplomacy_score = 0.48, image_strength_score = 0.50 WHERE code = 'UG';

-- ── CENTRAL AFRICA ───────────────────────────────────────────────────────────
UPDATE countries SET diplomacy_score = 0.45, image_strength_score = 0.52 WHERE code = 'AO';
UPDATE countries SET diplomacy_score = 0.40, image_strength_score = 0.44 WHERE code = 'CM';
UPDATE countries SET diplomacy_score = 0.20, image_strength_score = 0.18 WHERE code = 'CF';
UPDATE countries SET diplomacy_score = 0.28, image_strength_score = 0.25 WHERE code = 'TD';
UPDATE countries SET diplomacy_score = 0.28, image_strength_score = 0.35 WHERE code = 'CD';
UPDATE countries SET diplomacy_score = 0.33, image_strength_score = 0.32 WHERE code = 'CG';
UPDATE countries SET diplomacy_score = 0.25, image_strength_score = 0.30 WHERE code = 'GQ';
UPDATE countries SET diplomacy_score = 0.38, image_strength_score = 0.44 WHERE code = 'GA';

-- ── SOUTHERN AFRICA ──────────────────────────────────────────────────────────
UPDATE countries SET diplomacy_score = 0.72, image_strength_score = 0.76 WHERE code = 'BW';
UPDATE countries SET diplomacy_score = 0.38, image_strength_score = 0.40 WHERE code = 'SZ';
UPDATE countries SET diplomacy_score = 0.50, image_strength_score = 0.48 WHERE code = 'LS';
UPDATE countries SET diplomacy_score = 0.66, image_strength_score = 0.70 WHERE code = 'NA';
UPDATE countries SET diplomacy_score = 0.56, image_strength_score = 0.58 WHERE code = 'ZM';
UPDATE countries SET diplomacy_score = 0.36, image_strength_score = 0.40 WHERE code = 'ZW';

-- Timestamp all updated rows
UPDATE countries SET updated_at = datetime('now')
WHERE code IN (
    'DZ','LY','MR','SD','TN',
    'BJ','BF','CV','CI','GM','GN','GW','LR','ML','NE','SL','TG',
    'BI','KM','DJ','ER','MG','MW','MU','MZ','SC','SO','SS','ST','UG',
    'AO','CM','CF','TD','CD','CG','GQ','GA',
    'BW','SZ','LS','NA','ZM','ZW'
);
