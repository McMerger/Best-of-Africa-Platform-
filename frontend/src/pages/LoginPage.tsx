
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate auth
        if (email && password) {
            localStorage.setItem('boa_auth_token', 'mock_token_123');
            setMessage('Secure connection established.');
        }
    };

    return (
        <Layout>
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{ width: '60px', height: '60px', background: '#f0f7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Lock color="#052962" size={30} />
                        </div>
                        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Client Access</h1>
                        <p style={{ color: '#666' }}>Enter your API key or credentials to access premium intelligence products.</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                                placeholder="name@organization.com"
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>Password</label>
                                <a href="mailto:support@bestofafrica.com" style={{ fontSize: '12px', color: '#052962', textDecoration: 'none' }}>Forgot?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            style={{ width: '100%', padding: '12px', background: '#052962', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Sign In
                        </button>
                    </form>
                    {message && <div style={{ marginTop: '20px', padding: '10px', background: '#ecfdf5', color: '#065f46', borderRadius: '4px', textAlign: 'center' }}>{message}</div>}
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Don't have an account? </span>
                        <Link to="/sponsored" style={{ fontSize: '12px', color: '#052962', fontWeight: 600, textDecoration: 'none' }}>Request Access</Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
