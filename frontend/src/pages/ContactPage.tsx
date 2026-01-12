
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Mail, MessageSquare, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('success');
        // Mock submission
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
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Name</label>
                                    <input required type="text" placeholder="Your Name" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Organization</label>
                                    <input required type="text" placeholder="Company / Institution" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Email</label>
                                <input required type="email" placeholder="official@organization.com" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Inquiry Type</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option>Strategic Partnership</option>
                                    <option>Media / Press</option>
                                    <option>Report Access</option>
                                    <option>Technical Support</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Message</label>
                                <textarea required rows={5} placeholder="How can we assist you?" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }} />
                            </div>

                            <button type="submit" style={{ background: '#052962', color: 'white', border: 'none', padding: '15px', borderRadius: '4px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <Mail size={18} /> Send Message
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
