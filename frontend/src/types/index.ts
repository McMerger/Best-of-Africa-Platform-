export interface Country {
    code: string;
    name: string;
    region: string;
    capital: string;
    population: number;
    gdp_usd: number;
    currency: string;
    languages: string[];
    description: string;
    investment_highlights: string[];
    tourism_highlights: string[];
    flag_emoji: string;
    hero_image_url: string;
    diplomacy_score: number;
    image_strength_score: number;
    fdi_inflow_usd?: number;
    fdi_yoy_growth?: number;
    key_narratives?: string;
    ai_situation_report?: string;
    visa_portal_url?: string;
    business_portal_url?: string;
    tourism_portal_url?: string;
    history_baobab_content?: string;
}

export interface Sector {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export interface Article {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    country_code: string;
    sector_id: string;
    tags: string[];
    hero_image_url: string;
    reading_time_minutes: number;
    view_count: number;
    engagement_score: number;
    published_at: string;
    is_sponsored: boolean;
    ai_sentiment_score?: number;
    ai_sentiment_label?: string;
    ai_investor_brief?: string;
    ai_push_message?: string;
    ai_social_post?: string;
    refinement_count?: number;
    generation_prompt_version?: string;
    ai_headline_variants?: string;
    ai_video_url?: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    slug: string;
    date_start: string;
    date_end?: string;
    location: string;
    country_code: string;
    country_name?: string;
    category: string;
    status: string;
    is_featured: boolean;
    is_vip: boolean;
    description: string;
    registration_url?: string;
    registered_count?: number;
    ai_context_brief?: string;
}

export interface ArticleListItem {
    id: string;
    slug: string;
    title: string;
    summary: string;
    country_code: string;
    country_name: string;
    country_flag: string;
    sector_id: string;
    sector_name: string;
    hero_image_url: string;
    ai_image_url?: string;
    ai_video_url?: string;
    reading_time_minutes: number;
    published_at: string;
    engagement_score?: number;
}

export interface Dashboard {
    id: string;
    region: string;
    title: string;
    summary: string;
    key_metrics: {
        articles_24h: number;
        total_views: number;
        trending_countries: string[];
        top_sectors: string[];
    };
    trending_topics: string[];
    featured_articles: string[];
    generated_at: string;
    ai_regional_insight?: string;
}

export interface CountryStats {
    article_count: number;
    risk_rating?: string;
    top_sectors: {
        sector: {
            name: string;
        };
        count: number;
        ai_sentiment_score?: number;
    }[];
}

export interface TrendingCountry {
    code: string;
    name: string;
    flag_emoji: string;
    article_count: number;
}

export interface SectorBreakdown {
    id: string;
    name: string;
    count: number;
    icon: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

export interface SearchResult {
    article: ArticleListItem;
    score: number;
    highlights: string[];
}

export interface PlatformAnalytics {
    market_summary: string;
    stability_index: string;
    stability_score: number;
    sentiment_pct: number;
    sentiment_trend: 'up' | 'down';
    sector_trends: { id: string; name: string; trend: string; article_count: number }[];
    total_articles_7d: number;
    updated_at: string;
}

export type IntelligenceLens = 'investor' | 'government' | 'explorer';

export type MissionRole = 'standard' | 'investor' | 'operator' | 'policy';
export type MissionFormat = 'brief' | 'deep' | 'audio';

export interface MissionState {
    role: MissionRole;
    focus: {
        countries: string[]; // ISO codes
        sectors: string[];   // Sector IDs
    };
    format: MissionFormat;
    isOpen: boolean;
}

export type LanguageCode = 'en' | 'fr' | 'de' | 'ar' | 'hi' | 'zh' | 'pt';

export const SUPPORTED_LANGUAGES: { code: LanguageCode; name: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
    { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
    { code: 'zh', name: '中文', dir: 'ltr' },
    { code: 'pt', name: 'Português', dir: 'ltr' },
];
