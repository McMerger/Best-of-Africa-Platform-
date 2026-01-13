import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Server } from 'lucide-react';

export const Footer: React.FC = () => {
    const [status, setStatus] = useState<{ version: string; node: string } | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1'}/status`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) setStatus({ version: data.version || '2.4.0', node: data.node || 'NAIROBI-1' });
            })
            .catch(() => setStatus({ version: '2.4.0', node: 'NAIROBI-1' }));
    }, []);

    return (
        <footer style={{ background: '#111', color: '#666', padding: '80px 0 40px', marginTop: '80px', borderTop: '4px solid #052962' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr 1fr 1fr', gap: '60px', marginBottom: '80px' }}>

                    {/* Brand / Mission Column */}
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-1px', marginBottom: '20px' }}>
                            BEST OF AFRICA<span style={{ color: '#052962' }}>.</span>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', maxWidth: '300px', marginBottom: '30px', color: '#888' }}>
                            The sovereign unified narrative engine. Monitoring 54 markets, synthesizing millions of signals, driving narrative sovereignty.
                        </p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            {/* Status Indicators */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#052962', background: '#051b3b', padding: '6px 12px', borderRadius: '4px' }}>
                                <Activity size={14} /> System Operational
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#10B981', background: '#064e3b', padding: '6px 12px', borderRadius: '4px' }}>
                                <ShieldCheck size={14} /> Secure
                            </div>
                        </div>
                    </div>

                    {/* Navigation Columns - Clean & Monospaced */}
                    <div>
                        <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '25px' }}>Intelligence</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '15px' }}>
                            <li><Link to="/dashboards" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Regional Command</Link></li>
                            <li><Link to="/market-intel" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Sector Watch</Link></li>
                            <li><Link to="/reports" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">The Vault</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '25px' }}>Diplomacy</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '15px' }}>
                            <li><Link to="/narratives" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Narrative Strategy</Link></li>
                            <li><Link to="/countries" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Member States</Link></li>
                            <li><Link to="/market-intel/audience" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Sentiment Analysis</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '25px' }}>System</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '15px' }}>
                            <li><Link to="/login" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Secure Login</Link></li>
                            <li><Link to="/contact" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">Contact Support</Link></li>
                            <li><a href="/api/v1/status" target="_blank" style={{ fontSize: '14px', transition: 'color 0.2s', display: 'block' }} className="footer-link">API Status</a></li>
                        </ul>
                    </div>
                </div>

                {/* Sub-Footer: Technical details */}
                <div style={{ borderTop: '1px solid #222', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', gap: '30px' }}>
                        <span>© {new Date().getFullYear()} BOA INTELLIGENCE BUREAU</span>
                        <Link to="/privacy">PRIVACY POLICY</Link>
                        <Link to="/terms">TERMS OF SERVICE</Link>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Server size={14} color="#333" />
                        <span>VER: {status?.version || '2.4.0'}</span>
                        <span style={{ color: '#333' }}>|</span>
                        <span>NODE: {status?.node || 'NAIROBI-1'}</span>
                    </div>
                </div>
            </div>
            <style>{`
                .footer-link { color: #888; }
                .footer-link:hover { color: white; text-decoration: underline; text-decoration-color: #052962; text-underline-offset: 4px; }
            `}</style>
        </footer>
    );
};

