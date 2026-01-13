
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const [preferences, setPreferences] = useState({
        countries_of_interest: [] as string[],
        sectors_of_interest: [] as string[],
        language_preference: 'en',
        format_preference: 'full'
    });
    const [message, setMessage] = useState('');
    const [statusColor, setStatusColor] = useState('#10B981'); // Green for success

    const [allCountries, setAllCountries] = useState<{ code: string, name: string }[]>([]);
    const [allSectors, setAllSectors] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        Promise.all([
            api.getPreferences(),
            api.getCountries(),
            api.getSectors()
        ]).then(([prefs, countriesRes, sectorsRes]) => {
            setPreferences(prefs);
            setAllCountries(countriesRes.data);
            setAllSectors(sectorsRes.data);
        }).catch(err => console.error("Failed to load settings data", err));
    }, []);

    const handleSave = () => {
        api.savePreferences(preferences)
            .then(() => {
                setMessage('Changes saved successfully.');
                setStatusColor('#10B981');
                setTimeout(() => setMessage(''), 3000);
            })
            .catch(_ => {
                setMessage('Could not save changes. Please try again.');
                setStatusColor('#dc2626'); // Red for error
            });
    };

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '80px' }}>
                <header style={{ marginBottom: '40px', paddingTop: '40px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Settings</h1>
                        <p style={{ color: '#666' }}>Manage your platform preferences and content filters.</p>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#052962', color: 'white',
                                padding: '10px 24px', border: 'none', borderRadius: '6px',
                                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </header>

                {message && (
                    <div style={{ position: 'fixed', bottom: '30px', right: '30px', background: statusColor, color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease-out', zIndex: 1000, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {statusColor === '#10B981' ? '✓' : '⚠'} {message}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '30px' }}>

                    {/* SECTION 1: REGIONAL FOCUS */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Regional Focus</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Select the markets you want to track in your dashboard.</p>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                                {allCountries.map(c => (
                                    <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.1s', background: preferences.countries_of_interest.includes(c.code) ? '#eff6ff' : 'transparent' }}>
                                        <input
                                            type="checkbox"
                                            checked={preferences.countries_of_interest.includes(c.code)}
                                            onChange={(e) => {
                                                const newCountries = e.target.checked
                                                    ? [...preferences.countries_of_interest, c.code]
                                                    : preferences.countries_of_interest.filter(code => code !== c.code);
                                                setPreferences({ ...preferences, countries_of_interest: newCountries });
                                            }}
                                            style={{ accentColor: '#052962', width: '16px', height: '16px' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#334155', fontWeight: preferences.countries_of_interest.includes(c.code) ? 600 : 400 }}>{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: SECTOR INTERESTS */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Sector Interests</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Prioritize industries for your intelligence feed.</p>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                                {allSectors.map(s => (
                                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.1s', background: preferences.sectors_of_interest.includes(s.id) ? '#eff6ff' : 'transparent' }}>
                                        <input
                                            type="checkbox"
                                            checked={preferences.sectors_of_interest.includes(s.id)}
                                            onChange={(e) => {
                                                const newSectors = e.target.checked
                                                    ? [...preferences.sectors_of_interest, s.id]
                                                    : preferences.sectors_of_interest.filter(id => id !== s.id);
                                                setPreferences({ ...preferences, sectors_of_interest: newSectors });
                                            }}
                                            style={{ accentColor: '#052962', width: '16px', height: '16px' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#334155', fontWeight: preferences.sectors_of_interest.includes(s.id) ? 600 : 400 }}>{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: DISPLAY PREFERENCES */}
                    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Display Preferences</h2>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', gap: '40px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Interface Language</label>
                                <select
                                    value={preferences.language_preference}
                                    onChange={e => setPreferences({ ...preferences, language_preference: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                >
                                    <option value="en">English</option>
                                    <option value="fr">French</option>
                                    <option value="pt">Portuguese</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Default Article View</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['full', 'summary'].map(format => (
                                        <button
                                            key={format}
                                            onClick={() => setPreferences({ ...preferences, format_preference: format })}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                border: preferences.format_preference === format ? '1px solid #052962' : '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                background: preferences.format_preference === format ? '#052962' : 'white',
                                                color: preferences.format_preference === format ? 'white' : '#64748b',
                                                textTransform: 'capitalize',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 500
                                            }}
                                        >
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </Layout >
    );
};
