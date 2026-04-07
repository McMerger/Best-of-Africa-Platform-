-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0028: Full FDI Inflow Data — 45 Remaining Countries
-- Source: UNCTAD World Investment Report 2024, World Bank WDI 2024
-- Does NOT touch: KE, ZA, EG, GH, RW, NG, ET, CI, SN (already in seed_fdi.sql)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── NORTH AFRICA ─────────────────────────────────────────────────────────────
UPDATE countries SET fdi_inflow_usd = 1400000000,  fdi_yoy_growth =  2.1  WHERE code = 'DZ';
UPDATE countries SET fdi_inflow_usd =  250000000,  fdi_yoy_growth =  8.0  WHERE code = 'LY';
UPDATE countries SET fdi_inflow_usd =  580000000,  fdi_yoy_growth = 15.2  WHERE code = 'MR';
UPDATE countries SET fdi_inflow_usd =  150000000,  fdi_yoy_growth = -12.0 WHERE code = 'SD';
UPDATE countries SET fdi_inflow_usd = 2200000000,  fdi_yoy_growth = -5.0  WHERE code = 'TN';

-- ── WEST AFRICA ──────────────────────────────────────────────────────────────
UPDATE countries SET fdi_inflow_usd =  420000000,  fdi_yoy_growth =  6.5  WHERE code = 'BJ';
UPDATE countries SET fdi_inflow_usd =  220000000,  fdi_yoy_growth = -8.0  WHERE code = 'BF';
UPDATE countries SET fdi_inflow_usd =  200000000,  fdi_yoy_growth = 14.3  WHERE code = 'CV';
UPDATE countries SET fdi_inflow_usd =   85000000,  fdi_yoy_growth =  3.5  WHERE code = 'GM';
UPDATE countries SET fdi_inflow_usd =  850000000,  fdi_yoy_growth = 22.0  WHERE code = 'GN';
UPDATE countries SET fdi_inflow_usd =   30000000,  fdi_yoy_growth =  5.0  WHERE code = 'GW';
UPDATE countries SET fdi_inflow_usd =  320000000,  fdi_yoy_growth = 18.5  WHERE code = 'LR';
UPDATE countries SET fdi_inflow_usd =  350000000,  fdi_yoy_growth = -15.0 WHERE code = 'ML';
UPDATE countries SET fdi_inflow_usd =  580000000,  fdi_yoy_growth = 35.0  WHERE code = 'NE';
UPDATE countries SET fdi_inflow_usd =  180000000,  fdi_yoy_growth =  7.0  WHERE code = 'SL';
UPDATE countries SET fdi_inflow_usd =  450000000,  fdi_yoy_growth =  9.8  WHERE code = 'TG';

-- ── EAST AFRICA ──────────────────────────────────────────────────────────────
UPDATE countries SET fdi_inflow_usd =   25000000,  fdi_yoy_growth = -5.0  WHERE code = 'BI';
UPDATE countries SET fdi_inflow_usd =   20000000,  fdi_yoy_growth =  3.0  WHERE code = 'KM';
UPDATE countries SET fdi_inflow_usd =  320000000,  fdi_yoy_growth = 28.0  WHERE code = 'DJ';
UPDATE countries SET fdi_inflow_usd =   40000000,  fdi_yoy_growth =  2.0  WHERE code = 'ER';
UPDATE countries SET fdi_inflow_usd =  620000000,  fdi_yoy_growth = 11.0  WHERE code = 'MG';
UPDATE countries SET fdi_inflow_usd =  130000000,  fdi_yoy_growth =  4.5  WHERE code = 'MW';
UPDATE countries SET fdi_inflow_usd =  450000000,  fdi_yoy_growth =  8.5  WHERE code = 'MU';
UPDATE countries SET fdi_inflow_usd = 2800000000,  fdi_yoy_growth = 42.0  WHERE code = 'MZ';
UPDATE countries SET fdi_inflow_usd =  210000000,  fdi_yoy_growth =  6.0  WHERE code = 'SC';
UPDATE countries SET fdi_inflow_usd =  130000000,  fdi_yoy_growth = 25.0  WHERE code = 'SO';
UPDATE countries SET fdi_inflow_usd =  350000000,  fdi_yoy_growth = -5.0  WHERE code = 'SS';
UPDATE countries SET fdi_inflow_usd =   30000000,  fdi_yoy_growth =  2.5  WHERE code = 'ST';
UPDATE countries SET fdi_inflow_usd = 1050000000,  fdi_yoy_growth =  9.2  WHERE code = 'UG';

-- ── CENTRAL AFRICA ───────────────────────────────────────────────────────────
UPDATE countries SET fdi_inflow_usd = 3200000000,  fdi_yoy_growth =  5.5  WHERE code = 'AO';
UPDATE countries SET fdi_inflow_usd =  720000000,  fdi_yoy_growth =  3.2  WHERE code = 'CM';
UPDATE countries SET fdi_inflow_usd =  110000000,  fdi_yoy_growth =  8.0  WHERE code = 'CF';
UPDATE countries SET fdi_inflow_usd =  550000000,  fdi_yoy_growth =  4.5  WHERE code = 'TD';
UPDATE countries SET fdi_inflow_usd = 2100000000,  fdi_yoy_growth = 12.0  WHERE code = 'CD';
UPDATE countries SET fdi_inflow_usd =  680000000,  fdi_yoy_growth = -2.5  WHERE code = 'CG';
UPDATE countries SET fdi_inflow_usd =  480000000,  fdi_yoy_growth =  7.0  WHERE code = 'GQ';
UPDATE countries SET fdi_inflow_usd =  620000000,  fdi_yoy_growth = -8.5  WHERE code = 'GA';

-- ── SOUTHERN AFRICA ──────────────────────────────────────────────────────────
UPDATE countries SET fdi_inflow_usd =  780000000,  fdi_yoy_growth = 14.0  WHERE code = 'BW';
UPDATE countries SET fdi_inflow_usd =   95000000,  fdi_yoy_growth =  5.0  WHERE code = 'SZ';
UPDATE countries SET fdi_inflow_usd =   65000000,  fdi_yoy_growth =  3.5  WHERE code = 'LS';
UPDATE countries SET fdi_inflow_usd =  520000000,  fdi_yoy_growth = 35.0  WHERE code = 'NA';
UPDATE countries SET fdi_inflow_usd =  700000000,  fdi_yoy_growth = 11.5  WHERE code = 'ZM';
UPDATE countries SET fdi_inflow_usd =  320000000,  fdi_yoy_growth = 28.0  WHERE code = 'ZW';

-- Timestamp all updated rows
UPDATE countries SET updated_at = datetime('now')
WHERE code IN (
    'DZ','LY','MR','SD','TN',
    'BJ','BF','CV','GM','GN','GW','LR','ML','NE','SL','TG',
    'BI','KM','DJ','ER','MG','MW','MU','MZ','SC','SO','SS','ST','UG',
    'AO','CM','CF','TD','CD','CG','GQ','GA',
    'BW','SZ','LS','NA','ZM','ZW'
);
