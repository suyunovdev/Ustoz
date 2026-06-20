'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export default function ForgotPasswordInteractive() {
  const router = useRouter();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'password_reset' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.errorOccurred'));
      setStep('otp');
      startResendCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.invalidCode'));
      setStep('newPassword');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.errorOccurred'));
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'password_reset' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.errorOccurred'));
      startResendCooldown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Ustoz</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

        {/* STEP 1: Email */}
        {step === 'email' && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('auth.forgotPasswordTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t('auth.forgotPasswordDesc')}
            </p>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('auth.emailFieldLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? t('auth.loadingButton') : t('auth.sendCodeButton')}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: OTP */}
        {step === 'otp' && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('auth.enterCodeTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{email}</span> {t('auth.otpSentToEmail')}
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('auth.verificationCodeFieldLabel')}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? t('auth.checkingCode') : t('auth.verifyCodeButton')}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {resendCooldown > 0 ? `${t('auth.resendInSeconds')} (${resendCooldown}s)` : t('auth.resendCodeButton')}
              </button>
            </form>
          </>
        )}

        {/* STEP 3: New Password */}
        {step === 'newPassword' && (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('auth.newPasswordTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('auth.newPasswordDesc')}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('auth.newPasswordLabel')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('auth.confirmNewPasswordLabel')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? t('auth.savingPassword') : t('auth.updatePasswordButton')}
              </button>
            </form>
          </>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('auth.passwordUpdatedTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t('auth.passwordUpdatedDesc')}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              {t('auth.goToLogin')}
            </button>
          </div>
        )}

        {step !== 'success' && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/login" className="text-primary hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
