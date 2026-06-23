import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const SECTIONS = [
    { id: 'data-collection', title: '1. Data Collection' },
    { id: 'use-of-information', title: '2. Use of Information' },
    { id: 'data-protection', title: '3. Data Protection' },
    { id: 'pipeda', title: '4. Your Rights (PIPEDA)' },
    { id: 'contact', title: '5. Contact' },
];

export const PrivacyPage: React.FC = () => {
    return (
        <>
            <SEO title="Privacy Policy" description="How Best of Africa collects, uses, and protects your personal information, including PIPEDA rights for Canadian users." />
            <div className="container py-20 max-w-3xl">
                <header className="mb-10 border-b border-border pb-8">
                    <h1 className="mb-4 text-4xl font-serif font-extrabold tracking-tight text-ink md:text-5xl">Privacy Policy</h1>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Last Updated: June 2026</p>
                </header>

                {/* Table of contents */}
                <nav aria-label="On this page" className="mb-12 rounded-2xl border border-border bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                    <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-blue">On this page</h2>
                    <ul className="space-y-2">
                        {SECTIONS.map(s => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-accent hover:text-gold-italic transition-colors text-sm font-medium">{s.title}</a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="max-w-none text-ink-soft [&_p]:leading-[1.8] [&_p]:text-base">
                    <section id="data-collection" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">1. Data Collection</h2>
                        <p>We collect information you provide directly to us (preferences, account data) and usage data (reading history) to personalize your feed.</p>
                    </section>

                    <section id="use-of-information" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">2. Use of Information</h2>
                        <p>We use your data to:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Provide personalized market intelligence.</li>
                            <li>Analyze platform usage trends.</li>
                            <li>Communicate important updates.</li>
                        </ul>
                    </section>

                    <section id="data-protection" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">3. Data Protection</h2>
                        <p>We implement enterprise-grade security measures to protect your information. We do not sell your personal data to third parties.</p>
                    </section>

                    <section id="pipeda" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">4. Your Rights (PIPEDA)</h2>
                        <p>This platform complies with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA). Users located in Canada have the right to access, correct, and request deletion of their personal information.</p>
                    </section>

                    <section id="contact" className="mb-10 scroll-mt-24">
                        <h2 className="mb-4 text-2xl font-bold text-ink">5. Contact</h2>
                        <p>For privacy concerns, contact <a href="mailto:privacy@bestofafrica.com" className="font-bold text-accent underline hover:text-gold-italic">privacy@bestofafrica.com</a>.</p>
                    </section>
                </div>

                <div className="mt-12 border-t border-border pt-6 text-sm text-ink-blue">
                    See also: <Link to="/terms" className="text-accent hover:text-gold-italic font-medium">Terms of Service</Link>
                    {' · '}
                    <Link to="/contact" className="text-accent hover:text-gold-italic font-medium">Contact Us</Link>
                </div>
            </div>
        </>
    );
};
