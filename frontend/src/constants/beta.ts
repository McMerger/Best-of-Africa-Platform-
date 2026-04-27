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
    name: 'Partner',
    price: '$20',
    features: [
      'Everything in Founding Member',
      'Monthly executive Africa intelligence briefing',
      'Direct line to the editorial team',
    ],
    ctaLabel: 'Become a Partner',
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

// ─── Demo / fallback articles (shown when API is unavailable) ─────────────────

export const FALLBACK_ARTICLES: ArticleListItem[] = [
  {
    id: '1', slug: 'tech-talent-lagos',
    title: 'The Silent Exodus Reversing Course in Lagos',
    summary: "A new wave of deeply capitalized local funds is convincing Nigeria's diaspora engineers that building at home is no longer a compromise.",
    country_code: 'NG', country_name: 'Nigeria', country_flag: '🇳🇬',
    sector_id: 'technology', sector_name: 'Technology',
    hero_image_url: '', reading_time_minutes: 6, published_at: '',
  },
  {
    id: '2', slug: 'kigali-infrastructure',
    title: "Kigali's Blueprint for the Climate-Resilient City",
    summary: "While Western capitals debate policy, Rwanda is quietly executing a radical, ground-up redesign of urban mobility and green space.",
    country_code: 'RW', country_name: 'Rwanda', country_flag: '🇷🇼',
    sector_id: 'infrastructure', sector_name: 'Urban Development',
    hero_image_url: '', reading_time_minutes: 8, published_at: '',
  },
  {
    id: '3', slug: 'nairobi-clean-energy',
    title: 'The Geothermal Advantage Quietly Powering Nairobi',
    summary: 'How Kenya bypassed fossil fuel dependency to build a tech ecosystem running almost entirely on renewable power.',
    country_code: 'KE', country_name: 'Kenya', country_flag: '🇰🇪',
    sector_id: 'energy', sector_name: 'Energy',
    hero_image_url: '', reading_time_minutes: 7, published_at: '',
  },
  {
    id: '4', slug: 'accra-creative-economy',
    title: "Accra's Creative Export Economy is Maturing",
    summary: "Beyond the festivals and viral moments, Ghanaian artists are building the permanent infrastructure to own their global distribution.",
    country_code: 'GH', country_name: 'Ghana', country_flag: '🇬🇭',
    sector_id: 'culture', sector_name: 'Culture',
    hero_image_url: '', reading_time_minutes: 5, published_at: '',
  },
  {
    id: '5', slug: 'addis-aviation-dominance',
    title: 'How Addis Ababa Won the African Sky',
    summary: "The relentless operational discipline that turned a regional carrier into the continent's undisputed logistics heavyweight.",
    country_code: 'ET', country_name: 'Ethiopia', country_flag: '🇪🇹',
    sector_id: 'logistics', sector_name: 'Logistics',
    hero_image_url: '', reading_time_minutes: 9, published_at: '',
  },
  {
    id: '6', slug: 'cape-town-biotech',
    title: 'The Biotech Engineers Redefining Medicine at the Cape',
    summary: 'South African laboratories are shifting from manufacturing generic drugs to patenting breakthrough mRNA applications for the global market.',
    country_code: 'ZA', country_name: 'South Africa', country_flag: '🇿🇦',
    sector_id: 'healthcare', sector_name: 'Healthcare',
    hero_image_url: '', reading_time_minutes: 6, published_at: '',
  },
];
