'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
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
      <div className="mb-6">
        <Link
          href={profile.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'}
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
        >
          <Icon name="ArrowLeftIcon" size={14} />
          Dashboard
        </Link>
        <h1 className="text-2xl font-heading font-semibold">{t('profile.profileSettings')}</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>

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
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
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
        avatarUrl: avatarUrl || null,
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
        <label className="block text-sm font-medium mb-1">{t('profile.fullName')}</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('profile.avatarUrl')}</label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        {avatarUrl && (
          <AppImage
            src={avatarUrl}
            alt="preview"
            className="mt-2 w-16 h-16 rounded-full object-cover"
          />
        )}
      </div>

      {profile.role === 'teacher' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('profile.tagline')}
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={150}
              placeholder={t('profile.taglinePlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.bio')}</label>
            <textarea
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
            <label className="block text-sm font-medium mb-1">
              {t('profile.topics')}
            </label>
            <input
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
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <input
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
        <label className="block text-sm font-medium mb-1">{t('profile.oldPassword')}</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('profile.newPasswordLabel')}</label>
        <input
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
        <label className="block text-sm font-medium mb-1">{t('profile.confirmNewPasswordLabel')}</label>
        <input
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
            <label className="block text-xs font-medium mb-1">{t('profile.reasonOptional')}</label>
            <textarea
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
