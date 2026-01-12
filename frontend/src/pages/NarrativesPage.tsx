import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Filter, ChevronRight } from 'lucide-react';
import type { Country } from '../types';

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

    useEffect(() => {
        api.getCountries().then(res => setCountries(res.data)).catch(console.error);
        api.getSectors().then(res => setSectors(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        const filters: Record<string, string> = {};
        if (selectedAudience) filters.audience = selectedAudience;
        if (selectedCountry) filters.country = selectedCountry;
        if (selectedSector) filters.sector = selectedSector;

        api.getNarratives(filters)
            .then(res => setNarratives(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));

        // Update URL
        const params: Record<string, string> = {};
        if (selectedAudience) params.audience = selectedAudience;
        if (selectedCountry) params.country = selectedCountry;
        if (selectedSector) params.sector = selectedSector;
        setSearchParams(params);
    }, [selectedAudience, selectedCountry, selectedSector]);

    return (
        <Layout>
            <div className="container">
                <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#C70000', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>
                        Available to Partners
                    </div>
                    <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Narrative Diplomacy Strategies</h1>
                    <p style={{ fontSize: '20px', maxWidth: '700px', margin: '0 auto', color: '#555', lineHeight: '1.5' }}>
                        Browse our database of strategic narrative frameworks tailored for specific audiences and markets.
                    </p>
                </header>

                {/* Filters */}
                <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '40px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#052962' }}>
                        <Filter size={20} /> Filter By:
                    </div>
                    <select
                        value={selectedAudience}
                        onChange={(e) => setSelectedAudience(e.target.value)}
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
                    >
                        <option value="">All Audiences</option>
                        <option value="investor">Investors</option>
                        <option value="tourist">Tourists</option>
                        <option value="partner">Diplomatic Partners</option>
                        <option value="media">Global Media</option>
                    </select>

                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
                    >
                        <option value="">All Countries</option>
                        {countries.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
                    >
                        <option value="">All Sectors</option>
                        {sectors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    {(selectedAudience || selectedCountry || selectedSector) && (
                        <button
                            onClick={() => { setSelectedAudience(''); setSelectedCountry(''); setSelectedSector(''); }}
                            style={{ background: 'none', border: 'none', color: '#C70000', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading strategies...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '80px' }}>
                        {narratives.length > 0 ? narratives.map(narrative => (
                            <Link to={`/narratives/country/${narrative.country_code}`} key={narrative.id} style={{ display: 'block', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '30px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                                        {narrative.target_audience}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#999' }}>Code: {narrative.country_code}</span>
                                </div>
                                <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#052962' }}>{narrative.narrative_theme}</h3>
                                <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.5' }}>
                                    {narrative.key_messages[0]}...
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 600, color: '#C70000' }}>
                                    View Strategy <ChevronRight size={16} />
                                </div>
                            </Link>
                        )) : (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px', background: '#f9f9f9', borderRadius: '8px' }}>
                                <p style={{ fontSize: '18px', color: '#666' }}>No narratives found matching your filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};
