import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardTitle, CardHeader, CardFooter } from '@/components/ui/card';
import { CheckIcon } from '@radix-ui/react-icons';
import { Gemstone } from '@/components/ui/gemstone';

const TIERS = [
    {
        id: 'explorer',
        name: 'Explorer',
        price: 'Free',
        period: 'forever',
        description: 'Essential market briefings for the aspiring analyst.',
        gem: 'explorer',
        color: '#a8a29e', // Stone
        features: ['Daily Briefing (abbreviated)', 'Public Market Reports', 'Weekly Newsletter']
    },
    {
        id: 'pro',
        name: 'Professional',
        price: '$2,500',
        period: '/ year',
        description: 'Complete intelligence suite for strategic operations.',
        gem: 'professional',
        color: '#fbbf24', // Amber
        features: ['Full Daily Briefing', 'Real-time Signals', 'Sector Deep-Dives', 'Analyst Access']
    },
    {
        id: 'corp',
        name: 'Corporate',
        price: 'Custom',
        period: '',
        description: ' bespoke intelligence for multinational dominance.',
        gem: 'corporate',
        color: '#3b82f6', // Blueprint Blue / Diamond
        features: ['API Access', 'White-label Reports', 'Dedicated Analyst Team', 'Board Presentations']
    }
];

export const MembershipPage: React.FC = () => {
    const { data: config } = useSystemConfig();

    return (
        <Layout>
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="container relative py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-background text-primary border-primary/20 px-4 py-1">
                        Membership Tiers
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-serif font-black mb-6 tracking-tight text-foreground">
                        <span dangerouslySetInnerHTML={{ __html: (config?.['membership_headline'] || "Intelligence for <br /> Decision Makers.") }} />
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium text-balance">
                        {config?.['membership_subhead'] || "Choose the level of insight your organization requires."}
                    </p>
                </div>
            </div>

            <div className="container py-12 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {TIERS.map((tier) => (
                        <Card key={tier.id} className={`relative flex flex-col border-2 overflow-hidden bg-card transition-all duration-500 hover:shadow-2xl ${tier.id === 'pro' ? 'border-secondary shadow-lg scale-105 z-10' : 'border-border/50 opacity-90 hover:opacity-100 hover:scale-[1.02]'}`}>

                            {/* 3D Gemstone Header */}
                            <div className="relative h-48 w-full bg-gradient-to-b from-muted/20 to-transparent">
                                <Gemstone type={tier.gem as 'explorer' | 'professional' | 'corporate'} className="w-full h-full" />
                            </div>

                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl font-serif font-bold">{tier.name}</CardTitle>
                                <CardDescription className="min-h-[3rem]">{tier.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col items-center">
                                <div className="mb-6 text-center">
                                    <span className="text-4xl font-black text-foreground">{tier.price}</span>
                                    {tier.period && <span className="text-sm text-muted-foreground ml-1">{tier.period}</span>}
                                </div>

                                <ul className="space-y-3 w-full text-left">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex gap-2 items-center text-sm text-foreground/80">
                                            <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full font-bold tracking-widest uppercase rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                                    variant={tier.id === 'pro' ? 'secondary' : 'default'}
                                    size="lg"
                                >
                                    {tier.id === 'corp' ? 'Contact Sales' : 'Join Now'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-muted-foreground text-sm mb-4">{config?.['membership_trust_label'] || 'Trusted by strategic teams at:'}</p>
                    <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {(config?.['membership_trust_logos'] || 'AFRICA FINANCE CORP,DANGOTE GROUP,STANDARDBANK,MTN').split(',').map((logo: string, i: number) => (
                            <span key={i} className="font-serif font-bold text-xl">{logo.trim()}</span>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
