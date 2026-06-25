import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api } from '../../services/api';
import { PlaneIcon, BriefcaseIcon, BuildingIcon, CheckCircleIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';

export const BetaConcierge: React.FC = () => {
    const { scrollY } = useScroll();
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [organization, setOrganization] = useState('');
    const [serviceType, setServiceType] = useState('executive_travel');
    const [destination, setDestination] = useState('');
    const [details, setDetails] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const bookingMutation = useMutation({
        mutationFn: (data: any) => api.submitBookingRequest(data),
        onSuccess: () => {
            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
            toast.error("Failed to submit request. Please try again.");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        bookingMutation.mutate({
            contact_name: name,
            contact_email: email,
            organization,
            service_type: serviceType,
            destination,
            requirements: details,
            dates: "TBD" // Defaulting dates for initial inquiry
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <SEO 
                title="Concierge & Corporate Services | BOA-Story" 
                description="Bespoke travel, site visits, and corporate services for doing business in Africa."
            />
            
            {/* Header */}
            <div className="relative min-h-[50vh] flex flex-col justify-end pt-32 pb-20 px-6 overflow-hidden border-b border-foreground/10">
                <motion.div 
                  className="absolute inset-0 z-0"
                  style={{ y: useTransform(scrollY, [0, 800], [0, 200]), scale: 1.05 }}
                >
                  <img
                    src="/images/v2_concierge_concrete_1780371218016.png"
                    alt="African Luxury Concierge Desk"
                    className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
                  />
                  <div className="absolute inset-0 z-10 hero-scrim" />
                </motion.div>

                <div className="max-w-6xl mx-auto w-full relative z-30 text-white">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 backdrop-blur-md">
                            <BriefcaseIcon size={14} />
                            Private Client Services
                        </div>
                        <h1 className="text-white text-[4rem] md:text-[5.5rem] font-serif leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl">
                            Concierge & <br className="hidden md:block"/>Corporate Services
                        </h1>
                        <p className="text-[1.125rem] font-light text-white/70 max-w-2xl leading-[1.8] drop-shadow-md">
                            We facilitate seamless market entry, executive travel, and complex site visits across the continent. Flawless execution.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
                
                {/* Left Column: Services Info */}
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="lg:col-span-5 space-y-12">
                    <div>
                        <h2 className="text-[2.5rem] font-serif mb-6 leading-tight">Our Expertise</h2>
                        <p className="text-foreground/60 text-[1.125rem] leading-[1.8] font-light">
                            Doing business in Africa requires local knowledge and flawless execution. Our specialized booking and concierge team leverages direct VIP partnerships to ensure your executive trips and site visits are perfectly orchestrated.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-5 group">
                            <div className="w-14 h-14 rounded-full bg-card border border-foreground/10 flex items-center justify-center shrink-0 group-hover:border-accent/50 transition-colors shadow-lg">
                                <PlaneIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-serif text-[1.5rem] mb-2 text-foreground">Executive Travel</h3>
                                <p className="text-[15px] font-light text-foreground/50 leading-relaxed">Secure transportation, VIP airport protocols, and Tier-1 hotel reservations with exclusive corporate rates.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 group">
                            <div className="w-14 h-14 rounded-full bg-card border border-foreground/10 flex items-center justify-center shrink-0 group-hover:border-accent/50 transition-colors shadow-lg">
                                <BuildingIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-serif text-[1.5rem] mb-2 text-foreground">Site Visits</h3>
                                <p className="text-[15px] font-light text-foreground/50 leading-relaxed">Complex multi-city itineraries, translator/guide services, and secure transport for industrial or real estate site visits.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 group">
                            <div className="w-14 h-14 rounded-full bg-card border border-foreground/10 flex items-center justify-center shrink-0 group-hover:border-accent/50 transition-colors shadow-lg">
                                <BriefcaseIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-serif text-[1.5rem] mb-2 text-foreground">Market Entry Support</h3>
                                <p className="text-[15px] font-light text-foreground/50 leading-relaxed">Coordination of local meetings, visa assistance, and high-level government or corporate introductions.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Booking Form */}
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="lg:col-span-7">
                    <div className="bg-card text-foreground rounded-3xl border border-foreground/10 p-10 md:p-14 shadow-2xl relative overflow-hidden">
                        {isSuccess ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                                <CheckCircleIcon className="w-24 h-24 text-accent mb-8" />
                                <h3 className="text-[2.5rem] font-serif mb-4 leading-none">Request Received</h3>
                                <p className="text-foreground/60 text-[1.125rem] mb-12 max-w-md font-light leading-relaxed">
                                    Our concierge team will review your requirements and reach out within 24 hours to begin orchestrating your engagement.
                                </p>
                                <Button 
                                    className="rounded-xl px-10 py-6 bg-accent text-navy hover:bg-gold-italic font-bold uppercase tracking-widest text-[11px]"
                                    onClick={() => setIsSuccess(false)}
                                >
                                    Submit Another Request
                                </Button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-[2rem] font-serif mb-10 leading-none">Submit an Inquiry</h2>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="organization" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Organization / Company</Label>
                                            <Input 
                                                id="organization" 
                                                value={organization} 
                                                onChange={(e) => setOrganization(e.target.value)} 
                                                required 
                                                className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="serviceType" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Service Required</Label>
                                            <Select value={serviceType} onValueChange={setServiceType}>
                                                <SelectTrigger id="serviceType" className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl">
                                                    <SelectValue placeholder="Select service" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-foreground/10 text-foreground">
                                                    <SelectItem value="executive_travel">Executive Travel</SelectItem>
                                                    <SelectItem value="site_visit">Site Visit Coordination</SelectItem>
                                                    <SelectItem value="market_entry">Market Entry Support</SelectItem>
                                                    <SelectItem value="multi_city">Multi-City Package</SelectItem>
                                                    <SelectItem value="other">Other Inquiry</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="destination" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Primary Destination(s)</Label>
                                        <Input 
                                            id="destination" 
                                            placeholder="e.g. Lagos, Nigeria & Kigali, Rwanda"
                                            value={destination} 
                                            onChange={(e) => setDestination(e.target.value)} 
                                            required 
                                            className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="details" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Specific Requirements & Dates</Label>
                                        <Textarea 
                                            id="details" 
                                            placeholder="Please provide initial details regarding your required travel dates, group size, and primary objectives..."
                                            className="min-h-[160px] bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 rounded-xl resize-none p-4"
                                            value={details} 
                                            onChange={(e) => setDetails(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <div className="pt-6">
                                        <Button 
                                            type="submit" 
                                            className="w-full rounded-xl gap-3 px-10 py-6 bg-accent text-navy hover:brightness-110 font-bold uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(201,168,76,0.2)] transition-all"
                                            disabled={bookingMutation.isPending}
                                        >
                                            {bookingMutation.isPending ? 'Submitting...' : 'Submit Inquiry'} <ArrowRightIcon size={16} />
                                        </Button>
                                    </div>
                                    <p className="text-[13px] text-foreground/40 mt-6 leading-relaxed font-light text-center">
                                        By submitting this form, you consent to our team reviewing your requirements and communicating with you regarding concierge services. Your data is strictly confidential.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};
