
import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
    return (
        <Layout>
            <div className="container" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={64} color="#C70000" style={{ marginBottom: '20px' }} />
                <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#052962' }}>404</h1>
                <h2 style={{ fontSize: '24px', marginBottom: '30px', color: '#555' }}>Page Not Found</h2>
                <p style={{ maxWidth: '500px', marginBottom: '40px', lineHeight: '1.6', color: '#666' }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link to="/" style={{ background: '#052962', color: 'white', padding: '12px 30px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>
                    Return Home
                </Link>
            </div>
        </Layout>
    );
};
