import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import {
    GlobeIcon,
    StarIcon,
    TargetIcon,
    ArrowRightIcon,
    CheckCircledIcon,
    UpdateIcon,
    RocketIcon,
    LightningBoltIcon,
    MixIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

interface AudienceStats {
    monthly_readers: number;
    audience_breakdown: { segment: string; percentage: number }[];
    countries_covered: number;
}

export const SponsoredPage: React.FC = () => {
    const [stats, setStats] = useState<AudienceStats | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/stats/audience`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(() => setStats({
                monthly_readers: 250000,
                audience_breakdown: [
                    { segment: 'C-Suite / Executive', percentage: 45 },
                    { segment: 'Government / Policy', percentage: 30 },
                    { segment: 'Investment / Capital', percentage: 25 }
                ],
                countries_covered: 54
            }));
    }, []);

    const tiers = [
        {
            name: "Strategic Partner",
            role: "Market Integration",
            description: "Deep-level integration into national branding strategies and sector-wide intelligence frameworks.",
            icon: RocketIcon,
            features: ["Contextual Article Placement", "Exclusive Sector Briefing Seats", "Direct Investor Referral Channel"]
        },
        {
            name: "Knowledge Partner",
            role: "Thought Leadership",
            description: "Position your technical expertise through collaborative research and whitepaper distribution.",
            icon: LightningBoltIcon,
            features: ["Joint Research Publications", "Webinar & Podcast Integration", "Technical Insight Contributions"]
        },
        {
            name: "Media Partner",
            role: "Visibility & Reach",
            description: "High-impact brand positioning across the platform's primary intelligence streams.",
            icon: MixIcon,
            features: ["Cross-Platform Brand Display", "Event Coverage Highlights", "Social Media Distribution"]
        }
    ];

    return (
        <Layout>
            <div className="relative overflow-hidden">
                {/* Cinematic Background Elements */}
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

                <div className="container relative py-20 max-w-6xl">
                    <motion.header
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-24 text-center"
                    >
                        <div className="mb-8 inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-primary shadow-sm">
                            Partnership Division
                        </div>
                        <h1 className="mb-8 text-6xl font-serif font-black leading-tight tracking-tighter text-foreground md:text-8xl lg:text-9xl">
                            Strategic <span className="text-primary italic">Alignment</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground font-medium italic">
                            Building the narratives that drive capital and policy across the African continent.
                        </p>
                    </motion.header>

                    {/* Stats Section with Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="mb-32 rounded-3xl border border-white/10 bg-black/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl dark:bg-white/5"
                    >
                        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] items-center">
                            <div>
                                <h2 className="mb-6 text-3xl font-serif font-bold text-foreground">A Global Institutional Reach</h2>
                                <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                                    Our platform serves as the primary intelligence node for global executives, sovereign wealth funds, and policymakers focusing on African markets.
                                </p>

                                {stats ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <div className="space-y-1">
                                            <div className="text-4xl font-black text-primary tracking-tighter tabular-nums">
                                                {Math.round(stats.monthly_readers / 1000)}k+
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Readers</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-4xl font-black text-primary tracking-tighter tabular-nums">
                                                {stats.countries_covered}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Markets Covered</div>
                                        </div>
                                        <div className="hidden md:block space-y-1">
                                            <div className="text-4xl font-black text-primary tracking-tighter tabular-nums">
                                                0.8s
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Signal Latency</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-20 items-center justify-center">
                                        <UpdateIcon className="h-6 w-6 animate-spin text-primary/50" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 bg-primary/5 rounded-2xl p-6 border border-primary/10">
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Audience Breakdown</div>
                                <div className="space-y-4">
                                    {stats?.audience_breakdown.map(item => (
                                        <div key={item.segment} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span>{item.segment}</span>
                                                <span className="text-primary">{item.percentage}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${item.percentage}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Partnership Tiers */}
                    <div className="mb-32">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-serif font-bold mb-4 tracking-tight">Partnership <span className="text-primary italic">Models</span></h2>
                            <p className="text-muted-foreground max-w-xl mx-auto italic font-medium">Structured engagement strategies for diverse organizational goals.</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {tiers.map((tier, idx) => (
                                <motion.div
                                    key={tier.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <Card className="h-full border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 group rounded-3xl overflow-hidden flex flex-col">
                                        <CardContent className="p-8 flex-1 flex flex-col">
                                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                <tier.icon className="h-7 w-7" />
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">{tier.role}</div>
                                            <h3 className="text-2xl font-bold mb-4">{tier.name}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-8">{tier.description}</p>

                                            <div className="mt-auto space-y-4">
                                                {tier.features.map(feature => (
                                                    <div key={feature} className="flex items-center gap-2 text-xs font-medium">
                                                        <CheckCircledIcon className="h-4 w-4 text-primary shrink-0" />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Engagement Vectors */}
                    <div className="mb-32 grid gap-12 lg:grid-cols-2">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                                <TargetIcon className="h-4 w-4" /> Core Vectors
                            </div>
                            <h2 className="text-4xl font-serif font-bold tracking-tight">Position your organization as a <span className="text-primary italic">decision-critical</span> source.</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Beyond traditional advertising, we integrate our partners into the very fabric of our intelligence stream, ensuring maximum contextual relevance.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button asChild size="lg" className="rounded-full shadow-xl shadow-primary/20 h-14 px-8 text-base font-bold">
                                    <a href="mailto:partnerships@bestofafrica.com" className="flex items-center gap-2">
                                        Contact Relations <ArrowRightIcon className="h-5 w-5" />
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {[
                                {
                                    icon: GlobeIcon,
                                    title: "Thought Leadership",
                                    desc: "Position your executives as primary sources in sector-specific intelligence briefings."
                                },
                                {
                                    icon: StarIcon,
                                    title: "Brand Influence",
                                    desc: "Integrate your narrative into our National Branding Strategy frameworks."
                                }
                            ].map(item => (
                                <Card key={item.title} className="border-border bg-card/30 hover:bg-card hover:border-primary/30 transition-all rounded-3xl">
                                    <CardContent className="flex gap-6 p-8 items-center">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <item.icon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
