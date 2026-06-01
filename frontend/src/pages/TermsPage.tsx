import React from 'react';

export const TermsPage: React.FC = () => {
    return (
        <>
            <div className="container py-20 max-w-3xl">
                <header className="mb-12 border-b border-border pb-8">
                    <h1 className="mb-4 text-4xl font-serif font-extrabold tracking-tight text-foreground md:text-5xl">Terms of Service</h1>
                    <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">Last Updated: January 2026</p>
                </header>

                <div className="prose prose-lg prose-gray max-w-none text-muted-foreground dark:prose-invert">
                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
                        <p>By accessing the Best of Africa platform, you agree to these terms. Usage of premium intelligence requires a valid subscription.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">2. Intellectual Property</h2>
                        <p>All reports, analysis, and content are the property of Best of Africa. Redistribution without license is prohibited.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">3. Disclaimer</h2>
                        <p>Market intelligence is provided for informational purposes only and does not constitute financial advice.</p>
                    </section>

                    <section className="mb-10">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">4. Termination</h2>
                        <p>We reserve the right to terminate access for violation of these terms.</p>
                    </section>
                </div>
            </div>
        </>
    );
};
