import { Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E]">
      <SEO 
        title="About | Best of Africa" 
        description="We are building an investment-grade platform mapping Africa's rapidly growing venture, tech, and cultural markets."
      />
      <BetaNav />
      {/* 1. HERO */}
      <section className="bg-[#0A0F1E] pt-32 pb-24 px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-[48px] md:text-[72px] leading-tight mb-8">
            We're building Africa's story.<br />Properly.
          </h1>
        </div>
      </section>

      {/* 1b. Live platform stats strip — proof, not aspiration */}
      {stats && (
        <section className="border-b border-white/5 bg-[#111827]/60">
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: stats.total_articles.toLocaleString(), label: 'Stories Published' },
              { value: stats.total_countries, label: 'Countries Covered' },
              { value: stats.regions, label: 'African Regions' },
              { value: stats.total_views > 1000 ? `${(stats.total_views / 1000).toFixed(1)}k` : stats.total_views, label: 'Total Reads' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-serif text-[2.25rem] font-bold text-[#C9A84C] leading-none mb-1">{value}</p>
                <p className="text-xs text-white/40 uppercase tracking-widest font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="max-w-4xl mx-auto px-6">
        
        {/* 2. MISSION (Verbatim) */}
        <section className="py-24 border-b border-white/5">
          <div className="prose prose-invert prose-lg max-w-none prose-p:font-serif prose-p:text-[24px] prose-p:md:text-[32px] prose-p:leading-relaxed prose-p:text-white/90">
            <p>
              We're building this because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy — the businesses being built, the cultures thriving, the cities changing — deserves a platform built for it. Your support at this quiet, early stage is what turns <span className="text-[#C9A84C] italic">someone should build this</span> into <span className="text-[#C9A84C] italic">we're actually building it</span>.
            </p>
          </div>
        </section>

        {/* 3. WHAT WE'RE BUILDING */}
        <section className="py-24 border-b border-white/5">
          <h2 className="font-serif text-[32px] md:text-[40px] mb-12 text-center md:text-left">What we're building</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#111827] p-8 rounded-xl border border-white/10 hover:border-[#C9A84C]/30 transition-colors">
              <span className="text-3xl block mb-6 drop-shadow-sm">✍️</span>
              <h3 className="font-serif text-2xl mb-3 text-white">Narrative Stories</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Deep-dive journalism rooted in lived experience. We prioritize rigorous reporting that captures the dynamic reality of African innovators, creators, and operators.
              </p>
            </div>
            <div className="bg-[#111827] p-8 rounded-xl border border-white/10 hover:border-[#C9A84C]/30 transition-colors">
              <span className="text-3xl block mb-6 drop-shadow-sm">📊</span>
              <h3 className="font-serif text-2xl mb-3 text-white">Market Intelligence</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Premium, actionable data mapping the continent's venture capital, real estate, and industrial sectors. Built for investors who demand ground-truth precision.
              </p>
            </div>
            <div className="bg-[#111827] p-8 rounded-xl border border-white/10 hover:border-[#C9A84C]/30 transition-colors">
              <span className="text-3xl block mb-6 drop-shadow-sm">🌍</span>
              <h3 className="font-serif text-2xl mb-3 text-white">54 Country Hubs</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Dedicated vertical portals for every African nation. Exploring macro policy, creative economies, and vital statistics with localized expertise.
              </p>
            </div>
          </div>
        </section>

        {/* 4. WHY NOW */}
        <section className="py-24 border-b border-white/5">
          <h2 className="font-serif text-[32px] md:text-[40px] mb-8 text-center md:text-left">Why now?</h2>
          <div className="prose prose-invert max-w-3xl prose-p:text-lg prose-p:leading-loose text-white/80">
            <p className="mb-6">
              The framing of the African continent is undergoing a profound structural correction. The era of the pity narrative—of aid sectors defining the boundaries of African potential—is over. Global capital recognizes that the world's youngest populations, fastest-growing metropolitan economies, and most aggressive technological leapfrogging are happening here.
            </p>
            <p>
              Yet, the media and data infrastructure required to accurately map this growth remains fragmented and largely authored from the outside. We are building Best of Africa to bridge this gap. This is an investment-grade platform built from the ground up to document the continent not as a monolith to be saved, but as the world’s most dynamic emerging market engine.
            </p>
          </div>
        </section>

        {/* 5. TRANSPARENCY */}
        <section className="py-24 border-b border-white/5 text-center">
          <h2 className="font-serif text-[32px] md:text-[40px] mb-16">Where support goes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            <div className="bg-[#111827] p-6 rounded-xl border border-white/5 flex gap-5 items-start">
              <span className="text-3xl mt-1 opacity-90">🌐</span>
              <div>
                <h4 className="font-medium text-lg mb-1 text-white">Domain & Hosting</h4>
                <p className="text-white/60 text-sm leading-relaxed">Keeping the platform live, fast, and globally accessible.</p>
              </div>
            </div>
            <div className="bg-[#111827] p-6 rounded-xl border border-white/5 flex gap-5 items-start">
              <span className="text-3xl mt-1 opacity-90">🛠️</span>
              <div>
                <h4 className="font-medium text-lg mb-1 text-white">Dev & Design Tools</h4>
                <p className="text-white/60 text-sm leading-relaxed">Architecting a premium product experience at scale.</p>
              </div>
            </div>
            <div className="bg-[#111827] p-6 rounded-xl border border-white/5 flex gap-5 items-start">
              <span className="text-3xl mt-1 opacity-90">✍️</span>
              <div>
                <h4 className="font-medium text-lg mb-1 text-white">Research Time</h4>
                <p className="text-white/60 text-sm leading-relaxed">The quiet, intensive work required to uncover real stories.</p>
              </div>
            </div>
            <div className="bg-[#111827] p-6 rounded-xl border border-white/5 flex gap-5 items-start">
              <span className="text-3xl mt-1 opacity-90">⚙️</span>
              <div>
                <h4 className="font-medium text-lg mb-1 text-white">Data & Infrastructure</h4>
                <p className="text-white/60 text-sm leading-relaxed">The backend computing power that analyzes and distills our intelligence engine.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CTA */}
        <section className="py-32 text-center relative z-10">
          <h2 className="font-serif text-[36px] md:text-[56px] leading-tight mb-12 text-white">
            Join the founding story.
          </h2>
          <Link 
            to="/membership"
            className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-10 py-5 rounded-lg shadow-[0_20px_40px_rgba(201,168,76,0.15)] hover:brightness-110 transition-transform hover:-translate-y-1 text-lg"
          >
            Choose your Membership Tier
          </Link>
        </section>

      </main>

      <BetaFooter />
    </div>
  );
};
