import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { RocketIcon, GlobeIcon, ShieldCheckIcon, BackpackIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const TravelPage: React.FC = () => {
    const { data: config } = useSystemConfig();

    return (
        <Layout>
            {/* Hero Section */}
            <div className="relative overflow-hidden border-b border-border bg-background">
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="container relative z-10 py-24 text-center">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-primary/5 text-primary border-primary/20 px-4 py-1">
                        Mission Support
                    </Badge>

                    <h1 className="mb-6 text-5xl font-serif font-black tracking-tight text-foreground md:text-7xl">
                        <span dangerouslySetInnerHTML={{ __html: (config?.['travel_hero_headline'] || "Corporate <br/> Logistics & Security") }} />
                    </h1>

                    <p className="mx-auto mb-10 max-w-2xl text-xl font-medium leading-relaxed text-muted-foreground text-balance">
                        {config?.['travel_hero_subhead'] || "Comprehensive mission support for executives entering high-growth African markets."}
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button size="lg" className="h-12 px-8 font-bold shadow-lg shadow-primary/25" asChild>
                            <Link to="/request-consultation?type=travel">
                                <RocketIcon className="mr-2 h-4 w-4" /> Start Mission Request
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 font-bold" asChild>
                            <Link to="/countries">View Country Risk</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Core Services Grid */}
            <div className="container py-24">
                <div className="grid gap-12 md:grid-cols-3">

                    {/* Service 1 */}
                    <Card className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl">
                        <CardContent className="p-8">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <GlobeIcon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold font-serif">Executive Mobility</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Private aviation charters, expedited visa processing, and VIP ground transport coordination across 54 jurisdictions.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Service 2 */}
                    <Card className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl">
                        <CardContent className="p-8">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <ShieldCheckIcon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold font-serif">Security Intelligence</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Real-time threat assessments, secure routing, and close protection detail for high-stakes environments.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Service 3 */}
                    <Card className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl">
                        <CardContent className="p-8">
                            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <BackpackIcon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold font-serif">Logistics & Fixers</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Local "fixers" to navigate bureaucracy, equipment importation, and regulatory compliance on the ground.
                            </p>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </Layout>
    );
};
