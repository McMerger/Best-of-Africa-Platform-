import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Filter, ChevronRight } from 'lucide-react';
import type { Country } from '../types';

interface SentimentData {
    average_divergence: number;
    countries: { country_code: string; country_name: string; reality_score: number; perception_score: number; gap: number }[];
}

interface NarrativeStrategy {
    id: string;
    country_code: string;
    sector_id: string;
    narrative_theme: string;
    key_messages: string[];
    target_audience: string;
    priority: number;
    tone: string;
}

export const NarrativesPage: React.FC = () => {
    const [narratives, setNarratives] = useState<NarrativeStrategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters
    const [countries, setCountries] = useState<Country[]>([]);
    const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
    const [selectedAudience, setSelectedAudience] = useState(searchParams.get('audience') || '');
    const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
    const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') || '');
    const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);

    useEffect(() => {
        api.getCountries().then(res => setCountries(res.data)).catch(console.error);
        api.getSectors().then(res => setSectors(res.data)).catch(console.error);
        api.getSentimentDivergence().then(data => setSentimentData(data)).catch(console.error);
    }, []);

    useEffect(() => {
        const fetchNarratives = async () => {
            setLoading(true);
            const filters: Record<string, string> = {};
            if (selectedAudience) filters.audience = selectedAudience;
            if (selectedCountry) filters.country = selectedCountry;
            if (selectedSector) filters.sector = selectedSector;

            try {
                const res = await api.getNarratives(filters);
                setNarratives(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchNarratives();

        // Update URL
        const params: Record<string, string> = {};
        if (selectedAudience) params.audience = selectedAudience;
        if (selectedCountry) params.country = selectedCountry;
        if (selectedSector) params.sector = selectedSector;
        setSearchParams(params);
    }, [selectedAudience, selectedCountry, selectedSector, setSearchParams]);

    // Group narratives by audience for the "Board View"
    const swimlanes = {
        investor: narratives.filter(n => n.target_audience === 'investor'),
        partner: narratives.filter(n => n.target_audience === 'partner'),
        media: narratives.filter(n => n.target_audience === 'media'),
        tourist: narratives.filter(n => n.target_audience === 'tourist')
    };

    const isFiltered = selectedAudience || selectedCountry || selectedSector;

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '1400px' }}>
                <header style={{ marginBottom: '50px', borderBottom: '1px solid #e5e7eb', paddingBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#C70000', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#C70000', borderRadius: '50%' }}></div>
                                Strategic Operations
                            </div>
                            <h1 style={{ fontSize: '42px', fontWeight: 700, margin: 0, lineHeight: '1' }}>Narrative Strategy Board</h1>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Active Campaigns</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: '#052962', lineHeight: '1' }}>{narratives.length}</div>
                        </div>
                    </div>

                    {/* Narrative Divergence Index */}
                    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '8px', padding: '30px', color: 'white', marginBottom: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                    <span style={{ fontSize: '20px' }}>⚡</span> Sentiment Divergence Index
                                </h2>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px', maxWidth: '500px' }}>
                                    Visualizing the arbitrage gap between <strong style={{ color: '#fff' }}>Market Reality</strong> (Fundamentals) and <strong style={{ color: '#fff' }}>Global Perception</strong> (Sentiment). High divergence signals strategic opportunity.
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Avg. Divergence</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{sentimentData?.average_divergence || 0}%</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
                            {(sentimentData?.countries.slice(0, 3) || []).map((item) => ({
                                country: item.country_name,
                                reality: item.reality_score,
                                sentiment: item.perception_score,
                                gap: item.gap
                            })).map((item) => (
                                <div key={item.country}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>
                                        <span>{item.country}</span>
                                        <span style={{ color: '#f59e0b' }}>Gap: -{item.gap}%</span>
                                    </div>
                                    <div style={{ position: 'relative', height: '30px' }}>
                                        {/* Reality Bar (Background) */}
                                        <div style={{ position: 'absolute', top: '8px', left: 0, width: '100%', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '7px' }}></div>

                                        {/* Reality Marker */}
                                        <div style={{ position: 'absolute', top: '8px', left: 0, width: `${item.reality}%`, height: '14px', background: '#3b82f6', borderRadius: '7px', zIndex: 1 }}></div>
                                        <div style={{ position: 'absolute', top: '-18px', left: `${item.reality}%`, transform: 'translateX(-50%)', fontSize: '10px', color: '#3b82f6', fontWeight: 700 }}>REALITY</div>

                                        {/* Sentiment Marker */}
                                        <div style={{ position: 'absolute', top: '10px', left: 0, width: `${item.sentiment}%`, height: '10px', background: '#f59e0b', borderRadius: '5px', zIndex: 2 }}></div>
                                        <div style={{ position: 'absolute', top: '24px', left: `${item.sentiment}%`, transform: 'translateX(-50%)', fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>SENTMENT</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Filters Bar - "Control Panel" Style */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '40px', display: 'flex', gap: '20px', alignItems: 'center', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase' }}>
                        <Filter size={16} /> Strategy Filter:
                    </div>
                    <select
                        value={selectedAudience}
                        onChange={(e) => setSelectedAudience(e.target.value)}
                        style={{ background: '#334155', color: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid #475569', minWidth: '140px', fontSize: '14px' }}
                    >
                        <option value="">All Vectors</option>
                        <option value="investor">Investors</option>
                        <option value="tourist">Tourism</option>
                        <option value="partner">Diplomacy</option>
                        <option value="media">Media</option>
                    </select>

                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        style={{ background: '#334155', color: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid #475569', minWidth: '140px', fontSize: '14px' }}
                    >
                        <option value="">All Markets</option>
                        {countries.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        style={{ background: '#334155', color: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid #475569', minWidth: '140px', fontSize: '14px' }}
                    >
                        <option value="">All Sectors</option>
                        {sectors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    {(selectedAudience || selectedCountry || selectedSector) && (
                        <button
                            onClick={() => { setSelectedAudience(''); setSelectedCountry(''); setSelectedSector(''); }}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', marginLeft: 'auto' }}
                        >
                            Reset View
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #eee', borderTop: '3px solid #052962', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <div style={{ marginTop: '10px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Loading Strategies...</div>
                    </div>
                ) : (
                    <>
                        {/* VIEW MODE: BOARD (SWIMLANES) */}
                        {!isFiltered && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
                                <Swimlane title="💰 Investor Relations Vector" data={swimlanes.investor} color="#059669" />
                                <Swimlane title="🤝 Diplomatic Channels" data={swimlanes.partner} color="#0284c7" />
                                <Swimlane title="📰 Global Media Narrative" data={swimlanes.media} color="#7c3aed" />
                                <Swimlane title="✈️ Tourism & Brand" data={swimlanes.tourist} color="#ea580c" />
                            </div>
                        )}

                        {/* VIEW MODE: FILTERED GRID */}
                        {isFiltered && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '80px' }}>
                                {narratives.length > 0 ? narratives.map(narrative => (
                                    <StrategyCard key={narrative.id} narrative={narrative} />
                                )) : (
                                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '60px', background: '#f9f9f9', borderRadius: '8px', border: '2px dashed #ddd' }}>
                                        <p style={{ fontSize: '18px', color: '#666', fontWeight: 500 }}>No active strategies match these parameters.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                /* Hide scrollbar for swimlanes */
                .swimlane-scroll::-webkit-scrollbar { height: 8px; }
                .swimlane-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .swimlane-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .swimlane-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </Layout>
    );
};

// Helper Components for "Strategy Board" UI

const Swimlane: React.FC<{ title: string; data: NarrativeStrategy[]; color: string }> = ({ title, data, color }) => {
    if (data.length === 0) return null;
    return (
        <section>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span style={{ width: '4px', height: '24px', background: color, display: 'block', borderRadius: '2px' }}></span>
                {title} <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{data.length}</span>
            </h3>
            <div className="swimlane-scroll" style={{ display: 'flex', gap: '25px', overflowX: 'auto', paddingBottom: '20px' }}>
                {data.map(n => (
                    <div key={n.id} style={{ minWidth: '380px', maxWidth: '380px' }}>
                        <StrategyCard narrative={n} borderTop={color} />
                    </div>
                ))}
            </div>
        </section>
    );
};

const StrategyCard: React.FC<{ narrative: NarrativeStrategy; borderTop?: string }> = ({ narrative, borderTop = '#052962' }) => (
    <Link
        to={`/narratives/country/${narrative.country_code}`}
        style={{ display: 'block', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '25px', textDecoration: 'none', color: 'inherit', height: '100%', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s', borderTop: `4px solid ${borderTop}` }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)'; }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {narrative.country_code} Strategy
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>🟢 Active</span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', lineHeight: '1.4' }}>
            {narrative.narrative_theme}
        </h3>

        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {narrative.key_messages[0]}
        </p>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#052962' }}>View Framework</div>
            <ChevronRight size={14} color="#052962" />
        </div>
    </Link>
);
