
import React from 'react';
import { Layout } from '../components/Layout';

export const PrivacyPage: React.FC = () => {
    return (
        <Layout>
            <div className="container" style={{ maxWidth: '800px', padding: '60px 0' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Privacy Policy</h1>
                <div style={{ lineHeight: '1.6', color: '#333' }}>
                    <p>Last Updated: January 2026</p>
                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>1. Data Collection</h2>
                    <p>We collect information you provide directly to us (preferences, account data) and usage data (reading history) to personalize your feed.</p>

                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>2. Use of Information</h2>
                    <p>We use your data to:</p>
                    <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                        <li>Provide personalized market intelligence.</li>
                        <li>Analyze platform usage trends.</li>
                        <li>Communicate important updates.</li>
                    </ul>

                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>3. Data Protection</h2>
                    <p>We implement enterprise-grade security measures to protect your information. We do not sell your personal data to third parties.</p>

                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>4. Contact</h2>
                    <p>For privacy concerns, contact <a href="mailto:privacy@bestofafrica.com">privacy@bestofafrica.com</a>.</p>
                </div>
            </div>
        </Layout>
    );
};
