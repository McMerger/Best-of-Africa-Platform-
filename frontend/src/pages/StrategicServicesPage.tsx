import React from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightIcon, BarChartIcon, GlobeIcon, PersonIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';

export const StrategicServicesPage: React.FC = () => {
    return (
        <Layout>
            {/* Premium Hero with Grid Pattern */}
            <div className="relative bg-[#1A3C34] text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="container relative py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 mb-6 border-none px-4 py-1 text-xs uppercase tracking-widest font-bold">B2G & B2B Solutions</Badge>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-sm">
                        Transforming Intelligence <br /> into Strategy.
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 font-medium leading-relaxed text-balance">
                        We offer high-value strategic services to governments and investors who need to shape the narrative and understand the market.
                    </p>
                    <Button size="lg" variant="secondary" className="font-bold text-base h-12 px-8 shadow-lg hover:scale-105 transition-transform">
                        Request Consultation
                    </Button>
                </div>
            </div>

            <div className="container py-20">
                <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
                    {/* Governments - Card 1 */}
                    <Card className="group relative overflow-hidden border-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50 bg-card">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />

                        <CardHeader>
                            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <GlobeIcon className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-2xl font-bold">For Governments</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <ul className="space-y-4 text-muted-foreground mb-8">
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Nation-Branding Campaigns</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Narrative Diplomacy Tools</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Investment Promotion Portals</span>
                                </li>
                            </ul>

                            {/* Pro-Proof Metrics (Data Density) */}
                            <div className="mb-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                                <div>
                                    <div className="text-2xl font-black text-foreground">12</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Active Campaigns</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-foreground">94%</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Sentiment Lift</div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors group-hover:border-primary">
                                Partner with us <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Investors - Card 2 */}
                    <Card className="group relative overflow-hidden border-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50 bg-card">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />

                        <CardHeader>
                            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <BarChartIcon className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-2xl font-bold">For Investors</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <ul className="space-y-4 text-muted-foreground mb-8">
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Due Diligence Frameworks</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Deep-Dive Sector Reports</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Regulatory Risk Mapping</span>
                                </li>
                            </ul>

                            {/* Pro-Proof Metrics (Data Density) */}
                            <div className="mb-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                                <div>
                                    <div className="text-2xl font-black text-foreground">$4.2B</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">FDI Enabled</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-foreground">150+</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Markets Mapped</div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors group-hover:border-primary">
                                Get Access <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Institutions - Card 3 */}
                    <Card className="group relative overflow-hidden border-border transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50 bg-card">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />

                        <CardHeader>
                            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Users className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-2xl font-bold">For Institutions</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <ul className="space-y-4 text-muted-foreground mb-8">
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Audience Sentiment Data</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Sponsored Research</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-primary font-bold">•</span>
                                    <span>Development Impact Stories</span>
                                </li>
                            </ul>

                            {/* Pro-Proof Metrics (Data Density) */}
                            <div className="mb-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
                                <div>
                                    <div className="text-2xl font-black text-foreground">54</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Partner NGOs</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-foreground">12M</div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Lives Impacted</div>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors group-hover:border-primary">
                                Contact Research <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};
