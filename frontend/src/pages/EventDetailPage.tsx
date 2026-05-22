import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    CalendarIcon,
    SewingPinFilledIcon,
    PersonIcon,
    Share2Icon,
    ArrowLeftIcon,
    InfoCircledIcon
} from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { EventRegistrationForm } from '@/components/EventRegistrationForm';

interface EventDetail {
    id: string;
    title: string;
    date: string;
    date_end?: string;
    location: string;
    country_name?: string;
    country_code?: string;
    category: string;
    description: string;
    ai_context_brief?: string;
    registration_url?: string;
    agenda?: Array<{ time: string; activity: string; speaker?: string }>;
    speakers?: Array<{ name: string; role: string; organization: string; image?: string }>;
    spots_remaining?: number;
}

export function EventDetailPage() {
    // slug param here maps to :id in route definition, but effectively can be ID or slug
    // Route definition is /events/:slug in App.tsx? No, wait, App.tsx has /events/:id or similar?
    // Let me check App.tsx plan: <Route path="/events/:id" element={<EventDetailPage />} />
    // So standard param is 'id' usually, but let's check what I put in implementation plan.
    // It says :id. So useParams will return { id: string }.

    // Wait, I haven't updated App.tsx yet. I will use 'id' as param name.

    const params = useParams<{ id: string }>();
    const id = params.id;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchEvent = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/services/events/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Event not found");
                    throw new Error("Failed to fetch event");
                }
                const json = await res.json();
                setEvent(json.data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto py-12 px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-12 w-3/4" />
                        <div className="flex gap-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="container mx-auto py-24 px-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
                <p className="text-muted-foreground mb-8">
                    The event you are looking for does not exist or has been removed.
                </p>
                <Button asChild>
                    <Link to="/events">Back to Events</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Hero Section */}
            <div className="bg-muted/30 border-b">
                <div className="container mx-auto py-12 px-4 max-w-6xl">
                    <Link
                        to="/events"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Back to Events
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="space-y-4 max-w-3xl">
                            <Badge variant="secondary" className="mb-2">
                                {event.category}
                            </Badge>
                            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground">
                                {event.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-muted-foreground pt-2">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-primary" />
                                    <span className="font-medium text-foreground">
                                        {format(new Date(event.date), 'MMMM d, yyyy')}
                                    </span>
                                    {event.date_end && (
                                        <span>- {format(new Date(event.date_end), 'MMMM d, yyyy')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <SewingPinFilledIcon className="w-5 h-5 text-primary" />
                                    <span>
                                        {event.location}
                                        {event.country_name && `, ${event.country_name}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" className="hidden md:flex">
                            <Share2Icon className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto py-12 px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Strategic Context Brief */}
                        {event.ai_context_brief && (
                            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-3xl p-6">
                                <div className="flex items-start gap-3">
                                    <InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                            Strategic Context
                                        </h3>
                                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                            {event.ai_context_brief}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* About */}
                        <section>
                            <h2 className="text-2xl font-serif font-bold mb-4">About This Event</h2>
                            <div className="prose prose-stone dark:prose-invert max-w-none">
                                <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                                    {event.description}
                                </p>
                            </div>
                        </section>

                        {/* Agenda */}
                        {event.agenda && event.agenda.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-serif font-bold">Agenda</h2>
                                    {/* <Button variant="ghost" size="sm">Download PDF</Button> */}
                                </div>
                                <div className="space-y-6 relative border-l-2 border-muted ml-3 pl-8 py-2">
                                    {event.agenda.map((item, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[39px] top-1 h-5 w-5 rounded-full border-2 border-background bg-primary ring-4 ring-background" />
                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8">
                                                <span className="font-mono text-sm font-medium text-primary w-24 shrink-0">
                                                    {item.time}
                                                </span>
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{item.activity}</h4>
                                                    {item.speaker && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {item.speaker}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Speakers */}
                        {event.speakers && event.speakers.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-serif font-bold mb-6">Featured Speakers</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {event.speakers.map((speaker, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <Avatar className="h-12 w-12 border">
                                                <AvatarImage src={speaker.image} />
                                                <AvatarFallback>{speaker.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="font-semibold">{speaker.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {speaker.role}
                                                </p>
                                                <p className="text-xs font-medium text-primary mt-0.5">
                                                    {speaker.organization}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar - Registration */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <Card className="shadow-lg border-muted">
                                <div className="bg-primary/5 p-6 border-b">
                                    <h3 className="font-serif font-bold text-xl mb-1">
                                        Secure Your Spot
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Register now to attend {event.title}
                                    </p>
                                </div>
                                <CardContent className="p-6">
                                    <div className="mb-6 flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Capacity</span>
                                        <span className="font-medium flex items-center gap-1.5">
                                            <PersonIcon className="w-4 h-4" />
                                            {event.spots_remaining !== undefined && event.spots_remaining !== null
                                                ? `${event.spots_remaining} seats left`
                                                : "Open Registration"}
                                        </span>
                                    </div>

                                    {event.registration_url && (
                                        <>
                                            <a
                                                href={event.registration_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center w-full rounded-full bg-primary text-primary-foreground py-3 px-6 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors mb-4 shadow-sm"
                                            >
                                                Register on Official Site &rarr;
                                            </a>
                                            <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mb-4">or register below</div>
                                        </>
                                    )}

                                    <Separator className="my-6" />

                                    <EventRegistrationForm eventId={event.id} />

                                    <p className="text-xs text-center text-muted-foreground mt-6">
                                        By registering, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </CardContent>
                            </Card>

                            {event.country_code && (
                                <Card className="rounded-3xl border-border">
                                    <CardContent className="p-5">
                                        <Link
                                            to={`/countries/${event.country_code}`}
                                            className="flex items-center gap-3 text-sm font-bold text-foreground hover:text-primary transition-colors"
                                        >
                                            <span className="text-xl">🌍</span>
                                            <div>
                                                <div>Explore {event.country_name || event.country_code}</div>
                                                <span className="text-xs font-normal text-muted-foreground">Visa, business portals & investment intel</span>
                                            </div>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
