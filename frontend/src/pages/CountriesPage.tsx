import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
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

    if (!data) return <Layout><div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading directory...</div></Layout>;

    return (
        <Layout>
            <div className="container">
                <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Continental Coverage</h1>
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
                            <div style={{ background: '#052962', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.total_countries}</div>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Markets</div>
                            </div>
                            <div style={{ background: '#C70000', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.regions}</div>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Regions</div>
                            </div>
                            <div style={{ background: '#d4af37', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.total_articles}</div>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Articles</div>
                            </div>
                            <div style={{ background: '#333', color: 'white', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '32px', fontWeight: 700 }}>{(stats.total_views / 1000).toFixed(1)}k</div>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>Views</div>
                            </div>
                        </div>
                    )}
                </header>

                {Object.entries(data.by_region).map(([region, countries]) => (
                    <section key={region} style={{ marginBottom: '50px' }}>
                        <h2 style={{ fontSize: '24px', borderBottom: '2px solid #052962', paddingBottom: '10px', marginBottom: '20px', color: '#052962', fontWeight: 700 }}>
                            {region} Africa
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {countries.map(country => (
                                <Link to={`/countries/${country.code}`} key={country.code} style={{ display: 'block', padding: '20px', background: 'white', border: '1px solid #eee', borderRadius: '8px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '42px', marginBottom: '15px' }}>{country.flag_emoji}</div>
                                    <h3 style={{ fontSize: '18px', marginBottom: '5px', fontWeight: 700 }}>{country.name}</h3>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>{country.capital}</div>
                                    <div style={{ fontSize: '12px', color: '#052962', fontWeight: 600 }}>In-depth Analysis →</div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </Layout>
    );
};
