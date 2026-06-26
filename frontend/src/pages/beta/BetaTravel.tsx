import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    const { scrollY } = useScroll();

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <SEO 
                title="Africa Business Travel Guide | BOA-Story" 
                description="Curated corporate travel and VIP hotel partnerships across the African continent."
            />
            
            {/* Hero Section */}
            <div className="relative min-h-[60vh] flex flex-col justify-end pt-32 pb-24 px-6 overflow-hidden border-b border-foreground/10">
                <motion.div 
                  className="absolute inset-0 z-0"
                  style={{ y: useTransform(scrollY, [0, 800], [0, 200]), scale: 1.05 }}
                >
                  <img
                    src="/images/v2_travel_concrete_1780371206765.png"
                    alt="Luxury African Eco-Lodge"
                    className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
                  />
                  <div className="absolute inset-0 z-10 hero-scrim" />
                </motion.div>

                <div className="max-w-5xl mx-auto w-full relative z-30 text-center text-white">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full mb-8 backdrop-blur-md">
                            <PlaneIcon size={14} />
                            Business Travel Guide
                        </div>
                        <h1 className="text-white text-[2.75rem] sm:text-[4rem] md:text-[6rem] font-serif leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl">
                            Travel with <br className="hidden md:block"/><span className="text-accent italic">Confidence.</span>
                        </h1>
                        <p className="text-[1.125rem] font-light text-white/70 max-w-2xl mx-auto mb-12 leading-[1.8] drop-shadow-md">
                            We've negotiated direct VIP partnerships with the continent's finest business hotels to ensure your stays are secure, productive, and exceptionally comfortable.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/request-consultation">
                                <Button className="w-full sm:w-auto rounded-xl font-bold uppercase tracking-widest text-[11px] px-10 py-6 bg-accent text-navy hover:brightness-110 shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all">
                                    Request Custom Itinerary
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Why Book With Us */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-30">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="bg-card text-foreground rounded-3xl border border-foreground/10 shadow-2xl p-8 md:p-14 backdrop-blur-xl">
                    <div className="grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="px-6 py-4 md:py-0">
                            <StarIcon className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h3 className="text-xl font-serif font-bold mb-3">Exclusive VIP Benefits</h3>
                            <p className="text-foreground/50 text-[15px] leading-relaxed font-light">Room upgrades, resort credits, and complimentary daily breakfasts at partner properties.</p>
                        </div>
                        <div className="px-6 py-4 md:py-0">
                            <ShieldCheckIcon className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h3 className="text-xl font-serif font-bold mb-3">Vetted for Business</h3>
                            <p className="text-foreground/50 text-[15px] leading-relaxed font-light">Every property is vetted for executive-grade security, reliable connectivity, and professional amenities.</p>
                        </div>
                        <div className="px-6 py-4 md:py-0">
                            <CheckIcon className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h3 className="text-xl font-serif font-bold mb-3">No Hidden Costs</h3>
                            <p className="text-foreground/50 text-[15px] leading-relaxed font-light">Book directly through our portal to receive negotiated corporate rates with no additional service fees.</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Featured Partners */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-24">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
                    <h2 className="text-[3rem] font-serif mb-6 text-foreground leading-none">Tier 1 VIP Partners</h2>
                    <p className="text-foreground/60 max-w-2xl mx-auto text-[1.125rem] font-light leading-relaxed">
                        We earn a commission when you book directly with our partners at no additional cost to you. Booking through us unlocks exclusive VIP benefits not available on public booking engines.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {HOTELS.map((hotel, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="bg-card text-foreground rounded-3xl border border-foreground/10 overflow-hidden flex flex-col md:flex-row shadow-2xl group hover:border-accent/30 transition-all duration-500"
                        >
                            <div className="md:w-5/12 relative overflow-hidden h-72 md:h-auto">
                                <div 
                                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-1000"
                                    style={{ backgroundImage: `url(${hotel.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent md:hidden" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card hidden md:block" />
                            </div>
                            <div className="p-10 md:p-14 md:w-7/12 flex flex-col z-10">
                                <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-accent">
                                    {hotel.location}
                                </div>
                                <h3 className="text-[2.5rem] font-serif leading-none mb-6 text-foreground">{hotel.name}</h3>
                                <p className="text-foreground/60 mb-10 text-[1.125rem] font-light leading-[1.8]">
                                    {hotel.description}
                                </p>
                                
                                <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-8 mb-10">
                                    <div className="flex items-center gap-3 mb-6 font-bold text-[11px] uppercase tracking-widest text-accent">
                                        <StarIcon size={16} /> VIP Benefits Included
                                    </div>
                                    <ul className="grid sm:grid-cols-2 gap-4">
                                        {hotel.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-3 text-[15px] font-light text-foreground/80">
                                                <CheckIcon className="w-5 h-5 text-accent mt-0 shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-6 items-center justify-between border-t border-foreground/10">
                                    <span className="text-[13px] text-foreground/40 italic">
                                        *Benefits applied automatically
                                    </span>
                                    <Link to="/request-consultation">
                                        <Button className="w-full sm:w-auto rounded-xl gap-3 bg-accent text-navy hover:bg-gold-italic px-8 py-6 font-bold uppercase tracking-widest text-[11px]">
                                            Book with VIP Benefits <ArrowRightIcon size={16} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Affiliate Disclosure */}
                <div className="mt-24 p-8 bg-card rounded-2xl border border-foreground/5 text-center text-foreground/40 font-light max-w-4xl mx-auto">
                    <p className="text-[13px] leading-[1.8]">
                        <strong className="text-foreground/60">Editorial Disclosure:</strong> We earn revenue through affiliate links when you book hotels, flights, or services through our links. This helps keep our intelligence platform running. Our editorial recommendations are never influenced by affiliate partnerships, and we only recommend properties and services we genuinely believe will benefit business travelers in Africa.
                    </p>
                </div>
            </div>
        </div>
    );
};
