import type { Article, ArticleListItem, CalendarEvent, Country, CountryStats, Dashboard, PaginatedResponse, SearchResult, Sector, SectorBreakdown, TrendingCountry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

// Session helper
const getSessionId = () => {
    let id = localStorage.getItem('boa_session');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('boa_session', id);
    }
    return id;
};

// Auth token helper
const getAuthToken = () => localStorage.getItem('boa_auth_token');

// Request helper
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId(),
        ...((options.headers as Record<string, string>) || {}),
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Articles
    getArticles: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return request<PaginatedResponse<ArticleListItem>>(`/articles?${searchParams}`);
    },
    getArticle: (slug: string) => request<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] }>(`/articles/${slug}`),
    getFeaturedArticles: () => request<{ data: ArticleListItem[] }>('/articles/featured'),
    getLatestArticles: () => request<{ data: ArticleListItem[] }>('/articles/latest'),
    getEvents: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return request<{ success: boolean; data: CalendarEvent[] }>(`/events?${searchParams}`);
    },

    // Countries
    getCountries: () => request<{ data: Country[]; by_region: Record<string, { countries: Country[]; ai_insight: string }> }>('/countries'),
    getPlatformStats: () => request<{ total_countries: number; total_articles: number; total_views: number; regions: number }>('/countries/stats'),
    getCountry: (code: string) => request<{ country: Country; stats: CountryStats }>(`/countries/${code}`),

    // Dashboards
    getDashboards: () => request<{ data: Dashboard[] }>('/dashboards'),
    getRegionDashboard: (region: string) => request<{
        dashboard: Dashboard;
        featured_articles: ArticleListItem[];
        trending_countries: TrendingCountry[];
        sector_breakdown: SectorBreakdown[]
    }>(`/dashboards/${region}`),
    getContinentalOverview: () => request<{
        overview: {
            total_articles_30d: number;
            countries_covered: number;
            regions: number;
        };
        by_region: { name: string; count: number }[];
        top_countries: { code: string; name: string; flag_emoji: string; articles: number; views: number }[];
        top_sectors: { id: string; name: string; icon: string; count: number }[];
        highlights: ArticleListItem[];
    }>('/dashboards/continental/overview'),

    // Search
    search: (query: string) => request<{ results: SearchResult[]; suggestions: string[]; ai_answer?: string }>(`/search?q=${encodeURIComponent(query)}`),
    autocomplete: (query: string) => request<{ suggestions: { text: string; type: string }[] }>(`/search/suggest?q=${encodeURIComponent(query)}`),

    // Intelligence
    getSectors: () => request<{ data: Sector[] }>('/market-intel/sectors'),
    getSector: (id: string) => request<{
        sector: Sector;
        by_country: { code: string; name: string; flag_emoji: string; count: number }[];
        by_region: { name: string; count: number; views: number }[];
        recent_articles: ArticleListItem[];
        top_performers: ArticleListItem[];
    }>(`/market-intel/sector/${id}`),
    getCountryOutlook: (code: string) => request<{
        country: Country;
        outlook: {
            investment_readiness: number;
            narrative_strength: number;
            media_presence: number;
            engagement_level: number;
        };
        sector_opportunities: { id: string; name: string; articles: number; avg_engagement: number }[];
    }>(`/market-intel/country/${code}/outlook`),
    getCountryRelationships: (code: string) => request<{
        country_code: string;
        country_name: string;
        relationships: { partner: string; type: string; context: string }[];
        updated_at: string;
    }>(`/countries/${code}/relationships`),
    getNarratives: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return request<{
            data: {
                id: string;
                country_code: string;
                sector_id: string;
                narrative_theme: string;
                key_messages: string[];
                target_audience: string;
                priority: number;
                tone: string;
            }[]
        }>(`/narratives?${searchParams}`);
    },
    getCountryNarrative: (code: string) => request<{
        country: Country;
        narratives: {
            id: string;
            country_code: string;
            sector_id: string;
            narrative_theme: string;
            key_messages: string[];
            target_audience: string;
            priority: number;
            tone: string;
        }[];
        aligned_articles: ArticleListItem[];
        sector_coverage: { id: string; name: string; article_count: number; }[];
    }>(`/narratives/country/${code}`),
    getReports: () => request<{ data: ArticleListItem[] }>('/market-intel/reports'),
    getGeneratedReports: () => request<{ data: ArticleListItem[] }>('/market-intel/generated-reports'),
    getGeneratedReport: (id: string) => request<{ report: Article; related: ArticleListItem[] }>(`/market-intel/generated-reports/${id}`),
    getReportsBySector: (sectorId: string) => request<{ data: ArticleListItem[] }>(`/market-intel/reports/sector/${sectorId}`),
    getReport: (id: string) => request<{ report: Article; related: ArticleListItem[] }>(`/market-intel/reports/${id}`),
    getAudienceInsights: () => request<{
        demographics: { age_group: string; percentage: number }[];
        regions: { name: string; percentage: number }[];
        interests: { topic: string; score: number }[];
        engagement_trends: { date: string; views: number }[];
    }>('/intel/audience'),

    // Analyst Lens (Real-time AI Rewriting)
    reframeArticle: (articleId: string, targetAudience: 'investor' | 'government' | 'explorer') =>
        request<{ content: string; audience: string }>('/intel/reframe', {
            method: 'POST',
            body: JSON.stringify({ articleId, targetAudience })
        }),
    reformatArticle: (articleId: string, format: 'long-form' | 'summary' | 'bullet' | 'brief') =>
        request<{ content: string; format: string }>('/intel/reformat', {
            method: 'POST',
            body: JSON.stringify({ articleId, format })
        }),

    // Unified Intelligence Briefing (3-Lens)
    getUnifiedBriefing: (articleId: string) =>
        request<{
            article_id: string;
            title: string;
            briefing: {
                investor: { summary: string; verdict: string; classification: string; margin_of_safety: string };
                government: { summary: string; verdict: string; classification: string; development_impact: string };
                explorer: { summary: string; verdict: string; classification: string; signature_experience: string };
            };
        }>('/intel/synthesize-unified', {
            method: 'POST',
            body: JSON.stringify({ articleId })
        }),

    getPremiumCountryReport: (code: string) => request<{
        country: Country;
        article_count: number;
        top_sectors: { sector: Sector; count: number }[];
        recent_articles: ArticleListItem[];
        sentiment_score: number;
        investment_readiness_score: number;
        tourism_appeal_score: number;
        narrative_gaps: string[];
        recommendations: string[];
    }>(`/intel/country/${code}/report`),
    getSectorTrends: (id: string) => request<{
        sector: Sector;
        trends: {
            year: number;
            market_size: number;
            growth_rate: number;
            investment_volume: number;
            regulatory_outlook: string;
        }[];
        top_companies: string[];
        summary: {
            latest_year: number | null;
            current_market_size: number | null;
            current_growth_rate: number | null;
            yoy_change: number | null;
            regulatory_outlook: string;
        };
    }>(`/market-intel/sector/${id}/trends`),

    // Personalization
    getRecommendations: () => request<{ data: ArticleListItem[]; based_on?: { countries: string[]; sectors: string[] } }>('/personalization/recommended'),
    getPreferences: () => request<{
        countries_of_interest: string[];
        sectors_of_interest: string[];
        language_preference: string;
        format_preference: string;
    }>('/personalization/preferences'),
    savePreferences: (prefs: {
        countries_of_interest: string[];
        sectors_of_interest: string[];
        language_preference: string;
        format_preference: string;
    }) => request('/personalization/preferences', {
        method: 'POST',
        body: JSON.stringify(prefs),
    }),

    // Analytics
    getSectorPerformance: (lens?: 'investor' | 'government' | 'explorer') => request<{
        data: { sector_id: string; sector_name: string; growth_yoy: number; volatility: string; article_count: number; ai_insight?: string }[];
        updated_at: string;
    }>(`/market-intel/performance${lens ? `?lens=${lens}` : ''}`),

    getLeadingSector: () => request<{
        name: string;
        growth: number;
        trend: string;
        updated_at: string;
    }>('/market-intel/leading-sector'),

    getSentimentDivergence: () => request<{
        average_divergence: number;
        countries: { country_code: string; country_name: string; reality_score: number; perception_score: number; gap: number }[];
        updated_at: string;
    }>('/market-intel/sentiment-divergence'),

    getPlatformAnalytics: (lens?: 'investor' | 'government' | 'explorer') => request<{
        market_summary: string;
        stability_index: string;
        stability_score: number;
        sentiment_pct: number;
        sentiment_trend: 'up' | 'down';
        sector_trends: { id: string; name: string; trend: string; article_count: number }[];
        total_articles_7d: number;
        updated_at: string;
    }>(`/dashboards/analytics/summary${lens ? `?lens=${lens}` : ''}`),

    getStrategicOpportunities: () => request<{
        data: {
            country_code: string;
            country_name: string;
            sector_id: string;
            sector_name: string;
            title: string;
            summary: string;
            score: number;
        }[]
    }>('/market-intel/opportunities'),

    getSectorVelocity: (sectorId: string) => request<{
        sector_id: string;
        cagr_5yr: number;
        deal_flow_usd: number;
        active_projects: number;
        updated_at: string;
    }>(`/market-intel/sector/${sectorId}/velocity`),

    getPlatformImpact: () => request<{
        total_fdi_usd: number;
        countries_covered: number;
        sectors_covered: number;
        total_reports: number;
        updated_at: string;
    }>('/dashboards/stats/platform-impact'),

    // 3D Visualization Data Feed ("The Brain")
    getIntelligence: () => request<{
        countries: { code: string; heat: number; sentiment: number; volume: number; last_activity: string }[];
        sectors: { sector_id: string; count: number; avg_sentiment: number }[];
        global_pulse: { articles_24h: number; rate_per_hour: number; intensity: number };
        sentiment_trend: { date: string; avg_sentiment: number; volume: number }[];
        generated_at: string;
    }>('/analytics/intelligence'),

    // Country Economics
    getCountryEconomics: (code: string) => request<{ gdp_growth: string; stability: string }>(`/countries/${code}/economics`),

    // Administrative Intelligence & Moderation
    getAdminArticles: () => request<{ data: ArticleListItem[] }>('/admin/articles'),
    rejectArticle: (id: string, reason: string) => request(`/admin/articles/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    }),
    updateArticleWithFeedback: (id: string, content: string, comment: string) => request(`/admin/articles/${id}/edit`, {
        method: 'POST',
        body: JSON.stringify({ content, comment })
    }),
    triggerAuditScan: () => request('/audit/scan', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('boa_admin_token')}` }
    }),
    triggerAgentEvolution: () => request('/self-improve/evolve', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('boa_admin_token')}` }
    }),
};
