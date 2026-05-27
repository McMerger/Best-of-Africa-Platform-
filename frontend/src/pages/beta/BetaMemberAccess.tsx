import { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { BetaDashboard } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { request } from '../../services/api';
import { KO_FI_URL } from '../../constants/beta';
import { useMember } from '../../context/MemberContext';

export const BetaMemberAccess = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'checking' | 'form' | 'otp' | 'success' | 'error' | 'expired'>('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const { isMember, memberData, login, logout, isLoading } = useMember();

  // Sync local phase with MemberContext state
  useEffect(() => {
    if (isLoading) {
      setPhase('checking');
    } else if (isMember) {
      setPhase('success');
    } else if (phase === 'success' || phase === 'checking') {
      // If we were checking or succeeded and now we're not a member,
      // it means the token was invalid, expired, or logged out.
      // We don't have a specific 'expired' distinction from the context yet,
      // so default to 'form'. The context clears the token on unauthorized.
      setPhase('form');
    }
  }, [isLoading, isMember, phase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await request<{ ok: boolean; status?: string }>(
        '/members/verify-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.toLowerCase().trim() }) }
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
          body: JSON.stringify({ email: email.toLowerCase().trim(), otp: otp.trim() }) }
      );

      setIsSubmitting(false);
      if (res.ok && res.token) {
        login(res.token, { tier: res.tier, name: res.name, expires_in_days: null });
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
        body: JSON.stringify({ email: email.toLowerCase().trim() }) });
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
      <div className="flex flex-col">
        <SEO title="Member Access | BOA-Story" />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent/40 border-t-[#C9A84C] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Expired state ──────────────────────────────────────────────────────────
  if (phase === 'expired') {
    return (
      <div className="flex flex-col">
        <SEO title="Access Expired | BOA-Story" />
        
        <div className="flex-1 flex flex-col justify-center py-20 px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
              <RefreshCw className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="font-serif text-3xl mb-3">Your access has expired</h1>
            <p className="text-primary/60 mb-8">
              Your 30-day access token has expired. Re-enter your member email to get a fresh one, or renew your membership on Ko-fi.
            </p>
            <button
              onClick={() => setPhase('form')}
              className="w-full bg-accent text-card font-semibold py-4 rounded-xl hover:brightness-110 transition-all mb-4"
            >
              Re-enter member email
            </button>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary/40 hover:text-primary transition-colors"
            >
              Renew on Ko-fi →
            </a>
          </div>
        </div>
        
      </div>
    );
  }

  return (
    <div className="selection:bg-accent selection:text-primary flex flex-col">
      <SEO 
        title="Member Access | BOA-Story" 
        description="Access your Founding Member benefits and premium stories."
      />
      

      <div className="flex-1 flex flex-col justify-center py-20 px-6">
        <div className="max-w-md mx-auto w-full">

          {phase === 'success' && memberData ? (
            // ── Success state (Dashboard) ──────────────────────────────────────
            <BetaDashboard
              memberData={memberData}
              onLogout={() => {
                logout();
                setPhase('form');
              }}
            />
          ) : phase === 'otp' ? (
            // ── OTP Form State ─────────────────────────────────────────────────
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mb-6">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
                <h1 className="font-serif text-[2.25rem] leading-tight mb-3">
                  Check your email
                </h1>
                <p className="text-primary/60 leading-relaxed max-w-sm mx-auto">
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
                    className="w-full bg-white border border-accent/60 rounded-xl px-4 py-6 text-primary placeholder:text-primary/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-50 text-center font-mono text-3xl tracking-widest font-bold"
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-sm text-center" role="alert">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || otp.length < 6}
                  className="w-full bg-accent text-card font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  className="text-sm text-accent/70 hover:text-accent transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Resending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhase('form'); setOtp(''); setErrorMsg(''); }}
                  className="text-xs text-primary/30 hover:text-primary/60 underline transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </>
          ) : (
            // ── Email form state ───────────────────────────────────────────────
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mb-6">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
                <h1 className="font-serif text-[2.25rem] leading-tight mb-3">
                  Unlock member access
                </h1>
                <p className="text-primary/60 leading-relaxed max-w-sm mx-auto">
                  Enter the email you used on Ko-fi to activate your full membership on this device.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your member email"
                    required
                    name="email"
                    disabled={isSubmitting}
                    className="w-full bg-white border border-primary/10 rounded-xl pl-10 pr-4 py-4 text-primary placeholder:text-primary/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-50"
                  />
                </div>

                {phase === 'error' && (
                  <p className="text-red-400 text-sm" role="alert">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.includes('@')}
                  className="w-full bg-accent text-card font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-card/30 border-t-[#0E0C0A] rounded-full animate-spin" />
                  ) : (
                    <>Activate membership <ArrowRight size={15} /></>
                  )}
                </button>
              </form>

              <div className="border-t border-primary/8 pt-8 text-center space-y-4">
                <p className="text-primary/40 text-sm">Not a member yet?</p>
                <a
                  href={KO_FI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent font-semibold hover:opacity-80 transition-opacity text-sm"
                >
                  Become a Founding Member on Ko-fi →
                </a>
                <p className="text-primary/25 text-xs max-w-xs mx-auto">
                  After supporting on Ko-fi, return here with the same email to unlock access. No password required.
                </p>
              </div>
            </>
          )}

        </div>
      </div>

      
    </div>
  );
};
