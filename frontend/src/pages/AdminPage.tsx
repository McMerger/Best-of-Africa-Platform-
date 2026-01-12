
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Shield, Lock, CheckCircle } from 'lucide-react';

export const AdminPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [authenticated, setAuthenticated] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate admin auth
        if (token.length > 10) {
            localStorage.setItem('boa_admin_token', token);
            setAuthenticated(true);
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

                    {authenticated ? (
                        <div style={{ textAlign: 'center', color: '#10B981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <CheckCircle size={32} />
                            <p style={{ fontWeight: 600 }}>Authenticated Successfully</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>Token stored in session.</p>
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
                            <button type="submit" style={{ width: '100%', padding: '12px', background: '#052962', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                                Access Dashboard
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
};
