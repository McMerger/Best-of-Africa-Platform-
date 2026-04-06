import React from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BetaNav } from '../../components/beta';

export const BetaStories = () => {
  const articles = [
    { 
      slug: "tech-talent-lagos", 
      flag: "🇳🇬", 
      country: "Nigeria",
      tag: "Technology",
      readTime: "6 min read",
      title: "The Silent Exodus Reversing Course in Lagos", 
      excerpt: "A new wave of deeply capitalized local funds is convincing Nigeria's diaspora engineers that building at home is no longer a compromise.",
      isLocked: false
    },
    { 
      slug: "kigali-infrastructure", 
      flag: "🇷🇼", 
      country: "Rwanda",
      tag: "Urban Development",
      readTime: "8 min read",
      title: "Kigali's Blueprint for the Climate-Resilient City", 
      excerpt: "While Western capitals debate policy, Rwanda is quietly executing a radical, ground-up redesign of urban mobility and green space.",
      isLocked: false
    },
    { 
      slug: "nairobi-clean-energy", 
      flag: "🇰🇪", 
      country: "Kenya",
      tag: "Energy",
      readTime: "7 min read",
      title: "The Geothermal Advantage Quietly Powering Nairobi", 
      excerpt: "How Kenya bypassed fossil fuel dependency to build a tech ecosystem running almost entirely on renewable, geothermal power.",
      isLocked: true
    },
    { 
      slug: "accra-creative-economy", 
      flag: "🇬🇭", 
      country: "Ghana",
      tag: "Culture",
      readTime: "5 min read",
      title: "Accra's Creative Export Economy is Maturing", 
      excerpt: "Beyond the festivals and viral moments, Ghanaian artists are building the permanent infrastructure to own their global distribution.",
      isLocked: true
    },
    { 
      slug: "addis-aviation-dominance", 
      flag: "🇪🇹", 
      country: "Ethiopia",
      tag: "Logistics",
      readTime: "9 min read",
      title: "How Addis Ababa Won the African Sky", 
      excerpt: "The relentless operational discipline that turned a regional carrier into the continent's undisputed logistics and passenger heavyweight.",
      isLocked: true
    },
    { 
      slug: "cape-town-biotech", 
      flag: "🇿🇦", 
      country: "South Africa",
      tag: "Healthcare",
      readTime: "6 min read",
      title: "The Biotech Engineers Redefining Medicine at the Cape", 
      excerpt: "South African laboratories are shifting from manufacturing generic drugs to patenting breakthrough mRNA applications for the global market.",
      isLocked: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] pb-32">
      <BetaNav />
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        <header className="mb-16 text-center md:text-left">
          <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-4">
            Stories from the Continent
          </h1>
          <p className="text-xl text-white/70">
            Real reporting. Real opportunities.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {articles.map((article) => {
            if (article.isLocked) {
              return (
                <div key={article.slug} className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col h-[380px]">
                  {/* Badge */}
                  <div className="absolute top-4 right-4 z-30 bg-[#C9A84C]/90 backdrop-blur-sm text-[#0A0F1E] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded shadow-md">
                    Founding Members Only
                  </div>
                  
                  {/* Content (Blurred) */}
                  <div className="p-6 pb-2 border-b border-white/5 relative z-10 bg-[#111827]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl">{article.flag}</span>
                      <div className="flex gap-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
                        <span>{article.tag}</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-[22px] leading-snug mb-3 text-white">
                      {article.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="mt-4 text-xs font-medium text-white/40 border-t border-white/5 pt-4">
                      {article.readTime}
                    </div>
                  </div>

                  {/* Blur Overlay & Lock UI */}
                  <div className="absolute inset-0 z-20 overflow-hidden rounded-xl border border-white/5">
                     <div className="absolute inset-0 backdrop-blur-[5px] bg-[#0A0F1E]/60 transition-opacity duration-300" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-300 group-hover:-translate-y-1">
                        <div className="bg-[#0A0F1E] p-4 rounded-full border border-[#C9A84C]/30 shadow-2xl mb-4 group-hover:scale-110 group-hover:bg-[#C9A84C]/10 transition-all duration-300">
                          <Lock className="w-6 h-6 text-[#C9A84C]" />
                        </div>
                        <span className="font-serif text-lg text-white font-medium mb-1">Founding Members Only</span>
                        <span className="text-xs text-white/60 uppercase tracking-widest font-semibold">Unlock to read</span>
                     </div>
                  </div>
                </div>
              );
            }

            return (
              <Link 
                key={article.slug} 
                to={`/stories/${article.slug}`}
                className="group relative bg-[#111827] rounded-xl overflow-hidden border border-white/10 flex flex-col h-[380px] transition-transform hover:-translate-y-1 duration-300 block hover:border-[#C9A84C]/40"
              >
                <div className="p-6 pb-2 flex-grow relative z-10 bg-[#111827]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl">{article.flag}</span>
                    <div className="flex gap-3 text-xs font-semibold tracking-wider text-[#C9A84C] uppercase">
                      <span>{article.tag}</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-[22px] leading-snug mb-3 text-white group-hover:text-[#C9A84C] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
                <div className="p-6 pt-0 bg-[#111827]">
                  <div className="text-xs font-medium text-white/50 border-t border-white/10 pt-4 flex justify-between items-center">
                    <span>{article.readTime}</span>
                    <span className="text-[#C9A84C] group-hover:translate-x-1 transition-transform">Read story →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <a 
            href="https://ko-fi.com/boastory" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg shadow-lg hover:brightness-110 transition-transform hover:-translate-y-0.5"
          >
            Unlock All Stories — Become a Founding Member
          </a>
        </div>

      </div>
    </div>
  );
};
