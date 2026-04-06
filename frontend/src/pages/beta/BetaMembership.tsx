import React from 'react';
import { BetaNav } from '../../components/beta';

export const BetaMembership = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E]">
      <BetaNav />
      {/* 4. FOUNDING MEMBER TIERS (Extracted from BetaLanding) */}
      <section className="py-24 px-6 relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-[32px] md:text-[40px] mb-4">Join before the official launch</h2>
          <p className="text-[18px] text-white/70 max-w-2xl mx-auto">
            Your support right now covers domains, tools, and the time to report and ship.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
          {/* Tier 1: ROW Supporter Native config pattern */}
          <div className="bg-[#111827] border border-white/10 rounded-xl p-8 flex flex-col h-full transform transition-transform hover:-translate-y-1 duration-300">
            <h3 className="text-xl font-medium mb-2">Supporter</h3>
            <div className="text-3xl font-serif text-[#C9A84C] mb-6">$5<span className="text-sm font-sans text-white/50">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-white/80">
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Unlimited access to stories and collections</li>
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Access to selected newsletters and updates</li>
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Invites to online conversations and AMAs</li>
            </ul>
            <a href="https://ko-fi.com/boastory" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-lg border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors duration-200">
              Support this creator
            </a>
          </div>

          {/* Tier 2: Founding Member Recommendation pattern */}
          <div className="bg-[#111827] border-2 border-[#C9A84C] rounded-xl p-8 relative flex flex-col h-full transform md:-translate-y-4 shadow-2xl z-10 transition-transform hover:-translate-y-6 duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0A0F1E] text-[11px] font-bold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg whitespace-nowrap">
              Recommended
            </div>
            <h3 className="text-xl font-medium mb-2 mt-2">Founding Member</h3>
            <div className="text-4xl font-serif text-[#C9A84C] mb-6">$15<span className="text-sm font-sans text-white/50">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-white/90">
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Everything in Supporter</li>
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Full access to the beta platform</li>
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Direct input on future coverage priorities</li>
            </ul>
            <a href="https://ko-fi.com/boastory" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-lg bg-[#C9A84C] text-[#0A0F1E] font-medium hover:brightness-110 shadow-[0_0_20px_rgba(201,168,76,0.2)] transition-all duration-200">
              Join as Supporter
            </a>
          </div>

          {/* Tier 3: Partner Benefit patterns from Atlantic */}
          <div className="bg-[#111827] border border-white/10 rounded-xl p-8 flex flex-col h-full transform transition-transform hover:-translate-y-1 duration-300">
            <h3 className="text-xl font-medium mb-2">Partner</h3>
            <div className="text-3xl font-serif text-[#C9A84C] mb-6">$50<span className="text-sm font-sans text-white/50">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-white/80">
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Everything in Founding Member</li>
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Monthly executive Africa intelligence briefing</li>
              <li className="flex items-start"><span className="text-[#C9A84C] mr-3 mt-0.5">✓</span> Direct line to the editorial team</li>
            </ul>
            <a href="https://ko-fi.com/boastory" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-lg border border-white/20 text-white/90 hover:bg-white/5 transition-colors duration-200">
              Become a Partner
            </a>
          </div>
        </div>
      </section>

      {/* QUICK TIP One-Off MECHANIC (From Ko-Fi inspired config) */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-xl mx-auto text-center bg-[#111827] p-8 rounded-xl border border-white/10">
          <h3 className="font-serif text-2xl mb-3">Just passing through?</h3>
          <p className="text-white/60 text-sm mb-6">Your support keeps this reporting independent and brings African stories to the world.</p>
          <a href="https://ko-fi.com/boastory" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-transparent border border-[#C9A84C] text-[#C9A84C] px-6 py-3 rounded-full hover:bg-[#C9A84C]/10 transition-colors">
            Leave a small tip ☕
          </a>
        </div>
      </section>

    </div>
  );
};
