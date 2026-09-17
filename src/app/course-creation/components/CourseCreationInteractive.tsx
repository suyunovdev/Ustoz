'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Icon from '@/components/ui/AppIcon';
import FormField, { fieldClasses } from '@/components/ui/FormField';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { buildSubjectGroups, buildTargetAudiences } from '@/lib/data/subject-groups';
import { queryKeys } from '@/hooks/queries/queryKeys';

interface Draft {
  title: string;
  targetAudience: string;
  subjectCategory: string;
}

type FieldKey = keyof Draft;

/**
 * Kurs yaratish = ENG QISQA forma: faqat 3 MAJBURIY maydon (nom, kim uchun, fan).
 * "Yaratish" bosilganda kurs DRAFT holatda serverda yaratiladi va o'qituvchi darhol
 * YAGONA MUHARRIRga (/teacher-dashboard/courses/[id]) yo'naltiriladi — muqova, tavsif,
 * narx, mavzu/kontent/video/test o'sha yerda ("Kurs sozlamalari" + mavzular) qo'shiladi.
 *
 * Ilgari bu yerda 10 maydonli forma bor edi (7 tasi soxta "majburiy" — hech qachon
 * majburlanmasdi, faqat chalg'itardi). Endi start engil: 3 maydon → 1 tugma → muharrir.
 */
const CourseCreationInteractive = () => {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<Draft>({
    title: '',
    targetAudience: '',
    subjectCategory: '',
  });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);
  // Eski "Tahrirlash" havolasi (/course-creation?edit=ID) — endi tahrirlash YAGONA
  // MUHARRIRda bo'ladi. Bu sahifa faqat yaratish; ?edit=ID kelsa muharrirga yo'naltiramiz
  // (aks holda o'qituvchi bo'sh "Yangi kurs" formasini ko'rib, tahrirlay olmaydi).
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (editId) {
      setRedirecting(true);
      router.replace(`/teacher-dashboard/courses/${editId}`);
    }
  }, [router]);

  const targetAudiences = buildTargetAudiences(t);
  const subjectGroups = buildSubjectGroups(t);

  const errors: Partial<Record<FieldKey, string>> = {
    title:
      touched.title && draft.title.trim().length < 3 ? t('courseCreation.titleRequired') : '',
    targetAudience:
      touched.targetAudience && !draft.targetAudience ? t('courseCreation.audienceRequired') : '',
    subjectCategory:
      touched.subjectCategory && !draft.subjectCategory ? t('courseCreation.subjectRequired') : '',
  };

  const canCreate =
    draft.title.trim().length >= 3 && !!draft.targetAudience && !!draft.subjectCategory;

  const markTouched = (field: FieldKey) => setTouched((prev) => ({ ...prev, [field]: true }));

  const update = (field: FieldKey, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!canCreate) {
      setTouched({ title: true, targetAudience: true, subjectCategory: true });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title.trim(),
          description: '',
          category: 'general',
          targetAudience: draft.targetAudience,
          subjectCategory: draft.subjectCategory,
          gradeLevel: null,
          priceUzs: '0',
          coverImage: null,
          language: 'uz',
          difficultyLevel: null,
          totalDuration: 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t('courseCreation.createFailed'));
        return;
      }
      toast.success(t('courseCreation.created'));
      // Dashboard "Kurslarim" ro'yxati keshini eskirtiramiz — yangi draft darhol ko'rinadi.
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherDashboard });
      router.push(`/teacher-dashboard/courses/${data.course.id}`);
    } catch {
      toast.error(t('courseCreation.networkError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
            {t('courseCreation.newCourseTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('courseCreation.newCourseSubtitle')}
          </p>
        </div>

        <form
          className="bg-card rounded-md shadow-warm p-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <FormField
            label={t('courseCreation.courseTitle')}
            htmlFor="course-title"
            required
            error={errors.title}
          >
            <input
              id="course-title"
              type="text"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              onBlur={() => markTouched('title')}
              placeholder={t('courseCreation.courseTitlePlaceholder')}
              className={fieldClasses(!!errors.title)}
              aria-invalid={!!errors.title}
              autoFocus
            />
          </FormField>

          <FormField
            label={t('courseCreation.targetAudience')}
            htmlFor="course-audience"
            required
            error={errors.targetAudience}
          >
            <select
              id="course-audience"
              value={draft.targetAudience}
              onChange={(e) => {
                update('targetAudience', e.target.value);
                markTouched('targetAudience');
              }}
              onBlur={() => markTouched('targetAudience')}
              className={fieldClasses(!!errors.targetAudience)}
              aria-invalid={!!errors.targetAudience}
            >
              <option value="">{t('courseCreation.selectAudience')}</option>
              {targetAudiences.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={t('courseCreation.subjectName')}
            htmlFor="course-subject"
            required
            error={errors.subjectCategory}
            hint={!draft.targetAudience ? t('courseCreation.selectSubjectFirst') : undefined}
          >
            <select
              id="course-subject"
              value={draft.subjectCategory}
              onChange={(e) => {
                update('subjectCategory', e.target.value);
                markTouched('subjectCategory');
              }}
              onBlur={() => markTouched('subjectCategory')}
              disabled={!draft.targetAudience}
              className={`${fieldClasses(!!errors.subjectCategory)} disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-invalid={!!errors.subjectCategory}
            >
              <option value="">
                {!draft.targetAudience
                  ? t('courseCreation.selectSubjectFirst')
                  : t('courseCreation.selectSubject')}
              </option>
              {subjectGroups.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((subject) => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </FormField>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Icon name={isSaving ? 'ArrowPathIcon' : 'PlusIcon'} size={18} />
              {isSaving ? t('courseCreation.creating') : t('courseCreation.createAndContinue')}
            </button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          {t('courseCreation.createMoreLater')}
        </p>
      </div>
    </div>
  );
};

export default CourseCreationInteractive;
