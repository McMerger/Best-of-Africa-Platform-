
import React from 'react';
import { Layout } from '../components/Layout';

export const TermsPage: React.FC = () => {
    return (
        <Layout>
            <div className="container" style={{ maxWidth: '800px', padding: '60px 0' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Terms of Service</h1>
                <div style={{ lineHeight: '1.6', color: '#333' }}>
                    <p>Last Updated: January 2026</p>
                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>1. Acceptance of Terms</h2>
                    <p>By accessing the Best of Africa platform, you agree to these terms. Usage of premium intelligence requires a valid subscription.</p>

                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>2. Intellectual Property</h2>
                    <p>All reports, analysis, and content are the property of Best of Africa. Redistribution without license is prohibited.</p>

                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>3. Disclaimer</h2>
                    <p>Market intelligence is provided for informational purposes only and does not constitute financial advice.</p>

                    <h2 style={{ fontSize: '24px', marginTop: '30px', marginBottom: '15px' }}>4. Termination</h2>
                    <p>We reserve the right to terminate access for violation of these terms.</p>
                </div>
            </div>
        </Layout>
    );
};
