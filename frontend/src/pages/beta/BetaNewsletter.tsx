import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { CountryFlag } from '../../components/CountryFlag';
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
    staleTime: 5 * 60 * 1000 });
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
        body: JSON.stringify({ email, frequency: 'weekly' }) });
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
      <div className="flex flex-col selection:bg-accent selection:text-navy">
        <SEO title="Subscribed | BOA-Story" />
        
        <div className="flex-1 flex flex-col justify-center py-20 px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mb-6">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-serif text-3xl mb-3">You're on the list</h1>
            <p className="text-primary/70 mb-8 leading-relaxed">
              Expect your first dispatch on Sunday. In the meantime, dive into our latest stories.
            </p>
            <Link
              to="/posts"
              className="inline-block w-full bg-accent text-accent-foreground font-semibold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg"
            >
              Read latest stories
            </Link>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="flex flex-col selection:bg-accent selection:text-navy">
      <SEO 
        title="Newsletter | BOA-Story" 
        description="Weekly dispatches on African business, culture, and emerging stories, no noise, no filter."
      />
      

      <div className="flex-1 flex flex-col justify-center py-20 px-6">
        <div className="max-w-md mx-auto w-full flex flex-col items-center text-center">

          <div className="mb-10 w-full">
            <h1 className="font-serif text-ink text-[40px] md:text-[48px] leading-tight mb-4">
              Stay close to Africa's <span className="italic text-accent">story.</span>
            </h1>
            <p className="text-lg text-ink-blue max-w-sm mx-auto leading-relaxed">
              Free weekly dispatches, cities, founders, opportunities. No noise. Unsubscribe anytime.
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
              className="w-full bg-white border border-border rounded-xl px-4 py-4 text-ink placeholder:text-ink-mute focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-sm"
            />
            <p className="text-xs text-ink-blue text-left">No spam. Unsubscribe anytime.</p>
            {status === 'error' && (
              <p className="text-destructive text-sm -mt-2" role="alert">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-accent text-accent-foreground font-medium font-sans px-8 py-4 rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-transform hover:-translate-y-0.5 text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {status === 'loading' ? 'Subscribing...' : 'Get the weekly dispatch'}
            </button>
          </form>

          {/* Sample dispatch preview, shows readers exactly what they'll get (spec §3.9) */}
          <div className="bg-white rounded-xl border border-border p-8 md:p-10 mb-12 shadow-[0_1px_6px_rgba(0,0,0,0.08)] w-full text-left">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Sample Dispatch</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-blue">Sunday · 5 min read</span>
            </div>
            <ul className="space-y-5">
              {/* CountryFlag, not emoji — Windows renders flag emoji as bare
                  letter pairs ("KE KENYA"). Same fix as the rest of the app. */}
              {[
                { code: 'KE', country: 'Kenya', sector: 'Technology', headline: 'The quiet infrastructure bet paying off in Nairobi' },
                { code: 'NG', country: 'Nigeria', sector: 'Finance', headline: 'Inside the fintech quietly banking the unbanked' },
                { code: 'RW', country: 'Rwanda', sector: 'Agriculture', headline: 'How smallholder co-ops are rewriting the export map' },
              ].map(item => (
                <li key={item.headline} className="border-b border-border last:border-0 pb-5 last:pb-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-blue">
                      <CountryFlag code={item.code} title={item.country} size={16} /> {item.country}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-ink">{item.sector}</span>
                  </div>
                  <p className="font-serif text-lg text-ink leading-snug">{item.headline}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm font-medium text-primary/50 mb-12 uppercase tracking-wide">
            {subscriberCount !== null && subscriberCount >= MIN_DISPLAY_SUBSCRIBERS
              ? `${subscriberCount.toLocaleString()} readers already on the list`
              : `Join the founding reader community`
            }
          </p>

          <div className="pt-8 border-t border-primary/8 w-full text-center">
            <p className="text-primary/60 mb-2">Ready to go deeper?</p>
            <Link to="/membership" className="text-accent font-semibold hover:opacity-80 transition-opacity">
              Support the project on Ko-fi.
            </Link>
          </div>

        </div>
      </div>

      
    </div>
  );
};
