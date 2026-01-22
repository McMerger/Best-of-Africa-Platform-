import React from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, SewingPinFilledIcon as MapPinIcon, ArrowRightIcon, StarIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';

export const EventsPage: React.FC = () => {
    const events = [
        {
            title: "Africa Investment Forum 2026",
            date: "Nov 12-14, 2026",
            location: "Johannesburg, South Africa",
            category: "Investment",
            status: "Registration Open",
            isVip: true
        },
        {
            title: "Mining Indaba",
            date: "Feb 05-08, 2027",
            location: "Cape Town, South Africa",
            category: "Resources",
            status: "Waitlist",
            isVip: false
        },
        {
            title: "Africa Energy Week",
            date: "Oct 22-26, 2026",
            location: "Lagos, Nigeria",
            category: "Energy",
            status: "Registration Open",
            isVip: false
        }
    ];

    return (
        <Layout>
            {/* Hero Section */}
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="container relative py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-background text-primary border-primary/20 px-4 py-1">Global Summits</Badge>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-foreground">
                        Where Decisions <br /> Are Made.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium text-balance">
                        Exclusive access to the continent's most consequential investment summits, policy forums, and private delegations.
                    </p>
                </div>
            </div>

            <div className="container py-16">
                <div className="grid lg:grid-cols-[2fr_1fr] gap-12">

                    {/* Main Calendar */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-primary" /> Upcoming Summits
                            </h2>
                            <Button variant="outline" size="sm">Download Calendar</Button>
                        </div>

                        {events.map((event, index) => (
                            <Card key={index} className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-32 bg-muted/30 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-border">
                                            <span className="text-3xl font-black text-foreground">{event.date.split(' ')[1].split('-')[0]}</span>
                                            <span className="text-xs font-bold uppercase text-muted-foreground">{event.date.split(' ')[0]}</span>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase tracking-wider">{event.category}</Badge>
                                                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                                                </div>
                                                {event.isVip && (
                                                    <Badge className="bg-primary text-primary-foreground">VIP Access</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground gap-4">
                                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
                                                <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                                                <span>{event.status}</span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-border bg-muted/5">
                                            <Button variant="ghost" className="font-bold group-hover:translate-x-1 transition-transform">
                                                Details <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Copilot Sidebar (Davos & Delegations) */}
                    <aside className="space-y-8">
                        {/* Davos Debrief */}
                        <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-current" /> Davos 2026
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Strategic debrief and Africa-focused takeaways from the World Economic Forum.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="secondary" className="w-full font-bold text-primary bg-white hover:bg-white/90">
                                    Access Briefing
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Delegation Service */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Private Delegations</CardTitle>
                                <CardDescription>
                                    We organize bespoke government meetings and site visits for institutional investors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full font-bold">
                                    Request Access
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </Layout>
    );
};
