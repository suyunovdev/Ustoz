'use client';

import { useEffect, useState } from 'react';
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

type TabId = 'profile' | 'password' | 'notifications' | 'account';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profil', icon: 'UserIcon' },
  { id: 'password', label: 'Parol', icon: 'KeyIcon' },
  { id: 'notifications', label: 'Bildirishnomalar', icon: 'BellIcon' },
  { id: 'account', label: 'Hisob', icon: 'Cog6ToothIcon' },
];

export default function ProfileClient() {
  const { data, isLoading, error } = useMyProfile();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  if (isLoading || !data) return <div className="p-8">Yuklanmoqda…</div>;
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
        <h1 className="text-2xl font-heading font-semibold">Profil sozlamalari</h1>
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
        onSuccess: () => toast.success('Profil yangilandi'),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const setSocialField = (key: string, value: string) =>
    setSocial((s) => ({ ...s, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-6 space-y-4">
      <h2 className="font-medium mb-3">Profil ma'lumotlari</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Ism-familiya *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Avatar URL</label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        {avatarUrl && (
          <img
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
              Tagline / Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={150}
              placeholder="Senior JavaScript Engineer · 10 yil tajriba"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Kasbiy tajriba va dars berish uslubingiz haqida..."
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length} / 1000
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mavzular (vergul bilan ajratilgan)
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
            <label className="block text-sm font-medium mb-2">Ijtimoiy tarmoqlar</label>
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
            Ommaviy profil
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
          Saqlash
        </button>
      </div>
    </form>
  );
}

function PasswordTab() {
  const mut = useChangePasswordMutation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Yangi parol va tasdiqlash mos kelmadi");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 belgi");
      return;
    }
    mut.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Parol o'zgartirildi");
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
      <h2 className="font-medium mb-3">Parolni o'zgartirish</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Eski parol *</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Yangi parol *</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Kamida 6 belgi</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Yangi parolni tasdiqlang *</label>
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
        Parolni saqlash
      </button>
    </form>
  );
}

function NotificationsTab({ profile }: { profile: ProfileDTO }) {
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
    { key: 'email_enrollment', label: 'Yangi yozilishlar', desc: 'Talaba kursingizga yozilganda' },
    {
      key: 'email_assignment_submission',
      label: 'Vazifa topshirildi',
      desc: 'Talaba vazifani yuborgan paytda',
    },
    { key: 'email_quiz_completion', label: 'Test topshirildi', desc: 'Talaba testni tugatganda' },
    { key: 'email_course_update', label: 'Kurs yangiliklari', desc: 'Sizning kurslaringizdagi yangiliklar' },
    { key: 'email_achievement', label: 'Yutuqlar', desc: 'Sertifikat va mukofotlar' },
    { key: 'email_payment', label: "To'lovlar", desc: "Yangi to'lov va withdraw holatlari" },
    { key: 'email_message', label: 'Xabarlar', desc: 'Yangi DM xabar' },
    { key: 'email_review', label: 'Sharhlar', desc: 'Talaba sharh qoldirgan paytda' },
  ];

  return (
    <div className="bg-card border border-border rounded-md p-6">
      <h2 className="font-medium mb-1">Email bildirishnomalari</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Qaysi turdagi email'larni olishni xohlaysiz
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
            <p className="text-sm font-medium">In-app bildirishnomalar</p>
            <p className="text-xs text-muted-foreground">
              Web ilovada bell icon va dropdown orqali
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

function AccountTab({ profile }: { profile: ProfileDTO }) {
  const requestMut = useRequestDeletionMutation();
  const cancelMut = useCancelDeletionMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');

  const hasRequested = !!profile.deletionRequestedAt;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-md p-6">
        <h2 className="font-medium mb-1">Hisob ma'lumotlari</h2>
        <p className="text-xs text-muted-foreground mb-4">Asosiy hisob ma'lumotlari</p>

        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-foreground font-mono">{profile.email}</dd>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">Rol</dt>
            <dd className="text-foreground capitalize">{profile.role}</dd>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">Ro'yxat sanasi</dt>
            <dd className="text-foreground">
              {new Date(profile.createdAt).toLocaleDateString('uz-UZ')}
            </dd>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <dt className="text-muted-foreground">Oxirgi kirish</dt>
            <dd className="text-foreground">
              {profile.lastLoginAt
                ? new Date(profile.lastLoginAt).toLocaleString('uz-UZ')
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-destructive/5 border border-destructive/30 rounded-md p-6">
        <h2 className="font-medium text-destructive mb-1">
          ⚠ Hisobni o'chirish
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Hisobingizni o'chirish so'rovini yuborasiz. Admin ko'rib chiqadi va
          tasdiqlaydi. Bu jarayonni bekor qilishingiz mumkin.
        </p>

        {hasRequested ? (
          <>
            <div className="bg-warning/10 text-warning p-3 rounded-md text-sm mb-3">
              ⏳ So'rov yuborildi:{' '}
              {new Date(profile.deletionRequestedAt!).toLocaleString('uz-UZ')}
              {profile.deletionReason && (
                <p className="text-xs mt-1 opacity-80">
                  Sabab: {profile.deletionReason}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                cancelMut.mutate(undefined, {
                  onSuccess: () => toast.success("So'rov bekor qilindi"),
                  onError: (err) => toast.error(err.message),
                })
              }
              disabled={cancelMut.isPending}
              className="px-4 py-2 bg-warning text-warning-foreground rounded-md text-sm disabled:opacity-50"
            >
              So'rovni bekor qilish
            </button>
          </>
        ) : (
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm"
          >
            Hisobni o'chirishni so'rash
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
              Hisobni o'chirish so'rovi
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Bu jarayon admin tomonidan tasdiqlanishi kerak.
            </p>
            <label className="block text-xs font-medium mb-1">Sabab (ixtiyoriy)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y mb-4"
              placeholder="Nima uchun hisobni o'chirmoqchisiz?"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={requestMut.isPending}
                className="px-3 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
              >
                Bekor
              </button>
              <button
                onClick={() =>
                  requestMut.mutate(reason || null, {
                    onSuccess: () => {
                      toast.success("So'rov yuborildi");
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
                So'rovni yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
