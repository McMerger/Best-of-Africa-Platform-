import { useState } from 'react';
import { BetaNav, BetaFooter, MembershipTiersGrid } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { KO_FI_URL } from '../../constants/beta';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'What does my membership actually fund?',
    a: 'Every dollar goes toward domain and hosting costs, AI infrastructure for content research, and the time required to produce original, rigorous reporting. We publish a transparent breakdown on our About page.',
  },
  {
    q: 'Is there a free trial or refund policy?',
    a: "Memberships are processed through Ko-fi. You can cancel at any time from your Ko-fi dashboard — no lock-in periods. If you're unhappy for any reason, reach out and we'll sort it out.",
  },
  {
    q: 'What is the beta platform hub?',
    a: 'Founding Members get early access to country intelligence hubs, extended story archives, AI briefings, and priority access to all new features as the platform develops.',
  },
  {
    q: 'How is this different from other Africa-focused media?',
    a: 'Best of Africa is built from the ground up as an investment-grade platform — not a charity or aid-narrative outlet. We cover the businesses, innovations, and geopolitical shifts that drive real decisions.',
  },
  {
    q: 'Can I upgrade or downgrade my tier?',
    a: 'Yes. Ko-fi allows you to manage your subscription directly. You can switch tiers or cancel at any time.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1C1814]/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="font-medium text-[#1C1814]/90 group-hover:text-[#1C1814] transition-colors text-base">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-[#C9A84C] shrink-0" />
          : <ChevronDown size={16} className="text-[#1C1814]/40 shrink-0 group-hover:text-[#1C1814]/70 transition-colors" />
        }
      </button>
      {open && <p className="text-[#1C1814]/60 text-sm leading-relaxed pb-5">{a}</p>}
    </div>
  );
}

export const BetaMembership = () => (
  <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans selection:bg-[#C9A84C] selection:text-[#1C1814]">
    <SEO 
      title="Membership | Best of Africa" 
      description="Become a Founding Member to unlock all stories, market intelligence, and deep-dives across 54 countries."
    />
    <BetaNav />

    {/* Tiers */}
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="font-serif text-[32px] md:text-[44px] leading-tight mb-4">Join before the official launch</h1>
        <p className="text-[18px] text-[#1C1814]/70 max-w-2xl mx-auto leading-relaxed">
          Your support right now covers domains, tools, and the time to report and ship.
        </p>
      </div>
      <MembershipTiersGrid />
    </section>

    {/* One-off tip */}
    <section className="py-16 px-6 border-t border-[#1C1814]/8">
      <div className="max-w-xl mx-auto text-center bg-white p-8 rounded-xl border border-[#1C1814]/8">
        <h3 className="font-serif text-2xl mb-3">Support the work.</h3>
        <p className="text-[#1C1814]/60 text-sm mb-6">A one-time contribution keeps this reporting independent and brings African intelligence to the world.</p>
        <a
          href={KO_FI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-transparent border border-[#C9A84C] text-[#C9A84C] px-6 py-3 rounded-full hover:bg-[#C9A84C]/10 transition-colors"
        >
          One-time contribution
        </a>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-16 px-6 border-t border-[#1C1814]/8">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl text-[#1C1814] mb-10 text-center">Questions about membership</h2>
        <div className="bg-white rounded-2xl border border-[#1C1814]/8 px-6 md:px-8">
          {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
        </div>
      </div>
    </section>

    <BetaFooter />
  </div>
);
