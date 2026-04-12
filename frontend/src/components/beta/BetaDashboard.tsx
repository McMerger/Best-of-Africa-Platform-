import { Link } from 'react-router-dom';
import { LogOut, Star, CheckCircle, Clock } from 'lucide-react';
import { TIER_LABELS } from '../../constants/beta';

interface BetaDashboardProps {
  memberData: { tier: string; name: string };
  onLogout: () => void;
}

export const BetaDashboard = ({ memberData, onLogout }: BetaDashboardProps) => {
  const tierInfo = TIER_LABELS[memberData.tier] || TIER_LABELS.basic;

  return (
    <div className="flex-1 flex flex-col justify-center py-20 px-6">
      <div className="max-w-xl mx-auto w-full">
        
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-[32px] mb-1">Welcome back, {memberData.name}</h1>
            <p className="text-white/50 text-sm flex items-center gap-2">
              <CheckCircle size={14} className="text-[#C9A84C]" /> Active Membership
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="p-3 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Current Tier Panel */}
        <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <Star size={120} className="text-[#C9A84C]" />
          </div>
          
          <div className="relative z-10">
            <span className="text-xs font-bold tracking-widest text-[#C9A84C] uppercase block mb-2">Current Tier</span>
            <h2 className="font-serif text-[28px] text-white flex items-center gap-3">
              {tierInfo.title}
            </h2>
            <p className="text-white/60 mt-2 text-sm max-w-md leading-relaxed">
              {tierInfo.desc}
            </p>
          </div>
        </div>

        {/* Access Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/stories" className="group bg-[#0A0F1E] border border-white/10 p-5 rounded-xl hover:border-[#C9A84C]/40 transition-colors">
            <h3 className="font-medium text-white mb-1 group-hover:text-[#C9A84C] transition-colors">All Stories</h3>
            <p className="text-xs text-white/50 leading-relaxed">Read full versions of all market reports and narratives.</p>
          </Link>
          <Link to="/countries" className="group bg-[#0A0F1E] border border-white/10 p-5 rounded-xl hover:border-[#C9A84C]/40 transition-colors">
            <h3 className="font-medium text-white mb-1 group-hover:text-[#C9A84C] transition-colors">Country Hubs</h3>
            <p className="text-xs text-white/50 leading-relaxed">Explore intelligence sorted by the 54 nations.</p>
          </Link>
        </div>

        {/* Support Nudge */}
        <div className="mt-12 text-center border-t border-white/10 pt-8">
          <p className="text-xs text-white/40 mb-3 flex items-center justify-center gap-1">
            <Clock size={12} /> Access renews automatically via Ko-fi
          </p>
          <a 
            href="https://ko-fi.com/syner/settings" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/30 text-xs hover:text-white transition-colors underline"
          >
            Manage subscription on Ko-fi
          </a>
        </div>

      </div>
    </div>
  );
};
