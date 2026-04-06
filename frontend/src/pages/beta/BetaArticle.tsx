import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { BetaNav } from '../../components/beta';

export const BetaArticle = () => {
  useParams();

  // Placeholder static content for the requested emotional framing
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E]">
      <BetaNav />
      {/* Hero Image Placeholder */}
      <div className="w-full h-[300px] md:h-[400px] bg-gradient-to-b from-[#111827] to-[#0A0F1E] border-b border-white/5 relative">
         <div className="absolute bottom-6 left-6 md:left-12 flex gap-4 items-end">
           <span className="text-4xl md:text-5xl drop-shadow-lg">🇳🇬</span>
         </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        
        <header className="mb-12">
          <span className="text-[#C9A84C] text-[11px] font-bold tracking-widest uppercase mb-4 block">
            Technology • Nigeria
          </span>
          <h1 className="font-serif text-[36px] md:text-[48px] leading-tight mb-6">
            The Silent Exodus Reversing Course in Lagos
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-white/60 border-y border-white/5 py-5">
            <span className="uppercase tracking-wider">By Beta Desk</span>
            <span>•</span>
            <span>6 min read</span>
          </div>
        </header>

        <article className="prose prose-invert prose-p:font-sans prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-white/80 max-w-none relative pb-32">
          
          {/* Paragraph 1: Emotional scene hook */}
          <p className="mb-6">
            When Femi walked away from his senior engineering role at a major Silicon Valley firm late last year, his colleagues asked if he was taking a sabbatical. He wasn't. He was moving back to Yaba. For years, the story of Nigerian technical talent has been one of departure—brilliant minds quietly exporting their output to Western tech hubs via remote contracts or highly competitive visas. But on the ground in Lagos, the gravity is shifting.
          </p>

          {/* Paragraph 2: Context build */}
          <p className="mb-6">
            "We used to build for them because the infrastructure here couldn't support our ambition," Femi notes, sitting in a quietly humming co-working space that runs flawlessly through the city's notorious grid power fluctuations. "Now, the capital is here. The complex, unsolved problems are here. And honestly, the scale of impact is just completely different."
          </p>

          {/* Paragraph 3: Data / Broader impact */}
          <p className="mb-12">
            He isn't an anomaly. Over the past eighteen months, a new tranche of deeply capitalized, locally anchored venture funds has begun aggressively courting diaspora engineers. They aren't just pitching patriotism; they are offering competitive equity stacks to solve fundamental platform problems—from cross-border B2B settlement to unified identity verification protocols covering hundreds of millions of unbanked citizens.
          </p>

          {/* Blurred Section (Para 4 onwards) */}
          <div className="relative">
             <div className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur-[5px] z-10 flex flex-col items-center justify-center border border-white/10 rounded-xl p-8 shadow-2xl">
               <div className="bg-[#111827] p-4 rounded-full border border-[#C9A84C]/30 shadow-2xl mb-6">
                 <Lock className="w-8 h-8 text-[#C9A84C]" />
               </div>
               <h3 className="font-serif text-[28px] text-white mb-3 text-center">
                 This story is for Founding Members
               </h3>
               <p className="text-white/70 text-center mb-8 max-w-md">
                 Members sustain our in-depth reporting across the continent. Unlock unlimited access to stories, briefings, and country hubs.
               </p>
               <a 
                 href="https://ko-fi.com/boastory" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-lg transition-transform hover:-translate-y-0.5"
               >
                 Become a Founding Member
               </a>
             </div>

             <div className="opacity-30 select-none pointer-events-none" aria-hidden="true">
               <p className="mb-6">
                 The shift is palpable in the data. While global venture markets contracted significantly throughout 2024, early-stage capital targeting African infrastructure layers remained remarkably resilient. What changed wasn't the total volume of dollars, but who was managing them and where they were being deployed.
               </p>
               <p className="mb-6">
                 "We are no longer pitching to investors who need us to explain what a mobile money agent is," explains Amina, a founder who recently closed a $4M seed round entirely from Africa-focused syndicates. "The conversations have matured. We are talking about API reliability, not basic market validation."
               </p>
               <p className="mb-6">
                 This maturation of capital has fundamentally altered the talent equation. When local startups can match the stability (if not always the absolute base salary) of remote dev work, while offering massive equity upside in largely blue-ocean markets, the calculus for engineers changes. Femi's new team, building a unified logistics API, is entirely composed of senior developers who recently left remote contracts.
               </p>
             </div>
          </div>
        </article>
      </main>

      {/* More Stories Footer */}
      <aside className="bg-[#111827] border-t border-white/5 py-24 px-6 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-[32px] text-white">More Stories</h2>
            <Link to="/stories" className="text-[#C9A84C] font-semibold text-sm tracking-wider uppercase hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/stories" className="group bg-[#0A0F1E] rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors">
              <div className="p-6">
                <span className="text-2xl mb-4 block">🇷🇼</span>
                <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">
                  Kigali's Blueprint for the Climate-Resilient City
                </h4>
                <p className="text-sm text-white/50">8 min read</p>
              </div>
            </Link>
            <Link to="/stories" className="group bg-[#0A0F1E] rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors">
              <div className="p-6">
                <span className="text-2xl mb-4 block">🇬🇭</span>
                <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">
                  Accra's Creative Export Economy is Maturing
                </h4>
                <p className="text-sm text-white/50">5 min read</p>
              </div>
            </Link>
            <Link to="/stories" className="group bg-[#0A0F1E] rounded-xl overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-colors">
              <div className="p-6">
                <span className="text-2xl mb-4 block">🇰🇪</span>
                <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">
                  The Geothermal Advantage Quietly Powering Nairobi
                </h4>
                <p className="text-sm text-white/50">7 min read</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

    </div>
  );
};
