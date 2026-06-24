// ─────────────────────────────────────────────────────────────────────────────
// WORLD CUP — auto-updating list of African nations still in the tournament.
//
// A scheduled task refreshes this from a live sports feed (TheSportsDB, keyless)
// and caches it in KV. The public endpoint serves the cache; the UI renders from
// it and falls back to SEED_TEAMS if the feed is ever unavailable, so the banner
// never breaks. "Still in" = appears in upcoming fixtures (eliminated teams drop
// out of the schedule automatically).
// ─────────────────────────────────────────────────────────────────────────────

import type { Env } from '../types';

export interface WorldCupTeam { name: string; flag: string; code: string; }

const KV_KEY = 'world_cup:teams';
// TheSportsDB league id for the FIFA World Cup (overridable via env if needed).
const WC_LEAGUE_ID = '4429';

// Canonical African national teams (name variants → display/flag/code). Only
// these are ever surfaced, guaranteeing the banner stays African-only.
const AFRICAN_TEAMS: Record<string, WorldCupTeam> = {
  morocco: { name: 'Morocco', flag: '🇲🇦', code: 'MA' },
  senegal: { name: 'Senegal', flag: '🇸🇳', code: 'SN' },
  nigeria: { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
  egypt: { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
  algeria: { name: 'Algeria', flag: '🇩🇿', code: 'DZ' },
  ghana: { name: 'Ghana', flag: '🇬🇭', code: 'GH' },
  tunisia: { name: 'Tunisia', flag: '🇹🇳', code: 'TN' },
  'ivory coast': { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'CI' },
  "cote d'ivoire": { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'CI' },
  cameroon: { name: 'Cameroon', flag: '🇨🇲', code: 'CM' },
  'south africa': { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
  mali: { name: 'Mali', flag: '🇲🇱', code: 'ML' },
  'cape verde': { name: 'Cape Verde', flag: '🇨🇻', code: 'CV' },
  'cabo verde': { name: 'Cape Verde', flag: '🇨🇻', code: 'CV' },
  'burkina faso': { name: 'Burkina Faso', flag: '🇧🇫', code: 'BF' },
  'dr congo': { name: 'DR Congo', flag: '🇨🇩', code: 'CD' },
  'congo dr': { name: 'DR Congo', flag: '🇨🇩', code: 'CD' },
  guinea: { name: 'Guinea', flag: '🇬🇳', code: 'GN' },
  gabon: { name: 'Gabon', flag: '🇬🇦', code: 'GA' },
  angola: { name: 'Angola', flag: '🇦🇴', code: 'AO' },
  zambia: { name: 'Zambia', flag: '🇿🇲', code: 'ZM' },
  'equatorial guinea': { name: 'Equatorial Guinea', flag: '🇬🇶', code: 'GQ' },
};

// Fallback used only if the live feed has never populated the cache.
export const SEED_TEAMS: WorldCupTeam[] = [
  AFRICAN_TEAMS['morocco'], AFRICAN_TEAMS['senegal'], AFRICAN_TEAMS['nigeria'],
  AFRICAN_TEAMS['egypt'], AFRICAN_TEAMS['algeria'], AFRICAN_TEAMS['ghana'],
  AFRICAN_TEAMS['tunisia'], AFRICAN_TEAMS['ivory coast'], AFRICAN_TEAMS['cameroon'],
  AFRICAN_TEAMS['south africa'],
];

function matchAfrican(teamName: string): WorldCupTeam | null {
  const n = (teamName || '').toLowerCase().trim();
  if (AFRICAN_TEAMS[n]) return AFRICAN_TEAMS[n];
  for (const key in AFRICAN_TEAMS) {
    if (n.includes(key)) return AFRICAN_TEAMS[key];
  }
  return null;
}

/** Read the cached African teams still in (or the seed list if not yet populated). */
export async function getWorldCupTeams(env: Env): Promise<{ teams: WorldCupTeam[]; updatedAt: string | null }> {
  try {
    const raw = await env.CACHE.get(KV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { teams: WorldCupTeam[]; updatedAt: string };
      if (Array.isArray(parsed.teams) && parsed.teams.length > 0) return parsed;
    }
  } catch { /* fall through to seed */ }
  return { teams: SEED_TEAMS, updatedAt: null };
}

/**
 * Fetch upcoming World Cup fixtures from the live feed and cache the African
 * nations that still have matches scheduled. Never throws; on any failure it
 * simply leaves the existing cache untouched.
 */
export async function refreshWorldCupTeams(env: Env): Promise<void> {
  try {
    const found = new Map<string, WorldCupTeam>();
    const add = (name?: string | null) => { const t = name ? matchAfrican(name) : null; if (t) found.set(t.code, t); };

    const token = (env as Record<string, any>).FOOTBALL_DATA_TOKEN as string | undefined;

    if (token) {
      // Preferred: football-data.org (complete WC coverage). Scheduled matches =
      // teams still in. Free tier requires only a token.
      const r = await fetch('https://api.football-data.org/v4/competitions/WC/matches?status=SCHEDULED', {
        headers: { 'X-Auth-Token': token },
      });
      if (r.ok) {
        const d = await r.json() as { matches?: Array<{ homeTeam?: { name?: string }; awayTeam?: { name?: string } }> };
        for (const m of d.matches || []) { add(m.homeTeam?.name); add(m.awayTeam?.name); }
      }
    }

    // Fallback: TheSportsDB (keyless, but sparse) — full-season fixtures still ahead.
    if (found.size === 0) {
      const leagueId = (env as Record<string, any>).WC_LEAGUE_ID || WC_LEAGUE_ID;
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${leagueId}&s=2026`, {
        headers: { 'User-Agent': 'BestOfAfrica/1.0' },
      });
      if (res.ok) {
        const data = await res.json() as { events?: Array<{ strHomeTeam?: string; strAwayTeam?: string; dateEvent?: string }> | null };
        for (const ev of data.events || []) {
          if ((ev.dateEvent || '') >= today) { add(ev.strHomeTeam); add(ev.strAwayTeam); }
        }
      }
    }

    if (found.size === 0) return; // nothing reliable — keep last cache / seed, don't wipe

    const payload = JSON.stringify({ teams: Array.from(found.values()), updatedAt: new Date().toISOString() });
    await env.CACHE.put(KV_KEY, payload, { expirationTtl: 7 * 24 * 3600 });
  } catch (err) {
    console.error('[worldcup] refresh failed:', err);
  }
}
