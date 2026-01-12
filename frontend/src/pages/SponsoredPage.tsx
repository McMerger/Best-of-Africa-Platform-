
import React from 'react';
import { Layout } from '../components/Layout';
import { Megaphone } from 'lucide-react';

export const SponsoredPage: React.FC = () => {
    return (
        <Layout>
            <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <Megaphone size={64} color="#052962" style={{ marginBottom: '30px' }} />
                <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Sponsored Narrative Campaigns</h1>
                <p style={{ fontSize: '20px', color: '#666', maxWidth: '600px', margin: '0 auto 40px' }}>
                    Partner with Best of Africa to amplify your strategic messaging across the continent's most influential audience.
                </p>
                <div style={{ background: '#f9f9f9', padding: '40px', borderRadius: '8px', maxWidth: '500px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Start a Campaign</h2>
                    <p style={{ marginBottom: '20px' }}>Contact our partnerships team to discuss custom narrative strategies.</p>
                    <a href="mailto:partnerships@bestofafrica.com" className="btn" style={{ display: 'inline-block' }}>Contact Sales</a>
                </div>
            </div>
        </Layout>
    );
};
