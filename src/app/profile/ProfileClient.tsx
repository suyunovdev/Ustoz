'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useMyProfile, type ProfileDTO } from '@/hooks/queries/useProfile';
import {
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUpdateNotificationPrefsMutation,
  useRequestDeletionMutation,
  useCancelDeletionMutation,
} from '@/hooks/mutations/useProfileMutations';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate, formatDateTime } from '@/lib/i18n/format';

type TabId = 'profile' | 'password' | 'notifications' | 'account';

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

// Rasmni brauzerda 256px kvadratga kesib/kichraytiradi (JPEG data URL, ~20-40KB).
// Server-yuki YO'Q, R2 kerak emas, barcha rol uchun ishlaydi.
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

// ── Avatar (yuklash tugmasi bilan) ──
function AvatarUpload({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  const mut = useUpdateProfileMutation();
  const [preview, setPreview] = useState(profile.avatarUrl ?? '');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = (profile.fullName || profile.email || '?').charAt(0).toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatarImageOnly'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t('profile.avatarTooLarge'));
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 256, 0.85);
      mut.mutate(
        { avatarUrl: dataUrl },
        {
          onSuccess: () => {
            setPreview(dataUrl);
            toast.success(t('profile.avatarUpdated'));
          },
          onError: (err) => toast.error(err.message),
          onSettled: () => setBusy(false),
        },
      );
    } catch {
      toast.error(t('profile.avatarError'));
      setBusy(false);
    }
  };

  return (
    <div className="relative w-24 h-24 shrink-0">
      <div className="w-24 h-24 rounded-full border-4 border-card bg-primary/10 overflow-hidden shadow-warm-lg flex items-center justify-center">
        {preview ? (
          <img src={preview} alt={profile.fullName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-heading font-bold text-primary">{initial}</span>
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

// ── Profil header (identifikatsiya) ──
function ProfileHeader({ profile }: { profile: ProfileDTO }) {
  const { t, locale } = useI18n();
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6 shadow-warm">
      <div className="h-24 bg-gradient-to-r from-primary to-secondary" />
      <div className="px-6 pb-5 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
        <AvatarUpload profile={profile} />
        <div className="flex-1 sm:pb-2 min-w-0">
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
            className="shrink-0 self-start sm:self-end px-3 py-2 border border-border rounded-md text-sm text-primary hover:bg-muted transition-smooth inline-flex items-center gap-1.5"
          >
            <Icon name="EyeIcon" size={14} />
            {t('profile.publicProfile')}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ProfileClient() {
  const { data, isLoading, error } = useMyProfile();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'profile', label: t('profile.profileTab'), icon: 'UserIcon' },
    { id: 'password', label: t('profile.passwordTab'), icon: 'KeyIcon' },
    { id: 'notifications', label: t('profile.notificationsTab'), icon: 'BellIcon' },
    { id: 'account', label: t('profile.accountTab'), icon: 'Cog6ToothIcon' },
  ];

  if (isLoading || !data) return <div className="p-8">{t('common.loading')}</div>;
  if (error)
    return <div className="p-8 text-destructive">{(error as Error).message}</div>;

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

      <ProfileHeader profile={profile} />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                activeTab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div>
          {activeTab === 'profile' && <ProfileTab profile={profile} />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'notifications' && <NotificationsTab profile={profile} />}
          {activeTab === 'account' && <AccountTab profile={profile} />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  const mut = useUpdateProfileMutation();
  const [fullName, setFullName] = useState(profile.fullName);
  const [headline, setHeadline] = useState(profile.headline ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [expertiseStr, setExpertiseStr] = useState(profile.expertise.join(', '));
  const [social, setSocial] = useState<Record<string, string>>(profile.socialLinks);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expertise = expertiseStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    mut.mutate(
      {
        fullName,
        headline,
        bio,
        expertise,
        socialLinks: social,
      },
      {
        onSuccess: () => toast.success(t('profile.profileUpdated2')),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const setSocialField = (key: string, value: string) =>
    setSocial((s) => ({ ...s, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 space-y-4">
      <h2 className="font-medium mb-3">{t('profile.profileInfo')}</h2>

      <div>
        <label htmlFor="profile-fullname" className="block text-sm font-medium mb-1">{t('profile.fullName')}</label>
        <input
          id="profile-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>

      {profile.role === 'teacher' && (
        <>
          <div>
            <label htmlFor="profile-headline" className="block text-sm font-medium mb-1">
              {t('profile.tagline')}
            </label>
            <input
              id="profile-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={150}
              placeholder={t('profile.taglinePlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          <div>
            <label htmlFor="profile-bio" className="block text-sm font-medium mb-1">{t('profile.bio')}</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t('profile.bioPlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length} / 1000
            </p>
          </div>

          <div>
            <label htmlFor="profile-expertise" className="block text-sm font-medium mb-1">
              {t('profile.topics')}
            </label>
            <input
              id="profile-expertise"
              type="text"
              value={expertiseStr}
              onChange={(e) => setExpertiseStr(e.target.value)}
              placeholder="React, TypeScript, Node.js"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('profile.socialNetworks')}</label>
            <div className="space-y-2">
              {[
                { key: 'website', label: 'Website', placeholder: 'https://…' },
                { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…' },
                { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/…' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/…' },
                { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/…' },
                { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/…' },
              ].map((f) => (
                <div key={f.key} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                  <label htmlFor={`profile-social-${f.key}`} className="text-xs text-muted-foreground">{f.label}</label>
                  <input
                    id={`profile-social-${f.key}`}
                    type="url"
                    value={social[f.key] ?? ''}
                    onChange={(e) => setSocialField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        {profile.role === 'teacher' && (
          <Link
            href={`/teachers/${profile.id}`}
            target="_blank"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <Icon name="EyeIcon" size={12} />
            {t('profile.publicProfile')}
          </Link>
        )}
        <button
          type="submit"
          disabled={mut.isPending}
          className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {mut.isPending && (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {t('profile.save')}
        </button>
      </div>
    </form>
  );
}

function PasswordTab() {
  const { t } = useI18n();
  const mut = useChangePasswordMutation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('profile.passwordTooShort'));
      return;
    }
    mut.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t('profile.passwordChangedMsg'));
          setOldPassword('');
          setNewPassword('');
          setConfirm('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 space-y-4 max-w-md">
      <h2 className="font-medium mb-3">{t('profile.changePassword2')}</h2>
      <div>
        <label htmlFor="profile-old-password" className="block text-sm font-medium mb-1">{t('profile.oldPassword')}</label>
        <input
          id="profile-old-password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>
      <div>
        <label htmlFor="profile-new-password" className="block text-sm font-medium mb-1">{t('profile.newPasswordLabel')}</label>
        <input
          id="profile-new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">{t('profile.minChars')}</p>
      </div>
      <div>
        <label htmlFor="profile-confirm-password" className="block text-sm font-medium mb-1">{t('profile.confirmNewPasswordLabel')}</label>
        <input
          id="profile-confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={mut.isPending}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {mut.isPending && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {t('profile.savePassword')}
      </button>
    </form>
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
    mut.mutate(
      { [key]: newPrefs[key] },
      {
        onError: (err) => {
          toast.error(err.message);
          setPrefs(prefs); // rollback
        },
      },
    );
  };

  const items = [
    { key: 'email_enrollment', label: t('profile.newEnrollments'), desc: t('profile.newEnrollmentsDesc') },
    {
      key: 'email_assignment_submission',
      label: t('profile.assignmentSubmitted'),
      desc: t('profile.assignmentSubmittedDesc'),
    },
    { key: 'email_quiz_completion', label: t('profile.testSubmitted'), desc: t('profile.testSubmittedDesc') },
    { key: 'email_course_update', label: t('profile.courseUpdates'), desc: t('profile.courseUpdatesDesc') },
    { key: 'email_achievement', label: t('profile.achievementsLabel'), desc: t('profile.achievementsDesc') },
    { key: 'email_payment', label: t('profile.paymentsLabel'), desc: t('profile.paymentsDesc') },
    { key: 'email_message', label: t('profile.messagesLabel'), desc: t('profile.messagesDesc') },
    { key: 'email_review', label: t('profile.reviewsLabel'), desc: t('profile.reviewsDesc') },
  ];

  return (
    <div className="bg-card border border-border rounded-md p-6">
      <h2 className="font-medium mb-1">{t('profile.emailNotifications')}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {t('profile.whichEmails')}
      </p>

      <div className="space-y-2">
        {items.map((it) => (
          <label
            key={it.key}
            className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer"
          >
            <input
              type="checkbox"
              checked={!!prefs[it.key]}
              onChange={() => toggle(it.key)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <label className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer">
          <input
            type="checkbox"
            checked={!!prefs.in_app_enabled}
            onChange={() => toggle('in_app_enabled')}
            className="mt-1"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">{t('profile.inAppNotifications')}</p>
            <p className="text-xs text-muted-foreground">
              {t('profile.inAppNotificationsDesc')}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

function AccountTab({ profile }: { profile: ProfileDTO }) {
  const { t, locale } = useI18n();
  const requestMut = useRequestDeletionMutation();
  const cancelMut = useCancelDeletionMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');

  const hasRequested = !!profile.deletionRequestedAt;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-md p-6">
        <h2 className="font-medium mb-1">{t('profile.accountInfo')}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t('profile.accountInfoDesc')}</p>

        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">{t('profile.emailLabel')}</dt>
            <dd className="text-foreground font-mono">{profile.email}</dd>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">{t('profile.role')}</dt>
            <dd className="text-foreground capitalize">{profile.role}</dd>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">{t('profile.registrationDate')}</dt>
            <dd className="text-foreground">
              {formatDate(profile.createdAt, locale)}
            </dd>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">{t('profile.lastLoginLabel')}</dt>
            <dd className="text-foreground">
              {profile.lastLoginAt
                ? formatDateTime(profile.lastLoginAt, locale)
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-destructive/5 border border-destructive/30 rounded-md p-6">
        <h2 className="font-medium text-destructive mb-1">
          ⚠ {t('profile.deleteAccountLabel')}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {t('profile.deleteAccountDesc')}
        </p>

        {hasRequested ? (
          <>
            <div className="bg-warning/10 text-warning p-3 rounded-md text-sm mb-3">
              ⏳ {t('profile.requestSubmitted')}:{' '}
              {formatDateTime(profile.deletionRequestedAt!, locale)}
              {profile.deletionReason && (
                <p className="text-xs mt-1 opacity-80">
                  {t('profile.reasonLabel')}: {profile.deletionReason}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                cancelMut.mutate(undefined, {
                  onSuccess: () => toast.success(t('profile.requestCancelled')),
                  onError: (err) => toast.error(err.message),
                })
              }
              disabled={cancelMut.isPending}
              className="px-4 py-2 bg-warning text-warning-foreground rounded-md text-sm disabled:opacity-50"
            >
              {t('profile.cancelRequestLabel')}
            </button>
          </>
        ) : (
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm"
          >
            {t('profile.requestDeletion')}
          </button>
        )}
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !requestMut.isPending && setDeleteOpen(false)}
        >
          <div
            className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-heading font-semibold text-destructive mb-2">
              {t('profile.deletionRequestTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t('profile.deletionRequestDesc')}
            </p>
            <label htmlFor="profile-deletion-reason" className="block text-xs font-medium mb-1">{t('profile.reasonOptional')}</label>
            <textarea
              id="profile-deletion-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y mb-4"
              placeholder={t('profile.reasonPlaceholder')}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={requestMut.isPending}
                className="px-3 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={() =>
                  requestMut.mutate(reason || null, {
                    onSuccess: () => {
                      toast.success(t('profile.requestSubmitted'));
                      setDeleteOpen(false);
                    },
                    onError: (err) => toast.error(err.message),
                  })
                }
                disabled={requestMut.isPending}
                className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {requestMut.isPending && (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {t('profile.sendRequestLabel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
