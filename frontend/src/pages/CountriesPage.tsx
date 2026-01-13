import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { CinematicLoader } from '../components/CinematicLoader';
import { api } from '../services/api';
import type { Country } from '../types';

export const CountriesPage: React.FC = () => {
    const [data, setData] = useState<{ by_region: Record<string, Country[]> } | null>(null);
    const [stats, setStats] = useState<{ total_countries: number; total_articles: number; total_views: number; regions: number } | null>(null);

    useEffect(() => {
        Promise.all([
            api.getCountries(),
            api.getPlatformStats()
        ]).then(([countriesRes, statsRes]) => {
            setData(countriesRes);
            setStats(statsRes);
        }).catch(console.error);
    }, []);

    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    if (!data) return <Layout><CinematicLoader text="LOADING MAP DATA..." /></Layout>;

    // Hex Map Coordinates (Abstract Layout)
    const hexLayout = [
        { id: 'North', x: 150, y: 50, color: '#052962' },
        { id: 'West', x: 60, y: 120, color: '#052962' },
        { id: 'Central', x: 150, y: 120, color: '#052962' },
        { id: 'East', x: 240, y: 120, color: '#052962' },
        { id: 'Southern', x: 150, y: 190, color: '#052962' }
    ];

    return (
        <Layout>
            <div className="container">
                <header style={{ marginBottom: '60px', padding: '40px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#052962', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#052962', borderRadius: '50%' }} className="animate-pulse-green"></div>
                            Geospatial Intelligence
                        </div>
                        <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#111', margin: 0, lineHeight: '1', letterSpacing: '-1px' }}>Continental Atlas</h1>
                        <p style={{ fontSize: '18px', color: '#64748b', marginTop: '10px', maxWidth: '600px', lineHeight: '1.5' }}>
                            Interactive intelligence mapping across {stats?.total_countries || '54'} markets.
                            <br /><span style={{ fontSize: '14px', color: '#052962', fontWeight: 600 }}>Hover map to filter by region.</span>
                        </p>
                    </div>

                    {/* Digital Hex Atlas */}
                    <div style={{ width: '320px', height: '260px', position: 'relative' }}>
                        <svg width="320" height="260" viewBox="0 0 300 240">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            {hexLayout.map(region => {
                                const isSelected = selectedRegion === region.id;
                                const count = data.by_region[region.id]?.length || 0;
                                return (
                                    <g
                                        key={region.id}
                                        onClick={() => setSelectedRegion(isSelected ? null : region.id)}
                                        onMouseEnter={() => setSelectedRegion(region.id)}
                                        onMouseLeave={() => setSelectedRegion(null)}
                                        style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                                    >
                                        {/* Hexagon Shape */}
                                        <path
                                            d={`M${region.x} ${region.y - 35} L${region.x + 40} ${region.y - 15} L${region.x + 40} ${region.y + 25} L${region.x} ${region.y + 45} L${region.x - 40} ${region.y + 25} L${region.x - 40} ${region.y - 15} Z`}
                                            fill={isSelected ? '#052962' : 'white'}
                                            stroke="#052962"
                                            strokeWidth={isSelected ? '0' : '2'}
                                            filter={isSelected ? 'url(#glow)' : ''}
                                            style={{ transition: 'all 0.3s' }}
                                        />
                                        {/* Label */}
                                        <text
                                            x={region.x}
                                            y={region.y - 5}
                                            textAnchor="middle"
                                            fill={isSelected ? 'white' : '#052962'}
                                            fontWeight="800"
                                            fontSize="10"
                                            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
                                        >
                                            {region.id}
                                        </text>
                                        {/* Count */}
                                        <text
                                            x={region.x}
                                            y={region.y + 15}
                                            textAnchor="middle"
                                            fill={isSelected ? '#10B981' : '#64748b'}
                                            fontWeight="700"
                                            fontSize="14"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {count}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </header>

                {Object.entries(data.by_region)
                    .filter(([region]) => !selectedRegion || region === selectedRegion)
                    .map(([region, countries]) => (
                        <section key={region} style={{ marginBottom: '60px', animation: 'fade-in-up 0.5s ease-out' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #052962', paddingBottom: '10px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#052962', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {region} Africa
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '4px' }}>
                                    {countries.length} Markets
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                {countries.map(country => (
                                    <Link to={`/countries/${country.code}`} key={country.code} style={{ display: 'block', padding: '25px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#052962', opacity: 0, transition: 'opacity 0.2s' }} className="hover-bar"></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                            <div style={{ fontSize: '32px' }}>{country.flag_emoji}</div>
                                            <div style={{ fontSize: '16px', color: '#cbd5e1' }}>↗</div>
                                        </div>
                                        <h3 style={{ fontSize: '18px', marginBottom: '5px', fontWeight: 700, color: '#1e293b' }}>{country.name}</h3>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px', fontWeight: 500 }}>{country.capital}</div>
                                        <div style={{ fontSize: '11px', color: '#052962', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>View Analysis</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
            </div>
            <style>{`
                a:hover .hover-bar { opacity: 1 !important; }
                a:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #cbd5e1 !important; }
            `}</style>
        </Layout>
    );
};
