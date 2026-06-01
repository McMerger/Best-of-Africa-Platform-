import React from 'react';
import { motion } from 'framer-motion';
import { PlaneIcon, ShieldCheckIcon, StarIcon, CheckIcon, ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { SEO } from '../../components/SEO';

const HOTELS = [
    {
        name: "The Mora Zanzibar",
        location: "Zanzibar, Tanzania",
        description: "A luxury lifestyle resort offering an effortlessly chic business retreat. Perfect for executive retreats and strategy offsites.",
        image: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=800",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "$100 Resort Credit", "Early check-in/late checkout"]
    },
    {
        name: "Santorini Mozambique",
        location: "Vilanculo, Mozambique",
        description: "Perched above the red cliffs of King Fisher Bay. Designed like a Greek village but deeply rooted in African hospitality.",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "$100 Spa Credit", "Complimentary airport transfers"]
    },
    {
        name: "Polana Serena Hotel",
        location: "Maputo, Mozambique",
        description: "The 'Grand Dame' of Maputo. A historic, palatial hotel offering the finest executive amenities and secure conference facilities in the capital.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "Complimentary high-speed WiFi", "Early check-in/late checkout"]
    }
];

export const BetaTravel: React.FC = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO 
                title="Africa Business Travel Guide | BOA-Story" 
                description="Curated corporate travel and VIP hotel partnerships across the African continent."
            />
            
            {/* Hero Section */}
            <div className="bg-primary text-primary-foreground pt-20 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-accent text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        <PlaneIcon size={14} />
                        Business Travel Guide
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight mb-6">
                        Travel with Confidence.
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
                        We've negotiated direct VIP partnerships with the continent's finest business hotels to ensure your stays are secure, productive, and exceptionally comfortable.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/request-consultation">
                            <Button className="w-full sm:w-auto rounded-full font-medium px-8 py-6 text-base" size="lg">
                                Request Custom Itinerary
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Why Book With Us */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
                <div className="dark bg-card text-card-foreground rounded-2xl border border-border/50 shadow-lg p-8 md:p-12">
                    <div className="grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/50">
                        <div className="px-4 py-4 md:py-0">
                            <StarIcon className="w-10 h-10 text-accent mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">Exclusive VIP Benefits</h3>
                            <p className="text-muted-foreground text-sm">Room upgrades, resort credits, and complimentary daily breakfasts at partner properties.</p>
                        </div>
                        <div className="px-4 py-4 md:py-0">
                            <ShieldCheckIcon className="w-10 h-10 text-accent mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">Vetted for Business</h3>
                            <p className="text-muted-foreground text-sm">Every property is vetted for executive-grade security, reliable connectivity, and professional amenities.</p>
                        </div>
                        <div className="px-4 py-4 md:py-0">
                            <CheckIcon className="w-10 h-10 text-accent mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">No Hidden Costs</h3>
                            <p className="text-muted-foreground text-sm">Book directly through our portal to receive negotiated corporate rates with no additional service fees.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Partners */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-bold mb-4">Tier 1 VIP Partners</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        We earn a commission when you book directly with our partners at no additional cost to you. Booking through us unlocks exclusive VIP benefits not available on public booking engines.
                    </p>
                </div>

                <div className="space-y-12">
                    {HOTELS.map((hotel, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="dark bg-card text-card-foreground rounded-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row group"
                        >
                            <div 
                                className="md:w-5/12 h-64 md:h-auto bg-cover bg-center"
                                style={{ backgroundImage: `url(${hotel.image})` }}
                            />
                            <div className="p-8 md:w-7/12 flex flex-col">
                                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-primary/50">
                                    {hotel.location}
                                </div>
                                <h3 className="text-2xl font-serif font-bold mb-3">{hotel.name}</h3>
                                <p className="text-muted-foreground mb-6">
                                    {hotel.description}
                                </p>
                                
                                <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-8">
                                    <div className="flex items-center gap-2 mb-4 font-bold text-sm uppercase tracking-wide text-accent">
                                        <StarIcon size={16} /> VIP Benefits Included
                                    </div>
                                    <ul className="grid sm:grid-cols-2 gap-3">
                                        {hotel.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckIcon className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/50">
                                    <span className="text-sm text-muted-foreground italic">
                                        *Benefits applied automatically
                                    </span>
                                    <Link to="/request-consultation">
                                        <Button className="w-full sm:w-auto rounded-full gap-2">
                                            Book with VIP Benefits <ArrowRightIcon size={16} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Affiliate Disclosure */}
                <div className="mt-20 p-6 bg-muted/50 rounded-xl border border-border text-center text-sm text-muted-foreground max-w-4xl mx-auto">
                    <p>
                        <strong>Editorial Disclosure:</strong> We earn revenue through affiliate links when you book hotels, flights, or services through our links. This helps keep our intelligence platform running. Our editorial recommendations are never influenced by affiliate partnerships—we only recommend properties and services we genuinely believe will benefit business travelers in Africa.
                    </p>
                </div>
            </div>
        </div>
    );
};
