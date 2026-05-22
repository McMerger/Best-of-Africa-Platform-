import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BetaNav, BetaFooter } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { request } from '../../services/api';

const MIN_DISPLAY_SUBSCRIBERS = 50;

export const BetaNewsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch subscriber count for social proof
  const { data: statsData } = useQuery<{ subscribers: number }>({
    queryKey: ['newsletter-stats'],
    queryFn: () => request<{ subscribers: number }>('/newsletter/stats'),
    staleTime: 5 * 60 * 1000,
  });
  const subscriberCount = statsData?.subscribers ?? null;

  // Auto-focus the email field on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await request<{ success: boolean; message: string }>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, frequency: 'weekly' }),
      });
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      // Check for "already subscribed" using case-insensitive match on common API patterns
      const isAlready = /already|subscribed|exists/i.test(msg);
      setErrorMessage(isAlready ? "You're already subscribed with this email." : msg);
      setStatus('error');
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] flex flex-col selection:bg-[#C9A84C] selection:text-[#0E0C0A]">
        <SEO title="Subscribed | Best of Africa" />
        <BetaNav />
        <div className="flex-1 flex flex-col justify-center py-20 px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-6">
              <CheckCircle className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <h1 className="font-serif text-3xl mb-3">You're on the list</h1>
            <p className="text-[#1C1814]/70 mb-8 leading-relaxed">
              Expect your first dispatch on Sunday. In the meantime, dive into our latest stories and market intelligence.
            </p>
            <Link
              to="/stories"
              className="inline-block w-full bg-[#C9A84C] text-[#0E0C0A] font-semibold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg"
            >
              Read latest stories
            </Link>
          </div>
        </div>
        <BetaFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] flex flex-col selection:bg-[#C9A84C] selection:text-[#0E0C0A]">
      <SEO 
        title="Newsletter | Best of Africa" 
        description="Weekly intelligence dispatches on African business, culture, and emerging markets — no noise, no filter."
      />
      <BetaNav />

      <div className="flex-1 flex flex-col justify-center py-20 px-6">
        <div className="max-w-md mx-auto w-full flex flex-col items-center text-center">

          <div className="mb-10 w-full">
            <h1 className="font-serif text-[40px] md:text-[48px] leading-tight mb-4">
              Stay close to Africa's story.
            </h1>
            <p className="text-lg text-[#1C1814]/70 max-w-sm mx-auto leading-relaxed">
              Free weekly dispatches — cities, founders, opportunities. No noise. Unsubscribe anytime.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8 w-full">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              required
              disabled={status === 'loading'}
              autoComplete="email"
              className="w-full bg-white border border-[#1C1814]/15 text-[#1C1814] rounded-lg px-6 py-4 focus:outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#1C1814]/50 font-sans disabled:opacity-50"
            />
            {status === 'error' && (
              <p className="text-red-400 text-sm -mt-2" role="alert">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#C9A84C] text-[#0E0C0A] font-medium font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-transform hover:-translate-y-0.5 text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {status === 'loading' ? 'Subscribing…' : 'Get the weekly dispatch'}
            </button>
          </form>

          {/* Benefits */}
          <div className="w-full bg-white rounded-xl border border-[#1C1814]/8 p-8 text-left mb-8 shadow-sm">
            <ul className="space-y-4">
              {[
                'Weekly intelligence dispatch from across the continent',
                'First look at new country hubs and coverage',
                'Exclusive early access to platform features',
              ].map(benefit => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="text-[#C9A84C] font-bold shrink-0">•</span>
                  <span className="text-[#1C1814]/80 font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm font-medium text-[#1C1814]/50 mb-12 uppercase tracking-wide">
            {subscriberCount !== null && subscriberCount >= MIN_DISPLAY_SUBSCRIBERS
              ? `${subscriberCount.toLocaleString()} readers already on the list`
              : `Join the first wave of continental intelligence`
            }
          </p>

          <div className="pt-8 border-t border-[#1C1814]/8 w-full text-center">
            <p className="text-[#1C1814]/60 mb-2">Ready to go deeper?</p>
            <Link to="/membership" className="text-[#C9A84C] font-semibold hover:opacity-80 transition-opacity">
              Founding Members unlock the full platform.
            </Link>
          </div>

        </div>
      </div>

      <BetaFooter />
    </div>
  );
};
