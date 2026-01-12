import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer style={{ background: '#f6f6f6', padding: '60px 0', marginTop: '60px', borderTop: '1px solid #ddd' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
                    <div>
                        <h3>Best of Africa</h3>
                        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                            The unified narrative engine for the continent.
                        </p>
                    </div>
                    <div>
                        <h4>Sections</h4>
                        <ul style={{ listStyle: 'none', marginTop: '10px' }}>
                            <li style={{ marginBottom: '8px' }}><Link to="/news" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>News</Link></li>
                            <li style={{ marginBottom: '8px' }}><Link to="/dashboards" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>Dashboards</Link></li>
                            <li style={{ marginBottom: '8px' }}><Link to="/countries" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>Countries</Link></li>
                            <li style={{ marginBottom: '8px' }}><Link to="/market-intel" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>Market Intel</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4>Services</h4>
                        <ul style={{ listStyle: 'none', marginTop: '10px' }}>
                            <li style={{ marginBottom: '8px' }}><Link to="/narratives" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>Narrative Diplomacy</Link></li>
                            <li style={{ marginBottom: '8px' }}><Link to="/market-intel/audience" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>Audience Insights</Link></li>
                            <li style={{ marginBottom: '8px' }}><Link to="/sponsored" style={{ fontSize: '14px', color: '#052962', textDecoration: 'none' }}>Sponsored Campaigns</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4>Connect</h4>
                        <p style={{ marginTop: '10px', fontSize: '14px' }}>
                            <Link to="/contact" style={{ color: '#052962', textDecoration: 'none', fontWeight: 600 }}>Contact Us</Link>
                        </p>
                    </div>
                </div>
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                    <span>© {new Date().getFullYear()} Best of Africa. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Link to="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</Link>
                        <Link to="/terms" style={{ color: '#999', textDecoration: 'none' }}>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
