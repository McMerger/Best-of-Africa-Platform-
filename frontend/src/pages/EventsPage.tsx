import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, SewingPinFilledIcon as MapPinIcon, ArrowRightIcon, StarIcon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { api } from '../services/api';
import type { CalendarEvent } from '../types';

const EVENT_CATEGORIES = ['All', 'Energy', 'Mining', 'Technology', 'Business', 'Investment', 'Trade', 'Agriculture', 'Finance'];

export const EventsPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeCategory = searchParams.get('type') || 'All';
    const activeCountry = searchParams.get('country') || '';

    useEffect(() => {
        const loadEvents = async () => {
            setLoading(true);
            try {
                const params: Record<string, string> = {};
                if (activeCategory !== 'All') params.type = activeCategory;
                if (activeCountry) params.country = activeCountry;
                const res = await api.getEvents(params);
                if (res.success) {
                    setEvents(res.data || []);
                }
            } catch (err) {
                console.error('Failed to load events:', err);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [activeCategory, activeCountry]);

    const setFilter = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value && value !== 'All') {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        setSearchParams(next);
    };

    return (
        <Layout>
            {/* Hero Section */}
            <div className="relative bg-background border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="container relative py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase bg-background text-primary border-primary/20 px-4 py-1">Global Summits</Badge>
                    <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 tracking-tight text-foreground">
                        <span dangerouslySetInnerHTML={{ __html: config?.['events_hero_headline'] || 'Where Decisions <br /> Are Made.' }} />
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium text-balance">
                        {config?.['events_hero_subhead'] || "Exclusive access to the continent's most consequential investment summits, policy forums, and private delegations."}
                    </p>
                </div>
            </div>

            <div className="container py-16">
                {/* Filter Bar */}
                <div className="mb-10 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MixerHorizontalIcon className="h-4 w-4" />
                        <span className="font-bold uppercase tracking-widest text-[10px]">Filter by Category</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {EVENT_CATEGORIES.map(cat => (
                            <Button
                                key={cat}
                                variant={activeCategory === cat ? 'default' : 'outline'}
                                size="sm"
                                className="rounded-full text-xs font-bold uppercase tracking-wider"
                                onClick={() => setFilter('type', cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-[2fr_1fr] gap-12">

                    {/* Main Calendar */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <CalendarIcon className="h-6 w-6 text-primary" /> Upcoming Summits
                                {events.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] font-bold rounded-full ml-2">{events.length}</Badge>
                                )}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-48 bg-muted animate-pulse rounded-3xl" />
                                ))
                            ) : events.length === 0 ? (
                                <div className="col-span-2 text-center py-16 border rounded-3xl bg-muted/10 border-dashed">
                                    <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                                    <p className="text-muted-foreground font-medium">No events match your filters.</p>
                                    <Button variant="ghost" size="sm" className="mt-4 text-primary" onClick={() => setSearchParams({})}>
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                events.map((event, index) => (
                                    <Card
                                        key={event.id}
                                        className={`group overflow-hidden transition-all hover:border-primary/50 hover:shadow-md cursor-pointer rounded-3xl flex flex-col ${index === 0 ? 'md:col-span-2' : ''}`}
                                        onClick={() => navigate(`/events/${event.slug || event.id}`)}
                                    >
                                        <CardContent className="p-0 flex flex-col h-full">
                                            <div className={`flex ${index === 0 ? 'flex-col md:flex-row' : 'flex-col'} h-full`}>
                                                <div className={`${index === 0 ? 'w-full md:w-32' : 'w-full h-24'} bg-muted/30 flex flex-col items-center justify-center p-4 border-b ${index === 0 ? 'md:border-b-0 md:border-r' : 'border-b'} border-border`}>
                                                    <span className="text-3xl font-black text-foreground">{new Date(event.date_start).getDate()}</span>
                                                    <span className="text-xs font-bold uppercase text-muted-foreground">{new Date(event.date_start).toLocaleString('default', { month: 'short' })}</span>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase tracking-wider rounded-full">{event.category}</Badge>
                                                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{event.title}</h3>
                                                        </div>
                                                        {event.is_vip && (
                                                            <Badge className="bg-primary text-primary-foreground rounded-full">VIP Access</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-4 mt-auto pt-4">
                                                        <span className="flex items-center gap-1"><MapPinIcon className="h-4 w-4" /> {event.location}</span>
                                                        {event.country_name && (
                                                            <span className="text-xs font-medium text-primary">{event.country_name}</span>
                                                        )}
                                                    </div>
                                                    {event.ai_context_brief && (
                                                        <p className="text-xs text-muted-foreground italic mt-3 line-clamp-1">
                                                            💡 {event.ai_context_brief}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className={`p-6 flex items-center justify-center ${index === 0 ? 'border-t md:border-t-0 md:border-l' : 'border-t'} border-border bg-muted/5`}>
                                                    <Button variant="ghost" className="font-bold group-hover:translate-x-1 transition-transform rounded-full">
                                                        <ArrowRightIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Copilot Sidebar */}
                    <aside className="space-y-8">
                        {/* Davos Debrief */}
                        <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative rounded-3xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <StarIcon className="h-5 w-5 fill-current" /> Davos 2026
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Strategic debrief and Africa-focused takeaways from the World Economic Forum.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="secondary"
                                    className="w-full font-bold text-primary bg-white hover:bg-white/90 rounded-full"
                                    onClick={() => navigate('/search?q=Davos')}
                                >
                                    Access Briefing
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Brussels Events - From Zoom Meeting */}
                        <Card className="rounded-3xl border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🇧🇪 Brussels Week
                                </CardTitle>
                                <CardDescription>
                                    Energy, oil, gas, mining & digital opportunities — strategic partnerships for Africa.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className="w-full font-bold rounded-full"
                                    onClick={() => setFilter('type', 'Energy')}
                                >
                                    Browse Energy Events
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Delegation Service */}
                        <Card className="rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Private Delegations</CardTitle>
                                <CardDescription>
                                    We organize bespoke government meetings and site visits for institutional investors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className="w-full font-bold rounded-full"
                                    onClick={() => navigate('/request-consultation')}
                                >
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
