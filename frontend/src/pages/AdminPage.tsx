import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Shield, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const AdminPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'validating' | 'authenticated' | 'error'>('idle');
    const [error, setError] = useState('');
    const [clientInfo, setClientInfo] = useState<{ name: string; tier: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token.trim()) return;

        setStatus('validating');
        setError('');

        try {
            const res = await fetch(`${API_BASE}/auth/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token.trim() })
            });

            const data = await res.json();

            if (data.valid) {
                localStorage.setItem('boa_admin_token', token.trim());
                setClientInfo(data.client);
                setStatus('authenticated');
            } else {
                setError(data.error || 'Invalid token');
                setStatus('error');
            }
        } catch (err) {
            setError('Failed to validate token');
            setStatus('error');
        }
    };

    return (
        <Layout>
            <div className="container">
                <div style={{ maxWidth: '400px', margin: '60px auto', padding: '40px', background: 'white', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <Shield size={48} color="#052962" />
                        <h1 style={{ fontSize: '24px', marginTop: '15px' }}>Admin Portal</h1>
                        <p style={{ color: '#666' }}>Secure Access Required</p>
                    </div>

                    {status === 'authenticated' && clientInfo ? (
                        <div style={{ textAlign: 'center', color: '#10B981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle size={32} />
                            <p style={{ fontWeight: 600 }}>Authenticated Successfully</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>Welcome, {clientInfo.name}</p>
                            <p style={{ fontSize: '12px', color: '#888' }}>Tier: {clientInfo.tier}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>JWT Token</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#999' }} />
                                    <input
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="Paste Authorization Token..."
                                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>
                            {error && (
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#fef2f2', borderRadius: '4px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={status === 'validating'}
                                style={{ width: '100%', padding: '12px', background: '#052962', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {status === 'validating' ? <><Loader size={16} className="animate-spin" /> Validating...</> : 'Access Dashboard'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
};
