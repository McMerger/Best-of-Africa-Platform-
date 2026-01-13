import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Lock, Fingerprint, Shield, Eye, Scan, ChevronRight } from 'lucide-react';


export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);

    // Handle real authentication via API
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setStatus('SCANNING');
        setError(null);

        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: email, secret: password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('boa_auth_token', data.token);
                localStorage.setItem('boa_client_tier', data.tier);
                localStorage.setItem('boa_client_info', JSON.stringify(data.client || {}));
                setStatus('VERIFIED');

                // Redirect after brief delay to show success state
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                setError(data.message || 'Authentication failed');
                setStatus('ERROR');
                // Reset to IDLE after showing error
                setTimeout(() => setStatus('IDLE'), 200);
            }
        } catch (_err) {
            setError('Network error. Please try again.');
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 200);
        }
    };


    return (
        <Layout>
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                {/* Background Grid - Industrial/Surveillance Aesthetic */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 50%, rgba(5, 41, 98, 0.3) 0%, rgba(15, 23, 42, 1) 70%)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 1, pointerEvents: 'none' }}></div>

                <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>

                    {/* Security Badge Header */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            width: '80px', height: '80px', margin: '0 auto 20px',
                            background: '#052962', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 0 30px rgba(5, 41, 98, 0.5)'
                        }}>
                            {status === 'SCANNING' ? (
                                <Scan color="#10B981" size={36} className="scan-animation" />
                            ) : status === 'VERIFIED' ? (
                                <Shield color="#10B981" size={36} />
                            ) : (
                                <Lock color="#ffffff" size={32} />
                            )}
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 200, color: 'white', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Client Portal
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>
                            SECURE LOGIN
                        </p>
                    </div>

                    {/* Industrial Login Form */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '40px' }}>
                        {status === 'VERIFIED' ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', animation: 'fadeIn 0.5s' }}>
                                <div style={{ fontSize: '16px', color: '#10B981', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>LOGIN SUCCESSFUL</div>
                                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>Redirecting to Dashboard...</p>
                                <div style={{ width: '40px', height: '40px', border: '2px solid #10B981', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : (
                            <form onSubmit={handleLogin}>
                                <div style={{ marginBottom: '25px', position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Client ID / Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Fingerprint color="#475569" size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            style={{
                                                width: '100%', padding: '15px 15px 15px 45px',
                                                background: '#0f172a', border: '1px solid #334155',
                                                color: 'white', fontSize: '15px',
                                                borderRadius: '2px', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                            placeholder="name@organization.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '30px', position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Eye color="#475569" size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            style={{
                                                width: '100%', padding: '15px 15px 15px 45px',
                                                background: '#0f172a', border: '1px solid #334155',
                                                color: 'white', fontSize: '15px',
                                                borderRadius: '2px', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                            placeholder="••••••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '12px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '2px',
                                        color: '#ef4444',
                                        fontSize: '13px',
                                        textAlign: 'center'
                                    }}>
                                        {error}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={status === 'SCANNING'}
                                    style={{
                                        width: '100%', padding: '16px',
                                        background: status === 'SCANNING' ? '#0f172a' : '#052962',
                                        color: 'white', border: status === 'SCANNING' ? '1px solid #334155' : '1px solid #1e3a8a',
                                        borderRadius: '2px', fontSize: '13px', fontWeight: 700,
                                        cursor: status === 'SCANNING' ? 'wait' : 'pointer',
                                        textTransform: 'uppercase', letterSpacing: '2px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {status === 'SCANNING' ? 'Verifying...' : <>Sign In <ChevronRight size={16} /></>}
                                </button>
                            </form>
                        )}
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <button
                            onClick={() => {
                                const resetEmail = prompt('Enter your email for password reset:');
                                if (resetEmail) {
                                    fetch('/api/v1/auth/reset-password', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: resetEmail })
                                    })
                                        .then(r => r.json())
                                        .then(() => alert('If an account exists, a reset link has been sent.'))
                                        .catch(() => alert('Error requesting password reset'));
                                }
                            }}
                            style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
                        >
                            Forgot Password?
                        </button>
                        <Link to="/sponsored" style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>Request Access</Link>
                    </div>

                    {/* System Footer */}
                    <div style={{ position: 'absolute', bottom: '-80px', left: 0, right: 0, textAlign: 'center', opacity: 0.5 }}>
                        <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>SECURE CONNECTION: TLS 1.3</div>
                    </div>

                </div>
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .scan-animation { animation: pulse-green 1.5s infinite; }
            `}</style>
        </Layout>
    );
};
