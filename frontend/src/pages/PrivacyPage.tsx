import React from 'react';
import { Layout } from '../components/Layout';

export const PrivacyPage: React.FC = () => {
    return (
        <Layout>
            <div className="container py-20 max-w-3xl">
                <header className="mb-12 border-b border-border pb-8">
                    <h1 className="mb-4 text-4xl font-serif font-extrabold tracking-tight text-foreground md:text-5xl">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">Last Updated: January 2026</p>
                </header>

                <div className="prose prose-lg prose-gray max-w-none text-muted-foreground dark:prose-invert">
                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">1. Data Collection</h2>
                        <p>We collect information you provide directly to us (preferences, account data) and usage data (reading history) to personalize your feed.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">2. Use of Information</h2>
                        <p>We use your data to:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Provide personalized market intelligence.</li>
                            <li>Analyze platform usage trends.</li>
                            <li>Communicate important updates.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">3. Data Protection</h2>
                        <p>We implement enterprise-grade security measures to protect your information. We do not sell your personal data to third parties.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">4. Contact</h2>
                        <p>For privacy concerns, contact <a href="mailto:privacy@bestofafrica.com" className="font-bold text-primary underline hover:text-primary/80">privacy@bestofafrica.com</a>.</p>
                    </section>
                </div>
            </div>
        </Layout>
    );
};
