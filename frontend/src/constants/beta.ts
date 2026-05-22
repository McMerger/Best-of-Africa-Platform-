/**
 * Shared constants for the beta section of the platform.
 * Single source of truth — import from here rather than duplicating inline.
 */

import type { ArticleListItem } from '../types';

// ─── External links ───────────────────────────────────────────────────────────

export const KO_FI_URL = 'https://ko-fi.com/boastory';

// ─── Country flag emoji map (all 54 African nations) ─────────────────────────

export const FLAG_MAP: Record<string, string> = {
  // North Africa
  DZ: '🇩🇿', EG: '🇪🇬', LY: '🇱🇾', MA: '🇲🇦', MR: '🇲🇷', SD: '🇸🇩', TN: '🇹🇳',
  // West Africa
  BJ: '🇧🇯', BF: '🇧🇫', CV: '🇨🇻', CI: '🇨🇮', GM: '🇬🇲', GH: '🇬🇭',
  GN: '🇬🇳', GW: '🇬🇼', LR: '🇱🇷', ML: '🇲🇱', NE: '🇳🇪', NG: '🇳🇬',
  SN: '🇸🇳', SL: '🇸🇱', TG: '🇹🇬',
  // East Africa
  BI: '🇧🇮', KM: '🇰🇲', DJ: '🇩🇯', ER: '🇪🇷', ET: '🇪🇹', KE: '🇰🇪',
  MG: '🇲🇬', MU: '🇲🇺', MW: '🇲🇼', MZ: '🇲🇿', RW: '🇷🇼', SC: '🇸🇨',
  SO: '🇸🇴', SS: '🇸🇸', TZ: '🇹🇿', UG: '🇺🇬',
  // Central Africa
  AO: '🇦🇴', CM: '🇨🇲', CF: '🇨🇫', TD: '🇹🇩', CD: '🇨🇩', CG: '🇨🇬',
  GQ: '🇬🇶', GA: '🇬🇦', ST: '🇸🇹',
  // Southern Africa
  BW: '🇧🇼', SZ: '🇸🇿', LS: '🇱🇸', NA: '🇳🇦', ZA: '🇿🇦', ZM: '🇿🇲', ZW: '🇿🇼',
};

// ─── Membership tiers (canonical source — used in BetaLanding + BetaMembership) ──

export interface MembershipTier {
  id: string;
  name: string;
  price: string;
  features: string[];
  ctaLabel: string;
  recommended?: boolean;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'supporter',
    name: 'Supporter',
    price: '$3',
    features: [
      'Unlimited access to stories and collections',
      'Access to selected newsletters and updates',
      'Invites to online conversations and AMAs',
    ],
    ctaLabel: 'Join as Supporter',
  },
  {
    id: 'founding',
    name: 'Founding Member',
    price: '$8',
    features: [
      'Everything in Supporter',
      'Full access to the beta platform',
      'Direct input on future coverage priorities',
    ],
    ctaLabel: 'Join as Founding Member',
    recommended: true,
  },
  {
    id: 'partner',
    name: 'Founding Patron',
    price: '$20',
    features: [
      'Everything in Founding Member',
      'Monthly executive Africa intelligence briefing',
      'Direct line to the editorial team',
    ],
    ctaLabel: 'Become a Founding Patron',
  },
];

export const TIER_LABELS: Record<string, { title: string; desc: string; perks: string[] }> = {
  // DB-stored values (basic / premium / enterprise)
  basic: {
    title: 'Supporter',
    desc: 'Unlimited access to stories and selected newsletters.',
    perks: [
      'Unlimited access to all published stories',
      'Selected newsletters and platform updates',
      'Invites to online conversations and AMAs',
    ],
  },
  premium: {
    title: 'Founding Member',
    desc: 'Full access to the beta platform and direct input on future priorities.',
    perks: [
      'Everything in Supporter',
      'Full beta platform access — country hubs and intelligence briefs',
      'Direct input on future coverage priorities',
      'Early access to all new features',
    ],
  },
  enterprise: {
    title: 'Founding Patron',
    desc: 'Monthly executive briefings and a direct line to the editorial team.',
    perks: [
      'Everything in Founding Member',
      'Monthly executive Africa intelligence briefing',
      'Direct line to the editorial team',
    ],
  },
  // Ko-fi tier name aliases (kept for backward compatibility)
  supporter: {
    title: 'Supporter',
    desc: 'Unlimited access to stories and selected newsletters.',
    perks: [
      'Unlimited access to all published stories',
      'Selected newsletters and platform updates',
      'Invites to online conversations and AMAs',
    ],
  },
  founding: {
    title: 'Founding Member',
    desc: 'Full access to the beta platform and direct input on future priorities.',
    perks: [
      'Everything in Supporter',
      'Full beta platform access — country hubs and intelligence briefs',
      'Direct input on future coverage priorities',
      'Early access to all new features',
    ],
  },
  partner: {
    title: 'Founding Patron',
    desc: 'Monthly executive briefings and a direct line to the editorial team.',
    perks: [
      'Everything in Founding Member',
      'Monthly executive Africa intelligence briefing',
      'Direct line to the editorial team',
    ],
  },
};

// ─── Empty fallback (used when API is unavailable) ───────────────────────────

export const FALLBACK_ARTICLES: ArticleListItem[] = [];
