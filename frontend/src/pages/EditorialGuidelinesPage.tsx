import React from 'react';
import { Layout } from '../components/Layout';
import { LockClosedIcon, Link2Icon, StarFilledIcon, PieChartIcon } from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';

export const EditorialGuidelinesPage: React.FC = () => {
    return (
        <Layout>
            <div className="container max-w-4xl py-20">
                <div className="mb-12 text-center">
                    <h1 className="mb-6 text-5xl font-serif font-bold tracking-tight text-foreground">
                        Editorial Guidelines & <br />
                        <span className="text-primary italic">Standards of Transparency</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                        How we maintain the delicate balance between data-driven intelligence, editorial curation, and commercial partnerships.
                    </p>
                </div>

                <div className="grid gap-12 md:grid-cols-2 mb-16">
                    <div className="rounded-xl border border-border bg-card p-8">
                        <div className="mb-4 inline-flex rounded-3xl bg-primary/10 p-3 text-primary">
                            <LockClosedIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-3 text-2xl font-bold">Narrative Integrity</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Our central engine detects and corrects narrative gaps, but final editorial oversight is strictly human.
                            We do not publish unverified claims. Every strategic narrative conforms to verified ground-truth data.
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-8">
                        <div className="mb-4 inline-flex rounded-3xl bg-primary/10 p-3 text-primary">
                            <PieChartIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-3 text-2xl font-bold">Commercial Independence</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Commercial partnerships never compromise content integrity.
                            VIP partner hotels and sponsored reports are clearly labeled. Our sector analysis remains objective regardless of ongoing investment promotion mandates.
                        </p>
                    </div>
                </div>

                <section className="mb-16">
                    <h2 className="mb-6 text-3xl font-bold">Transparency Declarations</h2>
                    <Separator className="mb-8" />

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <div className="mt-1">
                                <Link2Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold">Affiliate Relationships</h4>
                                <p className="text-muted-foreground mt-2">
                                    We participate in affiliate programs with booking platforms (Tier 2).
                                    When you click comparison links for Booking.com or Expedia, we may earn a commission (1-5%).
                                    This funding supports our independent market research.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="mt-1">
                                <StarFilledIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold">Sponsored Content Policy</h4>
                                <p className="text-muted-foreground mt-2">
                                    Strategic Services (Nation Branding, Investor Roundtables) are distinct from our core intelligence feed.
                                    Any content funded by a government or institutional partner is marked as <span className="font-bold text-foreground">"Strategic Partner Content"</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-muted/30 p-8 rounded-xl border border-border">
                    <h2 className="text-2xl font-bold mb-4">The "Golden Share" Principle</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        To protect the platform's long-term mission as a tool for narrative diplomacy, we operate under a "Golden Share" governance model where editorial veto power resides with a non-commercial council of African media veterans.
                    </p>
                </section>
            </div>
        </Layout>
    );
};
