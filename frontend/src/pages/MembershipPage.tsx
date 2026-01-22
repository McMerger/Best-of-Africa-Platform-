import React from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, LightningBoltIcon, GlobeIcon, StarFilledIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export const MembershipPage: React.FC = () => {
    return (
        <Layout>
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="container relative py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-background text-primary border-primary/20 px-4 py-1">Premium Access</Badge>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-foreground">
                        Unlock the <br /> Intelligence Engine.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium text-balance">
                        Join the world's leading investors and decision-makers leveraging our real-time African market narrative data.
                    </p>
                </div>
            </div>

            <div className="container py-16">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* OBSERVER (Free) */}
                    <Card className="border border-border bg-card hover:border-primary/30 transition-all">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Observer</CardTitle>
                            <CardDescription>Essential daily briefings.</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-black text-foreground">$0</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                <li className="flex gap-2 items-center text-sm"><CheckIcon className="h-4 w-4 text-primary" /> Daily Narrative Brief</li>
                                <li className="flex gap-2 items-center text-sm"><CheckIcon className="h-4 w-4 text-primary" /> Travel Booking Portal</li>
                                <li className="flex gap-2 items-center text-sm"><CheckIcon className="h-4 w-4 text-primary" /> Public Sector News</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full font-bold" variant="outline">Sign Up Free</Button>
                        </CardFooter>
                    </Card>

                    {/* SIGNAL (Pro) - Highlighted */}
                    <Card className="border-2 border-primary bg-card shadow-xl relative scale-105 z-10">
                        <div className="absolute top-0 right-0 p-4">
                            <Badge className="bg-primary text-white">RECOMMENDED</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-primary">Signal</CardTitle>
                            <CardDescription>For active investors & executives.</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-black text-foreground">$2,500</span>
                                <span className="text-muted-foreground">/yr</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                <li className="flex gap-2 items-center font-medium"><LightningBoltIcon className="h-4 w-4 text-primary" /> Real-time Sentiment Dashboards</li>
                                <li className="flex gap-2 items-center font-medium"><CheckIcon className="h-4 w-4 text-primary" /> Deep-Dive Sector Reports (PDF)</li>
                                <li className="flex gap-2 items-center font-medium"><CheckIcon className="h-4 w-4 text-primary" /> VIP Event Access</li>
                                <li className="flex gap-2 items-center font-medium"><CheckIcon className="h-4 w-4 text-primary" /> Warning Sign Alerts</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full font-bold text-lg h-12">Start Trial</Button>
                        </CardFooter>
                    </Card>

                    {/* SOVEREIGN (Enterprise) */}
                    <Card className="border border-border bg-card hover:border-primary/30 transition-all">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Sovereign</CardTitle>
                            <CardDescription>For Governments & Institutional.</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-black text-foreground">Custom</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                <li className="flex gap-2 items-center text-sm"><GlobeIcon className="h-4 w-4 text-primary" /> Nation-Branding Campaigns</li>
                                <li className="flex gap-2 items-center text-sm"><StarFilledIcon className="h-4 w-4 text-primary" /> Crisis Management Intel</li>
                                <li className="flex gap-2 items-center text-sm"><LockClosedIcon className="h-4 w-4 text-primary" /> API Access</li>
                                <li className="flex gap-2 items-center text-sm"><CheckIcon className="h-4 w-4 text-primary" /> Dedicated Analyst Team</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full font-bold" variant="outline" asChild>
                                <Link to="/strategic-services">Contact Sales</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                </div>
            </div>
        </Layout>
    );
};
