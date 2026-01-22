import React from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, LockClosedIcon, PaperPlaneIcon, BackpackIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export const BusinessTravelPage: React.FC = () => {
    return (
        <Layout>
            {/* Premium Hero with Grid Pattern */}
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

                <div className="container relative py-24 text-left md:text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-background px-4 py-1">Executive Travel</Badge>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-foreground drop-shadow-sm">
                        Corporate Travel <br /> Integration.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl md:mx-auto mb-10 leading-relaxed font-medium text-balance">
                        We combine curated VIP partnerships with transparent affiliate comparisons and specialized ground logistics.
                    </p>
                </div>
            </div>

            <div className="container py-20">
                <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
                    {/* TIER 1: VIP DIRECT */}
                    <Card className="group border-2 border-primary relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge className="bg-primary text-primary-foreground font-bold rounded-sm shadow-sm group-hover:scale-105 transition-transform">PREMIER</Badge>
                        </div>
                        <CardHeader>
                            <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <LockClosedIcon className="h-5 w-5 text-primary group-hover:text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold">VIP Partnerships</CardTitle>
                            <CardDescription>Direct integration with premium properties.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded border border-border group-hover:bg-primary/5 transition-colors">
                                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Value Proposition</span>
                                <span className="text-lg font-bold text-foreground">Premium Corporate Benefits</span>
                            </div>
                            <ul className="space-y-3 pt-2">
                                <li className="flex gap-3 items-center">
                                    <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium">Polana Serena (Maputo)</span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium">Radisson Blu Locations</span>
                                </li>
                            </ul>

                            {/* Data Density: Logistics Metrics */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Avg Rate</div>
                                    <div className="text-sm font-black text-foreground">$240/night</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Corp Savings</div>
                                    <div className="text-sm font-black text-green-600">-22%</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border/50">
                                <h4 className="font-bold mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Benefits</h4>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-primary">
                                    <div className="bg-primary/5 p-2 rounded text-center group-hover:bg-primary/10 transition-colors">Room Upgrade</div>
                                    <div className="bg-primary/5 p-2 rounded text-center group-hover:bg-primary/10 transition-colors">Late Checkout</div>
                                    <div className="bg-primary/5 p-2 rounded text-center group-hover:bg-primary/10 transition-colors">Breakfast</div>
                                    <div className="bg-primary/5 p-2 rounded text-center group-hover:bg-primary/10 transition-colors">Lounge Access</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full font-bold uppercase tracking-wide group-hover:scale-[1.02] transition-transform">
                                View Partners
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* TIER 2: AFFILIATE */}
                    <Card className="group relative overflow-hidden border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/50">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge variant="outline" className="font-bold text-muted-foreground rounded-sm group-hover:text-primary group-hover:border-primary transition-colors">PLATFORM</Badge>
                        </div>
                        <CardHeader>
                            <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <PaperPlaneIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Affiliate Integrations</CardTitle>
                            <CardDescription>Comparison pricing engine.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded border border-border">
                                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Value Proposition</span>
                                <span className="text-lg font-bold text-foreground">Broadest Market Choice</span>
                            </div>
                            <ul className="space-y-3 pt-2">
                                <li className="flex gap-3 items-center">
                                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Booking.com Integration</span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Expedia Partnership</span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">RentalCars.com</span>
                                </li>
                            </ul>

                            {/* Data Density: Metrics */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Inventory</div>
                                    <div className="text-sm font-black text-foreground">2.4M Hotels</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Search Speed</div>
                                    <div className="text-sm font-black text-foreground">0.4s Avg</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full font-bold uppercase tracking-wide group-hover:text-primary group-hover:border-primary transition-colors">
                                Compare Rates
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* TIER 3: CONCIERGE */}
                    <Card className="group relative overflow-hidden border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/50">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge variant="outline" className="font-bold text-muted-foreground rounded-sm group-hover:text-primary group-hover:border-primary transition-colors">BESPOKE</Badge>
                        </div>
                        <CardHeader>
                            <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <Briefcase className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Specialized Booking Services</CardTitle>
                            <CardDescription>Complex logistics & support (Phase 2).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted/30 rounded border border-border">
                                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Value Proposition</span>
                                <span className="text-lg font-bold text-foreground">End-to-End Support</span>
                            </div>
                            <ul className="space-y-3 pt-2">
                                <li className="flex gap-3 items-center">
                                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Multi-City Itineraries</span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Site Visit Coordination</span>
                                </li>
                                <li className="flex gap-3 items-center">
                                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Executive Translation</span>
                                </li>
                            </ul>

                            {/* Data Density: Metrics */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Global Reach</div>
                                    <div className="text-sm font-black text-foreground">84 Cities</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Response</div>
                                    <div className="text-sm font-black text-foreground">~12 Mins</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full font-bold uppercase tracking-wide group-hover:text-primary group-hover:border-primary transition-colors">
                                Contact Desk
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="mt-20 p-8 rounded-2xl bg-muted/30 border border-border text-center max-w-4xl mx-auto shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">Integrated Travel Solutions</h2>
                    <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Best of Africa recognizes that business travel requires flexibility.
                        Whether you need the security of a <span className="font-bold text-foreground">VIP Partner Property</span>,
                        the breadth of an <span className="font-bold text-foreground">Online Travel Agency</span>,
                        or the hands-on support of a <span className="font-bold text-foreground">Specialist DMC</span>,
                        we provide a trusted gateway for every stage of your journey.
                    </p>
                    <Button className="mt-8" variant="secondary" asChild>
                        <Link to="/countries">Explore Destinations</Link>
                    </Button>
                </div>
            </div>
        </Layout>
    );
};
