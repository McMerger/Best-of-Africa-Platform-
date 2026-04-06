import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BetaNav } from '../../components/beta';

export const BetaNewsletter = () => {
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('success');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col selection:bg-[#C9A84C] selection:text-[#0A0F1E]">
      <BetaNav />
      <div className="flex-1 flex flex-col justify-center py-20 px-6">
        <div className="max-w-md mx-auto w-full flex flex-col items-center text-center">
        
        <div className="mb-10 w-full">
          <h1 className="font-serif text-[40px] md:text-[48px] leading-tight mb-4">
            Stay close to Africa's story.
          </h1>
          <p className="text-lg text-white/70 max-w-sm mx-auto leading-relaxed">
            Free weekly dispatches — cities, founders, opportunities. No noise. Unsubscribe anytime.
          </p>
        </div>

        {status === 'success' ? (
          <div className="w-full bg-[#111827] border border-[#C9A84C]/30 p-8 rounded-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-serif text-2xl text-[#C9A84C] mb-2">You're on the list.</h3>
            <p className="text-white/70">
              Welcome to the inner circle. Keep an eye on your inbox for the next dispatch.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mb-10">
            <input 
              type="email" 
              placeholder="Your email address" 
              required
              className="w-full bg-[#111827] border border-white/20 text-white rounded-lg px-6 py-4 focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-white/30 font-sans text-center"
            />
            <button 
              type="submit"
              className="w-full bg-[#C9A84C] text-[#0A0F1E] font-medium font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-transform hover:-translate-y-0.5 text-lg"
            >
              Subscribe free
            </button>
          </form>
        )}

        {/* Benefits List */}
        <div className="w-full bg-[#111827] rounded-xl border border-white/5 p-8 text-left mb-8 shadow-inner">
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="text-[#C9A84C] mr-3 font-bold">•</span>
              <span className="text-white/80 font-medium">Weekly story from an African city</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#C9A84C] mr-3 font-bold">•</span>
              <span className="text-white/80 font-medium">Early access to new country coverage</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#C9A84C] mr-3 font-bold">•</span>
              <span className="text-white/80 font-medium">First to know when the full platform launches</span>
            </li>
          </ul>
        </div>
        
        {/* Social Proof */}
        <p className="text-sm font-medium text-white/50 mb-12 uppercase tracking-wide">
          Join early supporters already following Best of Africa
        </p>

        {/* Soft Upsell */}
        <div className="pt-8 border-t border-white/10 w-full text-center">
          <p className="text-white/60 mb-2">Want more?</p>
          <Link to="/membership" className="text-[#C9A84C] font-semibold hover:text-[#C9A84C]/80 transition-colors">
            Founding Members get full access.
          </Link>
        </div>

      </div>
      </div>
    </div>
  );
};
