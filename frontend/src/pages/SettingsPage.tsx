
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Save, Globe, Grid } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const [preferences, setPreferences] = useState({
        countries_of_interest: [] as string[],
        sectors_of_interest: [] as string[],
        language_preference: 'en',
        format_preference: 'full'
    });
    const [message, setMessage] = useState('');

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
                setMessage('Preferences saved successfully');
                setTimeout(() => setMessage(''), 3000);
            })
            .catch(_ => setMessage('Error saving preferences'));
    };

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '800px', padding: '60px 20px' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                    Personalization Settings
                </h1>

                <div style={{ display: 'grid', gap: '40px' }}>
                    <section>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={20} /> Content Preferences
                        </h2>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Language</label>
                            <select
                                value={preferences.language_preference}
                                onChange={e => setPreferences({ ...preferences, language_preference: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="en">English</option>
                                <option value="fr">French</option>
                                <option value="pt">Portuguese</option>
                            </select>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Globe size={20} /> Areas of Interest
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Countries</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                                    {allCountries.map(c => (
                                        <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={preferences.countries_of_interest.includes(c.code)}
                                                onChange={(e) => {
                                                    const newCountries = e.target.checked
                                                        ? [...preferences.countries_of_interest, c.code]
                                                        : preferences.countries_of_interest.filter(code => code !== c.code);
                                                    setPreferences({ ...preferences, countries_of_interest: newCountries });
                                                }}
                                            />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Sectors</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                                    {allSectors.map(s => (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={preferences.sectors_of_interest.includes(s.id)}
                                                onChange={(e) => {
                                                    const newSectors = e.target.checked
                                                        ? [...preferences.sectors_of_interest, s.id]
                                                        : preferences.sectors_of_interest.filter(id => id !== s.id);
                                                    setPreferences({ ...preferences, sectors_of_interest: newSectors });
                                                }}
                                            />
                                            {s.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Grid size={20} /> Display Options
                        </h2>

                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Article Format</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {['full', 'summary', 'brief'].map(format => (
                                    <button
                                        key={format}
                                        onClick={() => setPreferences({ ...preferences, format_preference: format })}
                                        style={{
                                            padding: '15px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            background: preferences.format_preference === format ? '#052962' : 'white',
                                            color: preferences.format_preference === format ? 'white' : 'black',
                                            textTransform: 'capitalize',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div style={{ marginTop: '20px' }}>
                        <button
                            onClick={handleSave}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: '#C70000', color: 'white',
                                padding: '15px 30px', border: 'none', borderRadius: '4px',
                                fontSize: '16px', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            <Save size={20} /> Save Preferences
                        </button>
                        {message && <div style={{ marginTop: '15px', color: '#10B981' }}>{message}</div>}
                    </div>
                </div>
            </div>
        </Layout >
    );
};
