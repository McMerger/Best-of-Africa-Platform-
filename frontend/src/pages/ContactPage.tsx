
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Mail, MessageSquare, Send, Loader } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

export const ContactPage: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        inquiry_type: 'Strategic Partnership',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setError('');

        try {
            const res = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to submit');
            }

            setStatus('success');
            setFormData({ name: '', organization: '', email: '', inquiry_type: 'Strategic Partnership', message: '' });
        } catch (err: any) {
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <Layout>
            <div className="container" style={{ maxWidth: '800px', padding: '80px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '42px', marginBottom: '20px' }}>Contact Best of Africa</h1>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        For media inquiries, partnership opportunities, or support.
                    </p>
                </div>

                {status === 'success' ? (
                    <div style={{ padding: '60px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center', color: '#166534' }}>
                        <Send size={48} style={{ marginBottom: '20px' }} />
                        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Message Sent</h2>
                        <p>Thank you for reaching out. We will review your inquiry shortly.</p>
                        <button
                            onClick={() => setStatus('idle')}
                            style={{ marginTop: '20px', background: 'transparent', border: '1px solid #166534', color: '#166534', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Send Another
                        </button>
                    </div>
                ) : (
                    <div style={{ background: 'white', padding: '40px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {error && <div style={{ marginBottom: '20px', padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px' }}>{error}</div>}
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your Name" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Organization</label>
                                    <input type="text" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} placeholder="Company / Institution" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="official@organization.com" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Inquiry Type</label>
                                <select value={formData.inquiry_type} onChange={e => setFormData({ ...formData, inquiry_type: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option>Strategic Partnership</option>
                                    <option>Media / Press</option>
                                    <option>Report Access</option>
                                    <option>Technical Support</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Message</label>
                                <textarea required rows={5} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} placeholder="How can we assist you?" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }} />
                            </div>

                            <button type="submit" disabled={status === 'submitting'} style={{ background: '#052962', color: 'white', border: 'none', padding: '15px', borderRadius: '4px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: status === 'submitting' ? 0.7 : 1 }}>
                                {status === 'submitting' ? <Loader size={18} className="animate-spin" /> : <Mail size={18} />}
                                {status === 'submitting' ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ marginTop: '60px', gridTemplateColumns: '1fr 1fr', gap: '20px', display: 'grid' }}>
                    <div style={{ textAlign: 'center', padding: '30px', background: '#f9f9f9', borderRadius: '8px' }}>
                        <MessageSquare size={24} color="#052962" style={{ marginBottom: '10px' }} />
                        <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>Press Inquiries</h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>press@bestofafrica.com</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '30px', background: '#f9f9f9', borderRadius: '8px' }}>
                        <Mail size={24} color="#052962" style={{ marginBottom: '10px' }} />
                        <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>General Support</h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>support@bestofafrica.com</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
