'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/queryKeys';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import LocaleToggle from '@/components/common/LocaleToggle';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useMyProfile, useProfileOverview, type ProfileDTO } from '@/hooks/queries/useProfile';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUpdateNotificationPrefsMutation,
  useRequestDeletionMutation,
  useCancelDeletionMutation,
} from '@/hooks/mutations/useProfileMutations';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate, formatDateTime, formatCurrency, formatNumber } from '@/lib/i18n/format';

type TabId = 'personal' | 'security' | 'notifications' | 'preferences';

// ── Rol yorlig'i ──
function roleLabel(role: string, t: (k: string) => string): string {
  if (role === 'teacher') return t('auth.teacher');
  if (role === 'admin') return 'Administrator';
  return t('auth.student');
}
function roleBadgeClass(role: string): string {
  if (role === 'teacher') return 'bg-secondary/15 text-secondary';
  if (role === 'admin') return 'bg-destructive/15 text-destructive';
  return 'bg-primary/15 text-primary';
}
function dashboardHref(role: string): string {
  if (role === 'teacher') return '/teacher-dashboard';
  if (role === 'admin') return '/admin-dashboard';
  return '/student-dashboard';
}

// Rasmni brauzerda 256px kvadratga kesib/kichraytiradi (JPEG data URL fallback uchun).
function resizeToDataUrl(file: File, size = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('img'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('ctx'));
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Avatar (R2-tayyor + data-URL fallback) ──
function AvatarUpload({ profile, size = 96 }: { profile: ProfileDTO; size?: number }) {
  const { t } = useI18n();
  const mut = useUpdateProfileMutation();
  const [preview, setPreview] = useState(profile.avatarUrl ?? '');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = (profile.fullName || profile.email || '?').charAt(0).toUpperCase();

  const saveAvatar = (url: string) =>
    new Promise<void>((resolve, reject) => {
      mut.mutate(
        { avatarUrl: url },
        { onSuccess: () => resolve(), onError: (e) => reject(e) },
      );
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error(t('profile.avatarImageOnly'));
    if (file.size > 8 * 1024 * 1024) return toast.error(t('profile.avatarTooLarge'));

    setBusy(true);
    try {
      // 1) R2 sozlanganmi — presigned upload so'raymiz
      const presignRes = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      });
      const presign = await presignRes.json().catch(() => ({}));

      let finalUrl: string;
      if (presignRes.ok && presign.configured && presign.uploadUrl) {
        // R2'ga to'g'ridan-to'g'ri PUT (rasm asl holida)
        const put = await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!put.ok) throw new Error('R2 upload failed');
        finalUrl = presign.publicUrl;
      } else {
        // Fallback: resized data URL
        finalUrl = await resizeToDataUrl(file, 256, 0.85);
      }

      await saveAvatar(finalUrl);
      setPreview(finalUrl);
      toast.success(t('profile.avatarUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.avatarError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full border-4 border-card bg-primary/10 overflow-hidden shadow-warm-lg flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {preview ? (
          <img src={preview} alt={profile.fullName} className="w-full h-full object-cover" />
        ) : (
          <span className="font-heading font-bold text-primary" style={{ fontSize: size / 2.6 }}>{initial}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={t('profile.changePhoto')}
        title={t('profile.changePhoto')}
        className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-warm-md hover:bg-primary/90 transition-smooth disabled:opacity-60 border-2 border-card"
      >
        {busy ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Icon name="CameraIcon" size={15} />
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Profil to'liqligi hisobi ──
function computeCompleteness(p: ProfileDTO): number {
  const items =
    p.role === 'teacher'
      ? [!!p.avatarUrl, !!p.phone, !!p.bio, !!p.headline, p.expertise.length > 0, Object.keys(p.socialLinks).length > 0]
      : [!!p.avatarUrl, !!p.phone, !!p.bio, p.interests.length > 0];
  const filled = items.filter(Boolean).length;
  return Math.round((filled / items.length) * 100);
}

// ── Overview (sarlavha + statistika + to'liqlik) ──
function ProfileOverview({ profile }: { profile: ProfileDTO }) {
  const { t, locale } = useI18n();
  const { data: overview } = useProfileOverview();
  const completeness = computeCompleteness(profile);

  type Stat = { icon: string; value: string; label: string };
  let stats: Stat[] = [];
  const s = overview?.stats;
  if (s) {
    if (overview!.role === 'student') {
      stats = [
        { icon: 'BookOpenIcon', value: formatNumber(s.enrolled ?? 0, locale), label: t('profile.statCourses') },
        { icon: 'CheckBadgeIcon', value: formatNumber(s.completed ?? 0, locale), label: t('profile.statCompleted') },
        { icon: 'TrophyIcon', value: formatNumber(s.certificates ?? 0, locale), label: t('profile.statCertificates') },
        { icon: 'FireIcon', value: formatNumber(s.streak ?? 0, locale), label: t('profile.statStreak') },
      ];
    } else if (overview!.role === 'teacher') {
      stats = [
        { icon: 'BookOpenIcon', value: formatNumber(s.courses ?? 0, locale), label: t('profile.statCourses') },
        { icon: 'UserGroupIcon', value: formatNumber(s.students ?? 0, locale), label: t('profile.statStudents') },
        { icon: 'StarIcon', value: (s.avgRating ?? 0).toFixed(1), label: t('profile.statRating') },
        { icon: 'BanknotesIcon', value: formatCurrency(Number(s.revenueUzs ?? 0), locale, 'UZS'), label: t('profile.statRevenue') },
      ];
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-warm">
      <div className="h-24 bg-gradient-to-r from-primary to-secondary relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '16px 16px' }} />
      </div>
      <div className="px-6 pb-5 flex flex-col sm:flex-row gap-4">
        <div className="-mt-14 shrink-0">
          <AvatarUpload profile={profile} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-heading font-bold text-foreground truncate">{profile.fullName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClass(profile.role)}`}>
              {roleLabel(profile.role, t)}
            </span>
            <span className="text-sm text-muted-foreground truncate">{profile.email}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('profile.joinedAt')}: {formatDate(profile.createdAt, locale)}
          </p>
        </div>
        {profile.role === 'teacher' && (
          <Link
            href={`/teachers/${profile.id}`}
            target="_blank"
            className="shrink-0 self-start sm:self-end px-3 py-2 border border-border rounded-lg text-sm text-primary hover:bg-muted transition-smooth inline-flex items-center gap-1.5"
          >
            <Icon name="EyeIcon" size={14} />
            {t('profile.publicProfile')}
          </Link>
        )}
      </div>

      {/* Statistika kartalari */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-t border-border">
          {stats.map((st) => (
            <div key={st.label} className="bg-card px-4 py-4 flex flex-col items-center text-center">
              <Icon name={st.icon} size={20} className="text-primary mb-1.5" />
              <span className="text-lg font-heading font-bold text-foreground leading-tight">{st.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{st.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Profil to'liqligi */}
      {completeness < 100 && (
        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground">{t('profile.completeness')}</span>
            <span className="text-xs font-semibold text-primary">{completeness}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfileClient() {
  const { data, isLoading, error } = useMyProfile();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('personal');

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'personal', label: t('profile.profileTab'), icon: 'UserIcon' },
    { id: 'security', label: t('profile.securityTab'), icon: 'ShieldCheckIcon' },
    { id: 'notifications', label: t('profile.notificationsTab'), icon: 'BellIcon' },
    { id: 'preferences', label: t('profile.preferencesTab'), icon: 'Cog6ToothIcon' },
  ];

  if (isLoading || !data) return <div className="p-8">{t('common.loading')}</div>;
  if (error) return <div className="p-8 text-destructive">{(error as Error).message}</div>;

  const profile = data.profile;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href={dashboardHref(profile.role)}
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        {t('profile.profileSettings')}
      </Link>

      <ProfileOverview profile={profile} />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 md:w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-smooth ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div>
          {activeTab === 'personal' && <PersonalTab profile={profile} />}
          {activeTab === 'security' && <SecurityTab profile={profile} />}
          {activeTab === 'notifications' && <NotificationsTab profile={profile} />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}

function PersonalTab({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  const mut = useUpdateProfileMutation();
  const isTeacher = profile.role === 'teacher';
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [interestsStr, setInterestsStr] = useState(profile.interests.join(', '));
  const [headline, setHeadline] = useState(profile.headline ?? '');
  const [expertiseStr, setExpertiseStr] = useState(profile.expertise.join(', '));
  const [social, setSocial] = useState<Record<string, string>>(profile.socialLinks);

  const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter((x) => x.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate(
      {
        fullName,
        phone: phone.trim() || null,
        bio,
        ...(isTeacher
          ? { headline, expertise: splitList(expertiseStr), socialLinks: social }
          : { interests: splitList(interestsStr) }),
      },
      {
        onSuccess: () => toast.success(t('profile.profileUpdated2')),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const setSocialField = (key: string, value: string) => setSocial((s) => ({ ...s, [key]: value }));
  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h2 className="font-heading font-semibold mb-1">{t('profile.profileInfo')}</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-name" className="block text-sm font-medium mb-1">{t('profile.fullName')}</label>
          <input id="pf-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label htmlFor="pf-phone" className="block text-sm font-medium mb-1">{t('profile.phone')}</label>
          <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="pf-bio" className="block text-sm font-medium mb-1">{t('profile.bio')}</label>
        <textarea id="pf-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={1000} placeholder={t('profile.bioPlaceholder')} className={`${inputCls} resize-y`} />
        <p className="text-xs text-muted-foreground mt-1">{bio.length} / 1000</p>
      </div>

      {!isTeacher && (
        <div>
          <label htmlFor="pf-interests" className="block text-sm font-medium mb-1">{t('profile.interests')}</label>
          <input id="pf-interests" type="text" value={interestsStr} onChange={(e) => setInterestsStr(e.target.value)} placeholder="Dasturlash, Matematika, Dizayn" className={inputCls} />
          <p className="text-xs text-muted-foreground mt-1">{t('profile.interestsHint')}</p>
        </div>
      )}

      {isTeacher && (
        <>
          <div>
            <label htmlFor="pf-headline" className="block text-sm font-medium mb-1">{t('profile.tagline')}</label>
            <input id="pf-headline" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={150} placeholder={t('profile.taglinePlaceholder')} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-expertise" className="block text-sm font-medium mb-1">{t('profile.topics')}</label>
            <input id="pf-expertise" type="text" value={expertiseStr} onChange={(e) => setExpertiseStr(e.target.value)} placeholder="React, TypeScript, Node.js" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('profile.socialNetworks')}</label>
            <div className="space-y-2">
              {[
                { key: 'website', label: 'Website', placeholder: 'https://…' },
                { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/…' },
                { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/…' },
                { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
                { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/…' },
              ].map((f) => (
                <div key={f.key} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <label htmlFor={`pf-soc-${f.key}`} className="text-xs text-muted-foreground">{f.label}</label>
                  <input id={`pf-soc-${f.key}`} type="url" value={social[f.key] ?? ''} onChange={(e) => setSocialField(f.key, e.target.value)} placeholder={f.placeholder} className="px-3 py-1.5 border border-border rounded-lg text-sm bg-card" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-end pt-3 border-t border-border">
        <button type="submit" disabled={mut.isPending} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-smooth">
          {mut.isPending && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {t('profile.save')}
        </button>
      </div>
    </form>
  );
}

function SecurityTab({ profile }: { profile: ProfileDTO }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pwMut = useChangePasswordMutation();
  const requestMut = useRequestDeletionMutation();
  const cancelMut = useCancelDeletionMutation();

  // Parol
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Email o'zgartirish
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const hasRequested = !!profile.deletionRequestedAt;
  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40';

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error(t('profile.passwordMismatch'));
    pwMut.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t('profile.passwordChangedMsg'));
          setOldPassword(''); setNewPassword(''); setConfirm('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const requestEmail = async () => {
    setEmailBusy(true);
    try {
      const res = await fetch('/api/profile/email/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('profile.errorGeneric'));
      toast.success(t('profile.codeSent'));
      if (d.devOtp) setEmailOtp(String(d.devOtp));
      setEmailStep('otp');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.errorGeneric'));
    } finally { setEmailBusy(false); }
  };

  const verifyEmail = async () => {
    setEmailBusy(true);
    try {
      const res = await fetch('/api/profile/email/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ newEmail: newEmail.trim(), otp: emailOtp.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('profile.errorGeneric'));
      toast.success(t('profile.emailChanged'));
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('profile.errorGeneric'));
    } finally { setEmailBusy(false); }
  };

  return (
    <div className="space-y-4">
      {/* Email */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold mb-1">{t('profile.emailSection')}</h2>
        <p className="text-xs text-muted-foreground mb-3">{t('profile.emailCurrent')}: <span className="font-mono text-foreground">{profile.email}</span></p>
        {emailStep === 'idle' ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="yangi@email.uz" className={inputCls} />
            <button onClick={requestEmail} disabled={emailBusy || !newEmail.trim()} className="shrink-0 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 transition-smooth">
              {t('profile.sendCode')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('profile.enterCodeSentTo', { email: newEmail })}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input inputMode="numeric" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))} placeholder={t('profile.otpPlaceholder')} className={`${inputCls} tracking-widest font-mono`} />
              <button onClick={verifyEmail} disabled={emailBusy || emailOtp.length !== 6} className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-smooth">
                {t('profile.confirmBtn')}
              </button>
            </div>
            <button onClick={() => { setEmailStep('idle'); setEmailOtp(''); }} className="text-xs text-muted-foreground hover:text-foreground">{t('profile.cancelBtn')}</button>
          </div>
        )}
      </div>

      {/* 2FA */}
      <TwoFactorSection enabled={profile.twoFactorEnabled} />

      {/* Parol */}
      <form onSubmit={submitPassword} className="bg-card border border-border rounded-xl p-6 space-y-3 max-w-md">
        <h2 className="font-heading font-semibold">{t('profile.changePassword2')}</h2>
        <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required placeholder={t('profile.oldPassword')} className={inputCls} />
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder={t('profile.newPasswordLabel')} className={inputCls} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder={t('profile.confirmNewPasswordLabel')} className={inputCls} />
        <p className="text-xs text-muted-foreground">{t('profile.passwordHint')}</p>
        <button type="submit" disabled={pwMut.isPending} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-smooth">
          {pwMut.isPending && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          {t('profile.savePassword')}
        </button>
      </form>

      {/* Qurilmalar */}
      <DevicesSection />

      {/* Hisobni o'chirish */}
      <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-6">
        <h2 className="font-heading font-semibold text-destructive mb-1">{t('profile.deleteAccountLabel')}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t('profile.deleteAccountDesc')}</p>
        {hasRequested ? (
          <>
            <div className="bg-warning/10 text-warning p-3 rounded-lg text-sm mb-3">
              {t('profile.requestSubmitted')}: {formatDateTime(profile.deletionRequestedAt!, locale)}
              {profile.deletionReason && <p className="text-xs mt-1 opacity-80">{t('profile.reasonLabel')}: {profile.deletionReason}</p>}
            </div>
            <button onClick={() => cancelMut.mutate(undefined, { onSuccess: () => toast.success(t('profile.requestCancelled')), onError: (e) => toast.error(e.message) })} disabled={cancelMut.isPending} className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm disabled:opacity-50">
              {t('profile.cancelRequestLabel')}
            </button>
          </>
        ) : (
          <button onClick={() => setDeleteOpen(true)} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm">
            {t('profile.requestDeletion')}
          </button>
        )}
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !requestMut.isPending && setDeleteOpen(false)}>
          <div className="bg-card rounded-2xl shadow-warm-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-heading font-semibold text-destructive mb-2">{t('profile.deletionRequestTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-3">{t('profile.deletionRequestDesc')}</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className={`${inputCls} resize-y mb-4`} placeholder={t('profile.reasonPlaceholder')} />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteOpen(false)} disabled={requestMut.isPending} className="px-3 py-2 text-foreground hover:bg-muted rounded-lg text-sm disabled:opacity-50">{t('profile.cancel')}</button>
              <button onClick={() => requestMut.mutate(reason || null, { onSuccess: () => { toast.success(t('profile.requestSubmitted')); setDeleteOpen(false); }, onError: (e) => toast.error(e.message) })} disabled={requestMut.isPending} className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
                {requestMut.isPending && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {t('profile.sendRequestLabel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsTab({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  const mut = useUpdateNotificationPrefsMutation();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(profile.notificationPrefs);
  useEffect(() => setPrefs(profile.notificationPrefs), [profile.notificationPrefs]);

  const toggle = (key: string) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    mut.mutate({ [key]: newPrefs[key] }, { onError: (err) => { toast.error(err.message); setPrefs(prefs); } });
  };

  const items = [
    { key: 'email_enrollment', label: t('profile.newEnrollments'), desc: t('profile.newEnrollmentsDesc') },
    { key: 'email_assignment_submission', label: t('profile.assignmentSubmitted'), desc: t('profile.assignmentSubmittedDesc') },
    { key: 'email_quiz_completion', label: t('profile.testSubmitted'), desc: t('profile.testSubmittedDesc') },
    { key: 'email_course_update', label: t('profile.courseUpdates'), desc: t('profile.courseUpdatesDesc') },
    { key: 'email_achievement', label: t('profile.achievementsLabel'), desc: t('profile.achievementsDesc') },
    { key: 'email_payment', label: t('profile.paymentsLabel'), desc: t('profile.paymentsDesc') },
    { key: 'email_message', label: t('profile.messagesLabel'), desc: t('profile.messagesDesc') },
    { key: 'email_review', label: t('profile.reviewsLabel'), desc: t('profile.reviewsDesc') },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="font-heading font-semibold mb-1">{t('profile.emailNotifications')}</h2>
      <p className="text-xs text-muted-foreground mb-4">{t('profile.whichEmails')}</p>
      <div className="space-y-1">
        {items.map((it) => (
          <label key={it.key} className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
            <input type="checkbox" checked={!!prefs[it.key]} onChange={() => toggle(it.key)} className="mt-1 accent-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <label className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
          <input type="checkbox" checked={!!prefs.in_app_enabled} onChange={() => toggle('in_app_enabled')} className="mt-1 accent-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('profile.inAppNotifications')}</p>
            <p className="text-xs text-muted-foreground">{t('profile.inAppNotificationsDesc')}</p>
          </div>
        </label>
      </div>
    </div>
  );
}

function PreferencesTab() {
  const { t } = useI18n();
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <h2 className="font-heading font-semibold">{t('profile.preferencesTab')}</h2>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{t('profile.prefsLanguage')}</p>
          <p className="text-xs text-muted-foreground">{t('profile.prefsLanguageDesc')}</p>
        </div>
        <LocaleToggle />
      </div>
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-sm font-medium text-foreground">{t('profile.prefsTheme')}</p>
          <p className="text-xs text-muted-foreground">{t('profile.prefsThemeDesc')}</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

// ── Faol qurilmalar ──
interface DeviceRow { id: string; device: string; ip: string | null; createdAt: string; current: boolean }

function DevicesSection() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [rows, setRows] = useState<DeviceRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/profile/sessions', { credentials: 'include' });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setRows(d.sessions ?? []);
      else setRows([]);
    } catch { setRows([]); }
  };
  useEffect(() => { load(); }, []);

  const revokeOne = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/profile/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error();
      toast.success(t('profile.deviceRevoked'));
      setRows((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    } catch { toast.error(t('profile.errorGeneric')); } finally { setBusyId(null); }
  };

  const revokeAll = async () => {
    try {
      const res = await fetch('/api/profile/sessions/revoke-all', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error();
      toast.success(t('profile.signedOutAll'));
      setTimeout(() => router.push('/login'), 800);
    } catch { toast.error(t('profile.errorGeneric')); }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-semibold">{t('profile.devicesSection')}</h2>
        <button onClick={revokeAll} className="text-xs text-destructive hover:underline">{t('profile.signOutAll')}</button>
      </div>
      {rows === null ? (
        <div className="py-4 flex justify-center"><span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('profile.noOtherDevices')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon name="ComputerDesktopIcon" size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  {r.device}
                  {r.current && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">{t('profile.thisDevice')}</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{r.ip ?? '—'} · {formatDateTime(r.createdAt, locale)}</p>
              </div>
              {!r.current && (
                <button onClick={() => revokeOne(r.id)} disabled={busyId === r.id} className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-50">
                  {t('profile.revokeDevice')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground mt-3">{t('profile.signOutAllDesc')}</p>
    </div>
  );
}

// ── 2FA (TOTP) ──
function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [step, setStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [setupData, setSetupData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-card tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/40';

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.myProfile });

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/profile/2fa/setup', { method: 'POST', credentials: 'include' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('profile.errorGeneric'));
      setSetupData({ secret: d.secret, qrDataUrl: d.qrDataUrl });
      setStep('setup');
    } catch (e) { toast.error(e instanceof Error ? e.message : t('profile.errorGeneric')); } finally { setBusy(false); }
  };

  const confirmEnable = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/profile/2fa/enable', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ token: code.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('profile.errorGeneric'));
      toast.success(t('profile.twoFactorEnabled'));
      setBackupCodes(d.backupCodes ?? []);
      setStep('idle'); setSetupData(null); setCode('');
      invalidate();
    } catch (e) { toast.error(e instanceof Error ? e.message : t('profile.errorGeneric')); } finally { setBusy(false); }
  };

  const confirmDisable = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/profile/2fa/disable', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ code: code.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('profile.errorGeneric'));
      toast.success(t('profile.twoFactorDisabled'));
      setStep('idle'); setCode('');
      invalidate();
    } catch (e) { toast.error(e instanceof Error ? e.message : t('profile.errorGeneric')); } finally { setBusy(false); }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold flex items-center gap-2">
            {t('profile.twoFactor')}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
              {enabled ? t('profile.twoFactorOn') : t('profile.twoFactorOff')}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('profile.twoFactorDesc')}</p>
        </div>
        {step === 'idle' && !enabled && (
          <button onClick={startSetup} disabled={busy} className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-smooth">{t('profile.enable2fa')}</button>
        )}
        {step === 'idle' && enabled && (
          <button onClick={() => setStep('disable')} className="shrink-0 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-smooth">{t('profile.disable2fa')}</button>
        )}
      </div>

      {step === 'setup' && setupData && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">{t('profile.scan2fa')}</p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img src={setupData.qrDataUrl} alt="2FA QR" className="w-40 h-40 rounded-lg border border-border" />
            <code className="text-xs font-mono break-all bg-muted px-3 py-2 rounded-lg">{setupData.secret}</code>
          </div>
          <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder={t('profile.enter2faCode')} className={inputCls} />
          <div className="flex gap-2">
            <button onClick={confirmEnable} disabled={busy || code.length !== 6} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-smooth">{t('profile.confirmBtn')}</button>
            <button onClick={() => { setStep('idle'); setSetupData(null); setCode(''); }} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm">{t('profile.cancelBtn')}</button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">{t('profile.enter2faCode')}</p>
          <input inputMode="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('profile.enter2faCode')} className={inputCls} />
          <div className="flex gap-2">
            <button onClick={confirmDisable} disabled={busy || !code.trim()} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium disabled:opacity-50">{t('profile.disable2fa')}</button>
            <button onClick={() => { setStep('idle'); setCode(''); }} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm">{t('profile.cancelBtn')}</button>
          </div>
        </div>
      )}

      {backupCodes && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-2">{t('profile.backupCodes')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backupCodes.map((c) => <code key={c} className="text-xs font-mono bg-muted px-2 py-1.5 rounded text-center">{c}</code>)}
          </div>
          <button onClick={() => setBackupCodes(null)} className="mt-3 text-xs text-primary hover:underline">{t('profile.confirmBtn')}</button>
        </div>
      )}
    </div>
  );
}
