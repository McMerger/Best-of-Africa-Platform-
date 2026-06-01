import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
        <div className="min-h-screen bg-background pb-20">
            <SEO 
                title="Concierge & Corporate Services | BOA-Story" 
                description="Bespoke travel, site visits, and corporate services for doing business in Africa."
            />
            
            {/* Header */}
            <div className="bg-primary text-primary-foreground pt-20 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight mb-6">
                        Concierge & Corporate Services
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                        We facilitate seamless market entry, executive travel, and complex site visits across the continent.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Column: Services Info */}
                <div className="lg:col-span-5 space-y-10">
                    <div>
                        <h2 className="text-2xl font-serif font-bold mb-4">Our Expertise</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Doing business in Africa requires local knowledge and flawless execution. Our specialized booking and concierge team leverages direct VIP partnerships to ensure your executive trips and site visits are perfectly orchestrated.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <PlaneIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Executive Travel</h3>
                                <p className="text-sm text-muted-foreground">Secure transportation, VIP airport protocols, and Tier-1 hotel reservations with exclusive corporate rates.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <BuildingIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Site Visits</h3>
                                <p className="text-sm text-muted-foreground">Complex multi-city itineraries, translator/guide services, and secure transport for industrial or real estate site visits.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <BriefcaseIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Market Entry Support</h3>
                                <p className="text-sm text-muted-foreground">Coordination of local meetings, visa assistance, and high-level government or corporate introductions.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking Form */}
                <div className="lg:col-span-7">
                    <div className="dark bg-card text-card-foreground rounded-2xl border border-border/50 p-8 md:p-10 shadow-lg">
                        {isSuccess ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                                <CheckCircleIcon className="w-20 h-20 text-accent mb-6" />
                                <h3 className="text-3xl font-serif font-bold mb-4">Request Received</h3>
                                <p className="text-muted-foreground text-lg mb-8 max-w-md">
                                    Our concierge team will review your requirements and reach out within 24 hours to begin orchestrating your engagement.
                                </p>
                                <Button 
                                    className="rounded-full"
                                    onClick={() => setIsSuccess(false)}
                                >
                                    Submit Another Request
                                </Button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-serif font-bold mb-8">Submit an Inquiry</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="organization">Organization / Company</Label>
                                            <Input 
                                                id="organization" 
                                                value={organization} 
                                                onChange={(e) => setOrganization(e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="serviceType">Service Required</Label>
                                            <Select value={serviceType} onValueChange={setServiceType}>
                                                <SelectTrigger id="serviceType">
                                                    <SelectValue placeholder="Select service" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="executive_travel">Executive Travel</SelectItem>
                                                    <SelectItem value="site_visit">Site Visit Coordination</SelectItem>
                                                    <SelectItem value="market_entry">Market Entry Support</SelectItem>
                                                    <SelectItem value="multi_city">Multi-City Package</SelectItem>
                                                    <SelectItem value="other">Other Inquiry</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="destination">Primary Destination(s)</Label>
                                        <Input 
                                            id="destination" 
                                            placeholder="e.g. Lagos, Nigeria & Kigali, Rwanda"
                                            value={destination} 
                                            onChange={(e) => setDestination(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="details">Specific Requirements & Dates</Label>
                                        <Textarea 
                                            id="details" 
                                            placeholder="Please provide initial details regarding your required travel dates, group size, and primary objectives..."
                                            className="min-h-[120px]"
                                            value={details} 
                                            onChange={(e) => setDetails(e.target.value)} 
                                            required 
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button 
                                            type="submit" 
                                            className="w-full md:w-auto rounded-full gap-2 px-8"
                                            disabled={bookingMutation.isPending}
                                        >
                                            {bookingMutation.isPending ? 'Submitting...' : 'Submit Inquiry'} <ArrowRightIcon size={16} />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        By submitting this form, you consent to our team reviewing your requirements and communicating with you regarding concierge services. Your data is strictly confidential.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
