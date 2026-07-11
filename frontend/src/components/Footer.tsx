import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee } from 'lucide-react';
import { KO_FI_URL } from '../constants/beta';
import { useLanguage } from '@/context/LanguageContext';

export const Footer: React.FC = () => {
    const { data: config } = useSystemConfig();
    const { t } = useLanguage();

    return (
        <footer className="relative mt-20 border-t border-white/10 bg-navy text-white overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-50" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="container relative z-10 pt-32 pb-12">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-32 grid gap-16 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
                >
                    {/* Brand / Mission Column */}
                    <div>
                        <div className="mb-6 font-serif text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-xl">
                            BEST OF AFRICA<span className="text-accent">.</span>
                        </div>
                        <div className="mb-6 flex items-center gap-3">
                            <span className="h-px w-8 bg-accent/50" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t('footer.brand_line', 'BOA-Story · Intelligence Platform')}</span>
                        </div>
                        <p className="mb-8 max-w-[400px] text-[1.125rem] font-serif font-light italic leading-[1.8] text-white/70">
                            "{config?.['footer_mission_statement'] || t('footer.tagline', 'Real stories about African lives, cities, and ideas, beyond charity ads and disaster headlines.')}"
                        </p>
                        <a
                            href={KO_FI_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3.5 text-[11px] uppercase tracking-widest font-bold text-navy shadow-[0_2px_16px_rgba(201,168,76,0.3)] hover:bg-gold-italic transition-all hover:scale-105"
                        >
                            <Coffee className="h-4 w-4" />
                            {t('footer.support', 'Support BOA, Launch Your Story')}
                        </a>
                    </div>

                    {/* Read */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">BOA-Story</h3>
                        <ul className="space-y-4 text-[13px] font-medium text-white/60">
                            <li><Link to="/posts" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.stories', 'Stories')}</Link></li>
                            <li><Link to="/feed" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.briefing', 'Daily Briefing')}</Link></li>
                            <li><Link to="/countries" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.countries', 'Countries')}</Link></li>
                            <li><Link to="/gallery" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.gallery', 'Gallery')}</Link></li>
                            <li><Link to="/supporter-feed" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.supporter', 'Supporter Feed')}</Link></li>
                        </ul>
                    </div>

                    {/* Intelligence */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t('group.intelligence', 'Intelligence')}</h3>
                        <ul className="space-y-4 text-[13px] font-medium text-white/60">
                            <li><Link to="/intelligence" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.intelligence', 'Market Intelligence')}</Link></li>
                            <li><Link to="/dashboards/overview" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.dashboard', 'Continental Dashboard')}</Link></li>
                            <li><Link to="/library" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.library', 'Saved Library')}</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t('group.services', 'Services')}</h3>
                        <ul className="space-y-4 text-[13px] font-medium text-white/60">
                            <li><Link to="/events" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.events', 'Summits & Events')}</Link></li>
                            <li><Link to="/request-consultation" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.concierge', 'Concierge')}</Link></li>
                            <li><Link to="/travel" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.travel', 'Business Travel')}</Link></li>
                        </ul>
                    </div>

                    {/* Membership & Account */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t('group.account', 'Membership & Account')}</h3>
                        <ul className="space-y-4 text-[13px] font-medium text-white/60">
                            <li><Link to="/membership" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.membership', 'Membership')}</Link></li>
                            <li><Link to="/newsletter" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.newsletter', 'Newsletter')}</Link></li>
                            <li><Link to="/member-access" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.member_access', 'Member Access')}</Link></li>
                            <li><Link to="/login" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.signin', 'Sign In')}</Link></li>
                            <li><Link to="/settings" className="transition-colors hover:text-accent flex items-center gap-2 group"><span className="w-0 h-px bg-accent transition-all group-hover:w-2" />{t('nav.settings', 'Settings')}</Link></li>
                        </ul>
                    </div>
                </motion.div>

                {/* Sub-Footer */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-10 text-[10px] font-bold uppercase tracking-widest text-white/60 md:flex-row"
                >
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <span>© {new Date().getFullYear()} Best of Africa. {t('footer.rights', 'All rights reserved.')}</span>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                        <Link to="/about" className="text-white/70 hover:text-accent transition-colors">{t('nav.about', 'About')}</Link>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                        <Link to="/contact" className="text-white/70 hover:text-accent transition-colors">{t('nav.contact', 'Contact')}</Link>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                        <Link to="/privacy" className="text-white/70 hover:text-accent transition-colors">{t('footer.privacy', 'Privacy Policy')}</Link>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                        <Link to="/terms" className="text-white/70 hover:text-accent transition-colors">{t('footer.terms', 'Terms of Service')}</Link>
                        <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
                        <Link to="/about" className="text-white/70 hover:text-accent transition-colors">{t('footer.editorial', 'Editorial Guidelines')}</Link>
                    </div>
                    <div className="flex items-center gap-3 text-accent/80">
                        <span>{t('footer.premium', 'Premium Pan-African Brand')}</span>
                    </div>
                </motion.div>
                
                {/* Massive Background Typography */}
                <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 0.03, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    aria-hidden="true"
                    className="absolute -bottom-10 md:-bottom-20 left-0 right-0 font-serif font-black text-[15vw] leading-none text-center pointer-events-none select-none text-white whitespace-nowrap overflow-hidden"
                >
                    AFRICA.
                </motion.div>
            </div>
        </footer>
    );
};
