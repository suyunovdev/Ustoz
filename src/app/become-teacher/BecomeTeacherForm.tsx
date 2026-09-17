'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import FormField, { fieldClasses } from '@/components/ui/FormField';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';

interface ActiveApplication {
  status: string; // pending | under_review | approved | rejected
  feedback?: string | null;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  expertise: string;
  bio: string;
  motivation: string;
  experience: string;
  sampleUrl: string;
}

type RequiredKey = 'expertise' | 'bio' | 'motivation';

/**
 * "Ustoz bo'lish" ariza formasi. Self-signup faqat student yaratadi (vetting) — ustoz
 * bo'lish uchun foydalanuvchi shu ariza formasini to'ldiradi (mutaxassislik/bio/motivatsiya),
 * admin ko'rib chiqib tasdiqlaydi, so'ng rol ustozga o'tadi.
 */
export default function BecomeTeacherForm() {
  const { t } = useI18n();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveApplication | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    expertise: '',
    bio: '',
    motivation: '',
    experience: '',
    sampleUrl: '',
  });
  const [touched, setTouched] = useState<Partial<Record<RequiredKey, boolean>>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [meRes, appRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/teacher-applications', { credentials: 'include' }),
        ]);
        const me = await meRes.json().catch(() => ({}));
        const app = await appRes.json().catch(() => ({}));
        if (!alive) return;
        if (me?.user) {
          // Ustoz allaqachon bo'lsa — dashboard'ga.
          if (me.user.role === 'teacher' || me.user.role === 'admin') {
            router.replace('/teacher-dashboard');
            return;
          }
          setForm((f) => ({ ...f, fullName: me.user.fullName ?? '', email: me.user.email ?? '' }));
        }
        if (app?.application) {
          setActive({ status: app.application.status, feedback: app.application.feedback });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const errors: Partial<Record<RequiredKey, string>> = {
    expertise:
      touched.expertise && form.expertise.trim().length < 3 ? t('becomeTeacher.expertiseErr') : '',
    bio: touched.bio && form.bio.trim().length < 30 ? t('becomeTeacher.bioErr') : '',
    motivation:
      touched.motivation && form.motivation.trim().length < 30 ? t('becomeTeacher.motivationErr') : '',
  };
  const canSubmit =
    form.expertise.trim().length >= 3 &&
    form.bio.trim().length >= 30 &&
    form.motivation.trim().length >= 30;

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: RequiredKey) => setTouched((p) => ({ ...p, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setTouched({ expertise: true, bio: true, motivation: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/teacher-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || t('becomeTeacher.submitFailed'));
        return;
      }
      toast.success(t('becomeTeacher.submitted'));
      setActive({ status: 'pending' });
    } catch {
      toast.error(t('becomeTeacher.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Faol ariza bor — holatni ko'rsatamiz (qayta topshirmaydi).
  if (active) {
    const isRejected = active.status === 'rejected';
    const isApproved = active.status === 'approved';
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-xl mx-auto w-full px-4 py-12">
          <div className="bg-card rounded-md shadow-warm p-8 text-center">
            <div
              className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center ${
                isApproved
                  ? 'bg-success/10 text-success'
                  : isRejected
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-warning/10 text-warning'
              }`}
            >
              <Icon
                name={isApproved ? 'CheckCircleIcon' : isRejected ? 'XCircleIcon' : 'ClockIcon'}
                size={30}
              />
            </div>
            <h1 className="text-xl font-heading font-bold text-foreground mb-2">
              {t(`becomeTeacher.status_${active.status}`)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isApproved
                ? t('becomeTeacher.approvedDesc')
                : isRejected
                  ? t('becomeTeacher.rejectedDesc')
                  : t('becomeTeacher.pendingDesc')}
            </p>
            {active.feedback && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm text-foreground text-left">
                <span className="font-medium">{t('becomeTeacher.feedback')}: </span>
                {active.feedback}
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push(isApproved ? '/teacher-dashboard' : '/student-dashboard')}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isApproved ? t('becomeTeacher.goToDashboard') : t('becomeTeacher.goToStudent')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
            {t('becomeTeacher.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('becomeTeacher.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="bg-card rounded-md shadow-warm p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t('becomeTeacher.fullName')} htmlFor="bt-name">
              <input
                id="bt-name"
                type="text"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className={fieldClasses()}
              />
            </FormField>
            <FormField label={t('becomeTeacher.phone')} htmlFor="bt-phone">
              <input
                id="bt-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+998 90 123 45 67"
                className={fieldClasses()}
              />
            </FormField>
          </div>

          <FormField
            label={t('becomeTeacher.expertise')}
            htmlFor="bt-expertise"
            required
            error={errors.expertise}
            hint={t('becomeTeacher.expertiseHint')}
          >
            <input
              id="bt-expertise"
              type="text"
              value={form.expertise}
              onChange={(e) => set('expertise', e.target.value)}
              onBlur={() => blur('expertise')}
              placeholder={t('becomeTeacher.expertisePlaceholder')}
              className={fieldClasses(!!errors.expertise)}
              aria-invalid={!!errors.expertise}
            />
          </FormField>

          <FormField
            label={t('becomeTeacher.bio')}
            htmlFor="bt-bio"
            required
            error={errors.bio}
            hint={t('becomeTeacher.bioHint')}
          >
            <textarea
              id="bt-bio"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              onBlur={() => blur('bio')}
              rows={4}
              placeholder={t('becomeTeacher.bioPlaceholder')}
              className={`${fieldClasses(!!errors.bio)} resize-y`}
              aria-invalid={!!errors.bio}
            />
          </FormField>

          <FormField
            label={t('becomeTeacher.motivation')}
            htmlFor="bt-motivation"
            required
            error={errors.motivation}
            hint={t('becomeTeacher.motivationHint')}
          >
            <textarea
              id="bt-motivation"
              value={form.motivation}
              onChange={(e) => set('motivation', e.target.value)}
              onBlur={() => blur('motivation')}
              rows={3}
              placeholder={t('becomeTeacher.motivationPlaceholder')}
              className={`${fieldClasses(!!errors.motivation)} resize-y`}
              aria-invalid={!!errors.motivation}
            />
          </FormField>

          <FormField label={t('becomeTeacher.experience')} htmlFor="bt-experience">
            <textarea
              id="bt-experience"
              value={form.experience}
              onChange={(e) => set('experience', e.target.value)}
              rows={2}
              placeholder={t('becomeTeacher.experiencePlaceholder')}
              className={`${fieldClasses()} resize-y`}
            />
          </FormField>

          <FormField label={t('becomeTeacher.sampleUrl')} htmlFor="bt-sample" hint={t('becomeTeacher.sampleHint')}>
            <input
              id="bt-sample"
              type="url"
              value={form.sampleUrl}
              onChange={(e) => set('sampleUrl', e.target.value)}
              placeholder="https://..."
              className={fieldClasses()}
            />
          </FormField>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {submitting ? t('becomeTeacher.submitting') : t('becomeTeacher.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
