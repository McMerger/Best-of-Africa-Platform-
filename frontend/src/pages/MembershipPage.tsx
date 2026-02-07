import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { CheckIcon, LightningBoltIcon, StarIcon } from '@radix-ui/react-icons';

export const MembershipPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    return (
        <Layout>
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="container relative py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-background text-primary border-primary/20 px-4 py-1">Operational Advantage</Badge>
                    <h1 className="text-4xl md:text-6xl font-serif font-black mb-6 tracking-tight text-foreground">
                        {/* {config?.['membership_headline'] || "Intelligence for Decision Makers."} */}
                        {/* Line break handling might be tricky, maybe just text */}
                        <span dangerouslySetInnerHTML={{ __html: (config?.['membership_headline'] || "Intelligence for <br /> Decision Makers.") }} />
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium text-balance">
                        {config?.['membership_subhead'] || "For investors, governments, and corporations who cannot afford to be surprised."}
                    </p>
                </div>
            </div>

            <div className="container py-12 pb-24">
                <div className="max-w-4xl mx-auto">
                    {/* SINGLE DECISION MOMENT CARD */}
                    <Card className="border-2 border-primary bg-card shadow-2xl overflow-hidden">
                        <div className="grid md:grid-cols-2">
                            <div className="p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border bg-muted/10">
                                <Badge className="w-fit mb-4 bg-primary text-primary-foreground hover:bg-primary/90">PREMIER ACCESS</Badge>
                                <CardTitle className="text-4xl font-serif font-bold mb-4">Partner Tier</CardTitle>
                                <CardDescription className="text-lg mb-8">
                                    The complete intelligence suite for strategic operations.
                                </CardDescription>
                                <div className="mb-8">
                                    <span className="text-5xl font-black text-foreground">$2,500</span>
                                    <span className="text-xl text-muted-foreground ml-2">/ year</span>
                                </div>
                                <Button className="w-full font-bold text-lg h-14 shadow-lg shadow-primary/25" size="lg">
                                    Start Operational Advantage
                                </Button>
                                <p className="mt-4 text-center text-xs text-muted-foreground">
                                    Immediate access. Cancel anytime.
                                </p>
                            </div>

                            <CardContent className="p-10 flex flex-col justify-center bg-card">
                                <h3 className="font-bold uppercase tracking-widest text-muted-foreground text-sm mb-6">What you receive daily:</h3>
                                <ul className="space-y-5">
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1 bg-primary/10 p-1 rounded-full"><LightningBoltIcon className="h-4 w-4 text-primary" /></div>
                                        <div>
                                            <div className="font-bold text-foreground">{config?.['membership_feature_1_title'] || 'Daily Intelligence Briefing'}</div>
                                            <div className="text-sm text-muted-foreground">{config?.['membership_feature_1_desc'] || 'Curated executive synthesis every morning at 6 AM.'}</div>
                                        </div>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1 bg-primary/10 p-1 rounded-full"><CheckIcon className="h-4 w-4 text-primary" /></div>
                                        <div>
                                            <div className="font-bold text-foreground">{config?.['membership_feature_2_title'] || 'Real-time Warning Signals'}</div>
                                            <div className="text-sm text-muted-foreground">{config?.['membership_feature_2_desc'] || 'Mobile alerts for critical narrative shifts.'}</div>
                                        </div>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1 bg-primary/10 p-1 rounded-full"><StarIcon className="h-4 w-4 text-primary" /></div>
                                        <div>
                                            <div className="font-bold text-foreground">{config?.['membership_feature_3_title'] || 'Deep-Dive Sector Reports'}</div>
                                            <div className="text-sm text-muted-foreground">{config?.['membership_feature_3_desc'] || 'Full PDF access to Energy, Tech, and Finance verticals.'}</div>
                                        </div>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1 bg-primary/10 p-1 rounded-full"><CheckIcon className="h-4 w-4 text-primary" /></div>
                                        <div>
                                            <div className="font-bold text-foreground">{config?.['membership_feature_4_title'] || 'Analyst On-Call'}</div>
                                            <div className="text-sm text-muted-foreground">{config?.['membership_feature_4_desc'] || 'Direct line to our narrative strategy desk.'}</div>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </div>
                    </Card>

                    <div className="mt-12 text-center">
                        <p className="text-muted-foreground text-sm mb-4">{config?.['membership_trust_label'] || 'Trusted by strategic teams at:'}</p>
                        <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
                            {(config?.['membership_trust_logos'] || 'AFRICA FINANCE CORP,DANGOTE GROUP,STANDARDBANK,MTN').split(',').map((logo: string, i: number) => (
                                <span key={i} className="font-serif font-bold text-xl">{logo.trim()}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
