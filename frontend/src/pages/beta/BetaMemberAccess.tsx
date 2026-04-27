import { useState, useEffect, useRef } from 'react';
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
  const [memberData, setMemberData] = useState<{ tier: string; name: string; expires_in_days?: number | null } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // On mount: check if an existing token is still valid
  useEffect(() => {
    const token = memberAuth.getToken();
    if (!token) { setPhase('form'); return; }

    // C5 FIX: Must pass the Authorization header so the server can validate the JWT.
    // Without this, /members/me always returns {member: false} regardless of stored token.
    request<{ member: boolean; tier?: string; name?: string; expires_in_days?: number | null; reason?: string }>(
      '/members/me',
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then(res => {
        if (res.member && res.tier && res.name) {
          setMemberData({ tier: res.tier, name: res.name, expires_in_days: res.expires_in_days ?? null });
          setPhase('success');
        } else if (res.reason === 'expired') {
          memberAuth.clearToken();
          setPhase('expired');
        } else {
          memberAuth.clearToken();
          setPhase('form');
        }
      })
      .catch(() => setPhase('form'));
  }, []);

  // Listen for global 401 events from the API layer — show the expired screen so
  // users know why they were logged out rather than silently seeing the login form.
  useEffect(() => {
    const handler = () => {
      if (!memberAuth.getToken()) return; // already logged out, ignore
      memberAuth.clearToken();
      setMemberData(null);
      setPhase('expired');
    };
    window.addEventListener('boa:auth:unauthorized', handler);
    return () => window.removeEventListener('boa:auth:unauthorized', handler);
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
        setIsSubmitting(false);
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
        setMemberData({ tier: res.tier, name: res.name, expires_in_days: null });
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



  // Auto-focus OTP input when the OTP screen appears
  useEffect(() => {
    if (phase === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [phase]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setResendSuccess(false);
    try {
      await request<{ ok: boolean }>('/members/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
      // Start 30-second cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setErrorMsg('Failed to resend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checking state — validating existing token ─────────────────────────────
  if (phase === 'checking') {
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] flex flex-col">
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
      <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans flex flex-col">
        <SEO title="Access Expired | Best of Africa" />
        <BetaNav />
        <div className="flex-1 flex flex-col justify-center py-20 px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
              <RefreshCw className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="font-serif text-3xl mb-3">Your access has expired</h1>
            <p className="text-[#1C1814]/60 mb-8">
              Your 30-day access token has expired. Re-enter your member email to get a fresh one, or renew your membership on Ko-fi.
            </p>
            <button
              onClick={() => setPhase('form')}
              className="w-full bg-[#C9A84C] text-[#0E0C0A] font-semibold py-4 rounded-xl hover:brightness-110 transition-all mb-4"
            >
              Re-enter member email
            </button>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#1C1814]/40 hover:text-[#1C1814] transition-colors"
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
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1814] font-sans selection:bg-[#C9A84C] selection:text-[#1C1814] flex flex-col">
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
                memberAuth.clearToken(); // M5 FIX: use shared abstraction instead of direct localStorage
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
                <p className="text-[#1C1814]/60 leading-relaxed max-w-sm mx-auto">
                  We sent a 6-digit verification code to <strong>{email}</strong>. Entering it below will authorize this device.
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4 mb-4">
                <div className="relative">
                  <input
                    ref={otpInputRef}
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="0 0 0 0 0 0"
                    required
                    pattern="\d*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-[#C9A84C]/60 rounded-xl px-4 py-6 text-[#1C1814] placeholder:text-[#1C1814]/40 focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 transition-all disabled:opacity-50 text-center font-mono text-3xl tracking-widest font-bold"
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-sm text-center" role="alert">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || otp.length < 6}
                  className="w-full bg-[#C9A84C] text-[#0E0C0A] font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Verify Code
                </button>
              </form>

              <div className="text-center mt-6 flex flex-col gap-3">
                {resendSuccess && (
                  <p className="text-sm text-emerald-400 font-medium" role="status">New code sent — check your inbox.</p>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting || resendCooldown > 0}
                  className="text-sm text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhase('form'); setOtp(''); setErrorMsg(''); }}
                  className="text-xs text-[#1C1814]/30 hover:text-[#1C1814]/60 underline transition-colors"
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
                <p className="text-[#1C1814]/60 leading-relaxed max-w-sm mx-auto">
                  Enter the email you used on Ko-fi to activate your full membership on this device.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1814]/30 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your member email"
                    required
                    name="email"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-[#1C1814]/10 rounded-xl pl-10 pr-4 py-4 text-[#1C1814] placeholder:text-[#1C1814]/30 focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/30 transition-all disabled:opacity-50"
                  />
                </div>

                {phase === 'error' && (
                  <p className="text-red-400 text-sm" role="alert">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.includes('@')}
                  className="w-full bg-[#C9A84C] text-[#0E0C0A] font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#0E0C0A]/30 border-t-[#0E0C0A] rounded-full animate-spin" />
                  ) : (
                    <>Activate membership <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <div className="border-t border-[#1C1814]/8 pt-8 text-center space-y-4">
                <p className="text-[#1C1814]/40 text-sm">Not a member yet?</p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#C9A84C] font-semibold hover:opacity-80 transition-opacity text-sm"
                >
                  Become a Founding Member on Ko-fi →
                </a>
                <p className="text-[#1C1814]/25 text-xs max-w-xs mx-auto">
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
