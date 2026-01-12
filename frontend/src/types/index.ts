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
    reading_time_minutes: number;
    published_at: string;
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
}

export interface CountryStats {
    article_count: number;
    top_sectors: {
        sector: {
            name: string;
        };
        count: number;
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
