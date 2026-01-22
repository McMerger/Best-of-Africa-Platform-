import React from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SunIcon, GlobeIcon, PersonIcon, LightningBoltIcon, ArrowTopRightIcon } from '@radix-ui/react-icons';

export const ImpactPage: React.FC = () => {
    return (
        <Layout>
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="container relative py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-green-500/10 text-green-600 border-green-500/20 px-4 py-1">Sustainable Development</Badge>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-foreground">
                        Growth. <span className="text-green-600">Sustained.</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium text-balance">
                        Tracking the critical intersection of profitability and progress. We identify opportunities that drive long-term value for the continent.
                    </p>
                </div>
            </div>

            <div className="container py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="hover:border-green-500/50 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <SunIcon className="h-8 w-8 text-green-600 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Clean Energy</h3>
                            <p className="text-sm text-muted-foreground">Renewable grid transitions and solar scale-ups.</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:border-blue-500/50 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <GlobeIcon className="h-8 w-8 text-blue-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Water Security</h3>
                            <p className="text-sm text-muted-foreground">Infrastructure resilience and agri-tech solutions.</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:border-purple-500/50 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <PersonIcon className="h-8 w-8 text-purple-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Social Impact</h3>
                            <p className="text-sm text-muted-foreground">Education, healthcare, and job creation vectors.</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:border-yellow-500/50 transition-all cursor-pointer">
                        <CardContent className="p-6">
                            <LightningBoltIcon className="h-8 w-8 text-yellow-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Innovation</h3>
                            <p className="text-sm text-muted-foreground">Leapfrog technologies driving efficiency.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-8">Featured Impact Opportunities</h2>
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="group relative overflow-hidden rounded-xl border border-border bg-card">
                                <div className="h-48 bg-muted/50"></div>
                                <div className="p-6">
                                    <div className="flex gap-2 mb-2">
                                        <Badge variant="secondary" className="text-[10px]">KENYA</Badge>
                                        <Badge variant="outline" className="text-[10px]">AGRI-TECH</Badge>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary">Sustainable Tea Farming</h3>
                                    <p className="text-sm text-muted-foreground mb-4">New cooperative models increasing yield by 40%.</p>
                                    <Button variant="link" className="p-0 text-green-600 font-bold">Read Impact Report &rarr;</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
