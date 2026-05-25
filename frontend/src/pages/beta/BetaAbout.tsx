import { useQuery } from '@tanstack/react-query';
import { BetaNav, BetaFooter } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';

export const BetaAbout = () => {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: api.getPlatformStats,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary">
      <SEO 
        title="About | BOA-Story" 
        description="A digital home for real, thoughtful stories about African lives, cities, and ideas — beyond charity ads and disaster headlines."
      />
      <BetaNav />
      {/* 1. HERO */}
      <section className="bg-primary pt-32 pb-24 px-6 border-b border-primary/10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="font-serif text-[48px] md:text-[72px] leading-tight mb-8">
            We're building Africa's story.<br />Properly.
          </h1>
        </div>
      </section>

      {/* 1b. Live platform stats strip — proof, not aspiration */}
      {stats && (
        <section className="border-b border-primary/8 bg-secondary">
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: stats.total_articles.toLocaleString(), label: 'Stories Published' },
              { value: stats.total_countries, label: 'Countries Covered' },
              { value: stats.regions, label: 'African Regions' },
              { value: stats.total_views > 1000 ? `${(stats.total_views / 1000).toFixed(1)}k` : stats.total_views, label: 'Total Reads' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-serif text-[2.25rem] font-bold text-accent leading-none mb-1">{value}</p>
                <p className="text-xs text-primary/40 uppercase tracking-widest font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="max-w-4xl mx-auto px-6">
        
        {/* 2. THE FOUNDER & MISSION */}
        <section className="py-24 border-b border-primary/8">
          <div className="prose prose-lg max-w-none prose-p:font-serif prose-p:text-[24px] prose-p:md:text-[32px] prose-p:leading-relaxed prose-p:text-primary/90">
            <p className="mb-12">
              I'm a student and independent writer trying to close the gap between the Africa you see in headlines and the Africa I hear about from friends, founders, and family. Here I'm building BOA-Story, a small, self-funded project to surface grounded stories about African cities, creators, and everyday opportunity.
            </p>
            <p>
              We're building this because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy — the businesses being built, the cultures thriving, the cities changing — deserves a platform built for it. Your support at this quiet, early stage is what turns <span className="text-accent italic">someone should build this</span> into <span className="text-accent italic">we're actually building it</span>.
            </p>
          </div>
        </section>

        {/* 3. WHAT WE'RE BUILDING */}
        <section className="py-24 border-b border-primary/8">
          <h2 className="font-serif text-[32px] md:text-[40px] mb-12 text-center md:text-left">What this actually is</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-xl border border-primary/8 hover:border-accent/50 hover:shadow-sm transition-all">
              <span className="text-3xl block mb-6 drop-shadow-sm">✍️</span>
              <h3 className="font-serif text-2xl mb-3 text-primary">Real Stories</h3>
              <p className="text-primary/70 text-sm leading-relaxed">
                A living digital platform built to surface real, grounded stories about African lives, cities, creators, and everyday opportunity.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-primary/8 hover:border-accent/50 hover:shadow-sm transition-all">
              <span className="text-3xl block mb-6 drop-shadow-sm">🚫</span>
              <h3 className="font-serif text-2xl mb-3 text-primary">Narrative Correction</h3>
              <p className="text-primary/70 text-sm leading-relaxed">
                Explicitly positioned against the dominant media framing of Africa as a place of crisis, charity, and disaster. Not a news outlet, not a charity, and not a personal blog.
              </p>
            </div>
          </div>
        </section>

        {/* 4. WHY NOW */}
        <section className="py-24 border-b border-primary/8">
          <h2 className="font-serif text-[32px] md:text-[40px] mb-8 text-center md:text-left">Why Ko-fi?</h2>
          <div className="prose max-w-3xl prose-p:text-lg prose-p:leading-loose text-primary/80">
            <p className="mb-6">
              The platform is currently in prototype and pre-launch stage. I chose Ko-fi because this is an independent, community-backed project.
            </p>
            <p>
              This isn't backed by venture capital or a media conglomerate. The Ko-fi page is the primary mechanism for converting early believers into financial backers who make the full launch possible.
            </p>
          </div>
        </section>

        {/* 6. CTA */}
        <section className="py-32 text-center relative z-10">
          <span className="text-4xl mb-6 block">☕</span>
          <h2 className="font-serif text-[36px] md:text-[56px] leading-tight mb-12 text-primary">
            Help me launch BOA-Story.
          </h2>
          <a 
            href="https://ko-fi.com/maillescortes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-card font-medium font-sans px-10 py-5 rounded-lg shadow-sm hover:brightness-110 transition-transform hover:-translate-y-1 text-lg"
          >
            Buy me a coffee on Ko-fi
          </a>
        </section>

      </main>

      <BetaFooter />
    </div>
  );
};
