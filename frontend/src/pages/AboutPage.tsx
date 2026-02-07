import React from 'react';
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { Layout } from '../components/Layout';
import { Badge } from '@/components/ui/badge';

export const AboutPage: React.FC = () => {
    const { data: config } = useSystemConfig();
    return (
        <Layout>
            <div className="container py-20 max-w-4xl mx-auto">
                <Badge variant="outline" className="mb-6 font-bold tracking-widest uppercase text-primary border-primary/20 px-4 py-1">Mission</Badge>
                <h1 className="text-5xl font-serif font-black mb-10 tracking-tight text-foreground">
                    {/* {config?.['about_headline'] || "New Narratives for a New Continent."} */}
                    <span dangerouslySetInnerHTML={{ __html: (config?.['about_headline'] || "New Narratives for a <br /> New Continent.") }} />
                </h1>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-xl leading-relaxed font-medium text-muted-foreground mb-8">
                        {config?.['about_mission_text'] || "Best of Africa is a unified public relations and strategic narrative platform, designed to strengthen Africa's image on the global stage by promoting—country by country—opportunities for tourism, investment, and sustainable development."}
                    </p>

                    <h3 className="text-2xl font-serif font-bold text-foreground mt-12 mb-4">Our Intelligence Core</h3>
                    <p>
                        Although we present as a human-curated brand to ensure authenticity, Best of Africa is at its core a <strong>native artificial intelligence platform</strong>. Our autonomous backend collects real-time data, processes signal from noise, and generates actionable intelligence for investors and policymakers.
                    </p>

                    <h3 className="text-2xl font-serif font-bold text-foreground mt-12 mb-4">Our Role</h3>
                    <div className="grid md:grid-cols-2 gap-8 not-prose my-8">
                        <div className="p-6 border border-border rounded-lg bg-card">
                            <h4 className="font-bold text-primary mb-2">{config?.['about_role_media_title'] || 'Media Outlet'}</h4>
                            <p className="text-sm text-muted-foreground">{config?.['about_role_media_desc'] || 'Premium pan-African content platform.'}</p>
                        </div>
                        <div className="p-6 border border-border rounded-lg bg-card">
                            <h4 className="font-bold text-primary mb-2">{config?.['about_role_intel_title'] || 'Market Intelligence'}</h4>
                            <p className="text-sm text-muted-foreground">{config?.['about_role_intel_desc'] || 'Ground-truth reporting combined with our proprietary Intelligence Engine.'}</p>
                        </div>
                        <div className="p-6 border border-border rounded-lg bg-card">
                            <h4 className="font-bold text-primary mb-2">{config?.['about_role_narrative_title'] || 'Narrative Diplomacy'}</h4>
                            <p className="text-sm text-muted-foreground">{config?.['about_role_narrative_desc'] || "Amplifying Africa's voice with rigor."}</p>
                        </div>
                        <div className="p-6 border border-border rounded-lg bg-card">
                            <h4 className="font-bold text-primary mb-2">{config?.['about_role_gateway_title'] || 'Business Gateway'}</h4>
                            <p className="text-sm text-muted-foreground">{config?.['about_role_gateway_desc'] || 'Trusted portal for opportunity.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
