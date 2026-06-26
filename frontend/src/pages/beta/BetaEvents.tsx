import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    const { scrollY } = useScroll();

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <SEO 
                title="Summits & Events | BOA-Story" 
                description="Exclusive forums, summits, and executive roundtables focused on African markets."
            />
            
            {/* Header */}
            <div className="relative min-h-[45vh] md:min-h-[50vh] flex flex-col justify-end pt-20 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 overflow-hidden border-b border-foreground/10">
                <motion.div 
                  className="absolute inset-0 z-0"
                  style={{ y: useTransform(scrollY, [0, 800], [0, 200]), scale: 1.05 }}
                >
                  <img
                    src="/images/v2_events_concrete_1780371229306.png"
                    alt="African Executive Summit"
                    className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
                  />
                  <div className="absolute inset-0 z-10 hero-scrim" />
                </motion.div>

                <div className="max-w-6xl mx-auto w-full relative z-30 text-white">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 backdrop-blur-md">
                            <UsersIcon size={14} />
                            Private Network
                        </div>
                        <h1 className="text-white text-[4rem] md:text-[5.5rem] font-serif leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl">
                            Summits & <br className="hidden md:block"/>Executive Forums
                        </h1>
                        <p className="text-[1.125rem] font-light text-white/70 max-w-2xl leading-[1.8] drop-shadow-md">
                            Connect with industry leaders, investors, and policymakers shaping the future of African markets at our curated events.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Event List */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16">
                {isLoading ? (
                    <div className="space-y-12">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 rounded-3xl bg-card border border-foreground/10 animate-pulse" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 md:py-32 text-foreground/40 bg-card rounded-3xl border border-foreground/10 shadow-2xl">
                        <CalendarIcon className="w-16 h-16 mx-auto mb-6 opacity-50" />
                        <h2 className="text-[2rem] font-serif mb-4">No upcoming events</h2>
                        <p className="text-[1.125rem] font-light">Check back later for newly scheduled summits.</p>
                    </motion.div>
                ) : (
                    <div className="grid gap-12">
                        {events.map((event: any, index: number) => (
                            <motion.div 
                                key={event.id} 
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="bg-card text-foreground rounded-3xl border border-foreground/10 overflow-hidden flex flex-col md:flex-row shadow-2xl group hover:border-accent/30 transition-colors duration-500"
                            >
                                <div className="md:w-5/12 relative overflow-hidden h-72 md:h-auto">
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-1000"
                                        style={{ backgroundImage: `url(${event.hero_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:hidden" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card hidden md:block" />
                                </div>
                                <div className="p-10 md:p-14 md:w-7/12 flex flex-col justify-center z-10">
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
                                            {event.event_type}
                                        </span>
                                        {event.is_exclusive && (
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                                                <UsersIcon size={14} /> Exclusive
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-[2.5rem] font-serif leading-none text-foreground mb-6">{event.title}</h2>
                                    <p className="text-foreground/60 mb-10 text-[1.125rem] font-light leading-[1.8] line-clamp-3">
                                        {event.description}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-6 mb-10 bg-foreground/5 border border-foreground/10 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 text-[15px] font-light text-foreground/80">
                                            <CalendarIcon className="w-5 h-5 text-accent" />
                                            {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-3 text-[15px] font-light text-foreground/80">
                                            <MapPinIcon className="w-5 h-5 text-accent" />
                                            {event.is_virtual ? 'Virtual Event' : event.location || 'TBA'}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-foreground/10">
                                        <span className="text-[13px] font-bold uppercase tracking-widest text-foreground/60">
                                            {event.status === 'Open' ? 'Registration Open' : event.status}
                                        </span>
                                        <Button 
                                            onClick={() => handleRegisterClick(event)}
                                            disabled={event.status !== 'Open' && event.status !== 'Upcoming'}
                                            className="w-full sm:w-auto rounded-xl gap-3 bg-accent text-navy hover:bg-gold-italic px-8 py-6 font-bold uppercase tracking-widest text-[11px]"
                                        >
                                            Register Interest <ArrowRightIcon size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Registration Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-foreground/10 text-foreground rounded-3xl p-8 shadow-2xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="font-serif text-[2rem] leading-none mb-2">{isSuccess ? 'Registration Confirmed' : 'Register for Event'}</DialogTitle>
                        <DialogDescription className="text-foreground/60 font-light text-[1.125rem]">
                            {isSuccess 
                                ? 'We have received your registration details.'
                                : selectedEvent?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <CheckCircleIcon className="w-20 h-20 text-accent mb-6" />
                            <h3 className="text-[2rem] font-serif mb-4">You're on the list!</h3>
                            <p className="text-foreground/60 font-light leading-relaxed mb-8">
                                Our team will be in touch shortly with your confirmation and attendance details.
                            </p>
                            <Button 
                                className="w-full rounded-xl px-8 py-6 bg-accent text-navy hover:brightness-110 font-bold uppercase tracking-widest text-[11px]"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Full Name</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                    className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Work Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="org" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Organization</Label>
                                <Input 
                                    id="org" 
                                    value={organization} 
                                    onChange={(e) => setOrganization(e.target.value)} 
                                    required 
                                    className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="ticket" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Ticket Type</Label>
                                <Select value={ticketType} onValueChange={setTicketType}>
                                    <SelectTrigger id="ticket" className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl">
                                        <SelectValue placeholder="Select ticket" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-foreground/10 text-foreground">
                                        <SelectItem value="Standard">Standard Pass</SelectItem>
                                        <SelectItem value="VIP">VIP Delegate</SelectItem>
                                        <SelectItem value="Media">Media/Press</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-6">
                                <Button 
                                    type="submit" 
                                    className="w-full rounded-xl gap-3 px-8 py-6 bg-accent text-navy hover:brightness-110 font-bold uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(201,168,76,0.2)] transition-all"
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
