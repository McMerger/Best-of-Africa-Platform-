import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';

export const BetaEvents: React.FC = () => {
    const { data: eventsData, isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: () => api.getCorporateEvents()
    });

    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [organization, setOrganization] = useState('');
    const [ticketType, setTicketType] = useState('Standard');
    const [isSuccess, setIsSuccess] = useState(false);

    const registerMutation = useMutation({
        mutationFn: (data: any) => api.registerForEvent(selectedEvent.id, data),
        onSuccess: () => {
            setIsSuccess(true);
            toast.success("Successfully registered for event!");
        },
        onError: () => {
            toast.error("Failed to register. Please try again.");
        }
    });

    const handleRegisterClick = (event: any) => {
        setSelectedEvent(event);
        setIsSuccess(false);
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;
        
        registerMutation.mutate({
            user_email: email,
            user_name: name,
            user_organization: organization,
            ticket_type: ticketType
        });
    };

    const events = eventsData?.data || [];

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO 
                title="Summits & Events | BOA-Story" 
                description="Exclusive forums, summits, and executive roundtables focused on African markets."
            />
            
            {/* Header */}
            <div className="bg-primary text-primary-foreground pt-20 pb-16 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight mb-6">
                        Summits & Executive Forums
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                        Connect with industry leaders, investors, and policymakers shaping the future of African markets at our curated events.
                    </p>
                </div>
            </div>

            {/* Event List */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 rounded-xl dark bg-card text-card-foreground border border-border/50 animate-pulse" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-medium mb-2">No upcoming events</h2>
                        <p>Check back later for newly scheduled summits.</p>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {events.map((event: any) => (
                            <div key={event.id} className="dark bg-card text-card-foreground rounded-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow">
                                <div 
                                    className="md:w-1/3 h-48 md:h-auto bg-cover bg-center"
                                    style={{ backgroundImage: `url(${event.hero_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'})` }}
                                />
                                <div className="p-8 md:w-2/3 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full">
                                            {event.event_type}
                                        </span>
                                        {event.is_exclusive && (
                                            <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full flex items-center gap-1">
                                                <UsersIcon size={12} /> Exclusive
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-serif font-bold text-foreground mb-3">{event.title}</h2>
                                    <p className="text-muted-foreground mb-6 line-clamp-2">
                                        {event.description}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <CalendarIcon className="w-4 h-4 text-primary/60" />
                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <MapPinIcon className="w-4 h-4 text-primary/60" />
                                            {event.is_virtual ? 'Virtual Event' : event.location || 'TBA'}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-border/50">
                                        <span className="text-sm font-semibold text-primary">
                                            {event.status === 'Open' ? 'Registration Open' : event.status}
                                        </span>
                                        <Button 
                                            onClick={() => handleRegisterClick(event)}
                                            disabled={event.status !== 'Open' && event.status !== 'Upcoming'}
                                            className="rounded-full gap-2"
                                        >
                                            Register Interest <ArrowRightIcon size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Registration Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isSuccess ? 'Registration Confirmed' : 'Register for Event'}</DialogTitle>
                        <DialogDescription>
                            {isSuccess 
                                ? 'We have received your registration details.'
                                : selectedEvent?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircleIcon className="w-16 h-16 text-accent mb-4" />
                            <h3 className="text-xl font-serif font-bold mb-2">You're on the list!</h3>
                            <p className="text-muted-foreground">
                                Our team will be in touch shortly with your confirmation and attendance details.
                            </p>
                            <Button 
                                className="mt-6 w-full rounded-full"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="org">Organization</Label>
                                <Input 
                                    id="org" 
                                    value={organization} 
                                    onChange={(e) => setOrganization(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ticket">Ticket Type</Label>
                                <Select value={ticketType} onValueChange={setTicketType}>
                                    <SelectTrigger id="ticket">
                                        <SelectValue placeholder="Select ticket" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard Pass</SelectItem>
                                        <SelectItem value="VIP">VIP Delegate</SelectItem>
                                        <SelectItem value="Media">Media/Press</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button 
                                    type="submit" 
                                    className="w-full rounded-full"
                                    disabled={registerMutation.isPending}
                                >
                                    {registerMutation.isPending ? 'Submitting...' : 'Complete Registration'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
