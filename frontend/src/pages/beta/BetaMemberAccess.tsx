import { useState, useEffect } from 'react';
import { Mail, ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { BetaNav, BetaFooter, BetaDashboard } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { request } from '../../services/api';
import { KO_FI_URL } from '../../constants/beta';

// ─── Token storage helpers ────────────────────────────────────────────────────
export const memberAuth = {
  getToken: () => localStorage.getItem('boa_auth_token'),
  setToken: (token: string) => localStorage.setItem('boa_auth_token', token),
  clearToken: () => localStorage.removeItem('boa_auth_token'),
  isMember: () => !!localStorage.getItem('boa_auth_token'),
};



export const BetaMemberAccess = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'checking' | 'form' | 'otp' | 'success' | 'error' | 'expired'>('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [memberData, setMemberData] = useState<{ tier: string; name: string } | null>(null);

  // On mount: check if an existing token is still valid
  useEffect(() => {
    const token = localStorage.getItem('boa_auth_token');
    if (!token) { setPhase('form'); return; }

    request<{ member: boolean; tier?: string; name?: string; reason?: string }>('/members/me')
      .then(res => {
        if (res.member && res.tier && res.name) {
          setMemberData({ tier: res.tier, name: res.name });
          setPhase('success');
        } else if (res.reason === 'expired') {
          localStorage.removeItem('boa_auth_token');
          setPhase('expired');
        } else {
          localStorage.removeItem('boa_auth_token');
          setPhase('form');
        }
      })
      .catch(() => setPhase('form'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await request<{ ok: boolean; status?: string }>(
        '/members/verify-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        }
      );

      if (res.ok && res.status === 'pending_otp') {
        setPhase('otp');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg.includes('404') || msg.includes('No active')
        ? 'No active membership found for this email.'
        : msg.includes('expired')
        ? 'Your membership has expired. Please renew on Ko-fi to restore access.'
        : msg
      );
      setIsSubmitting(false);
      setPhase('error');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await request<{ ok: boolean; token: string; tier: string; name: string }>(
        '/members/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otp.trim() }),
        }
      );

      setIsSubmitting(false);
      if (res.ok && res.token) {
        memberAuth.setToken(res.token);
        setMemberData({ tier: res.tier, name: res.name });
        setPhase('success');
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      if (msg.includes('expired')) {
        setErrorMsg('That code has expired. Please request a new one.');
        setPhase('form');
      } else {
        setErrorMsg('Invalid verification code. Please try again.');
      }
      setIsSubmitting(false);
      setPhase('otp');
    }
  };



  // ── Checking state — validating existing token ─────────────────────────────
  if (phase === 'checking') {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col">
        <SEO title="Member Access | Best of Africa" />
        <BetaNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#C9A84C]/40 border-t-[#C9A84C] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Expired state ──────────────────────────────────────────────────────────
  if (phase === 'expired') {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-white font-sans flex flex-col">
        <SEO title="Access Expired | Best of Africa" />
        <BetaNav />
        <div className="flex-1 flex flex-col justify-center py-20 px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
              <RefreshCw className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="font-serif text-3xl mb-3">Your access has expired</h1>
            <p className="text-white/60 mb-8">
              Your 30-day access token has expired. Re-enter your member email to get a fresh one, or renew your membership on Ko-fi.
            </p>
            <button
              onClick={() => setPhase('form')}
              className="w-full bg-[#C9A84C] text-[#0A0F1E] font-semibold py-4 rounded-xl hover:brightness-110 transition-all mb-4"
            >
              Re-enter member email
            </button>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Renew on Ko-fi →
            </a>
          </div>
        </div>
        <BetaFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans selection:bg-[#C9A84C] selection:text-[#0A0F1E] flex flex-col">
      <SEO 
        title="Member Access | Best of Africa" 
        description="Access your Founding Member benefits and premium intelligence."
      />
      <BetaNav />

      <div className="flex-1 flex flex-col justify-center py-20 px-6">
        <div className="max-w-md mx-auto w-full">

          {phase === 'success' && memberData ? (
            // ── Success state (Dashboard) ──────────────────────────────────────
            <BetaDashboard
              memberData={memberData}
              onLogout={() => {
                localStorage.removeItem('boa_auth_token');
                setPhase('form');
                setMemberData(null);
              }}
            />
          ) : phase === 'otp' ? (
            // ── OTP Form State ─────────────────────────────────────────────────
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-6">
                  <Lock className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <h1 className="font-serif text-[2.25rem] leading-tight mb-3">
                  Check your email
                </h1>
                <p className="text-white/60 leading-relaxed max-w-sm mx-auto">
                  We sent a 6-digit verification code to <strong>{email}</strong>. Entering it below will authorize this device.
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4 mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="0 0 0 0 0 0"
                    required
                    pattern="\d*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={isSubmitting}
                    className="w-full bg-[#111827] border border-[#C9A84C]/30 rounded-xl px-4 py-6 text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all disabled:opacity-50 text-center font-mono text-3xl tracking-widest font-bold"
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-sm text-center" role="alert">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || otp.length < 6}
                  className="w-full bg-[#C9A84C] text-[#0A0F1E] font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Verify Code
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => { setPhase('form'); setOtp(''); }}
                  className="text-xs text-white/40 hover:text-white underline transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </>
          ) : (
            // ── Email form state ───────────────────────────────────────────────
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-6">
                  <Lock className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <h1 className="font-serif text-[2.25rem] leading-tight mb-3">
                  Unlock member access
                </h1>
                <p className="text-white/60 leading-relaxed max-w-sm mx-auto">
                  Enter the email you used on Ko-fi to activate your full membership on this device.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your member email"
                    required
                    name="email"
                    disabled={isSubmitting}
                    className="w-full bg-[#111827] border border-white/15 rounded-xl pl-10 pr-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/30 transition-all disabled:opacity-50"
                  />
                </div>

                {phase === 'error' && (
                  <p className="text-red-400 text-sm" role="alert">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.includes('@')}
                  className="w-full bg-[#C9A84C] text-[#0A0F1E] font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#0A0F1E]/30 border-t-[#0A0F1E] rounded-full animate-spin" />
                  ) : (
                    <>Activate membership <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <div className="border-t border-white/5 pt-8 text-center space-y-4">
                <p className="text-white/40 text-sm">Not a member yet?</p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#C9A84C] font-semibold hover:opacity-80 transition-opacity text-sm"
                >
                  Become a Founding Member on Ko-fi →
                </a>
                <p className="text-white/25 text-xs max-w-xs mx-auto">
                  After supporting on Ko-fi, return here with the same email to unlock access. No password required.
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      <BetaFooter />
    </div>
  );
};
