// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY: World Cup event theme
// Contextual, seasonal theming in the spirit of Google's event treatments —
// a subtle, on-brand celebration of African nations at the World Cup.
//
// ⚠️ This is TEMPORARY. To remove the entire theme in one line when the
//    tournament ends, set `enabled: false` below (or delete this file + the
//    <WorldCupBanner/> usage in Layout.tsx).
//
// As African teams are eliminated, trim the `teams` list to reflect who is
// "still involved", the banner renders straight from this array.
// ─────────────────────────────────────────────────────────────────────────────

export interface WorldCupTeam {
  name: string;
  flag: string;
  code: string;
}

/** The next scheduled fixture involving an African nation (from the live feed). */
export interface WorldCupFixture {
  utcDate: string;
  stage?: string;
  home: { name: string; code?: string };
  away: { name: string; code?: string };
}

export const WORLD_CUP: { enabled: boolean; label: string; teams: WorldCupTeam[] } = {
  enabled: true,
  label: 'FIFA World Cup 2026',
  // African nations still in the tournament, EDIT as the bracket changes.
  teams: [
    { name: 'Morocco', flag: '🇲🇦', code: 'MA' },
    { name: 'Senegal', flag: '🇸🇳', code: 'SN' },
    { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
    { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
    { name: 'Algeria', flag: '🇩🇿', code: 'DZ' },
    { name: 'Ghana', flag: '🇬🇭', code: 'GH' },
    { name: 'Tunisia', flag: '🇹🇳', code: 'TN' },
    { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'CI' },
    { name: 'Cameroon', flag: '🇨🇲', code: 'CM' },
    { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
  ],
};
