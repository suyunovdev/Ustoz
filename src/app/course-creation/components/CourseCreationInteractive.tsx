'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import CourseMetadataForm from './CourseMetadataForm';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { queryKeys } from '@/hooks/queries/queryKeys';

interface CourseMetadata {
  title: string;
  description: string;
  category: string;
  priceUZS: string;
  coverImage: string;
  language: string;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
  difficultyLevel: string;
}

/**
 * Kurs yaratish = QISQA metadata forma. "Yaratish" bosilganda kurs DRAFT holatда
 * serverда yaratiladi va o'qituvchi darhol YAGONA MUHARRIRга (/teacher-dashboard/courses/[id])
 * yo'naltiriladi — mavzu/kontent/video/material/test o'sha yerда qo'shiladi.
 * Ilgari bu yerда 5 bosqichli wizard bor edi (dublikat, material yo'qolishi, localStorage
 * qoralama muammolari bilan) — endi yagona haqiqat manbai muharrir.
 */
const CourseCreationInteractive = () => {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [metadata, setMetadata] = useState<CourseMetadata>({
    title: '',
    description: '',
    category: '',
    priceUZS: '',
    coverImage: '',
    language: '',
    targetAudience: '',
    subjectCategory: '',
    gradeLevel: '',
    difficultyLevel: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const canCreate =
    !!metadata.title.trim() && !!metadata.targetAudience && !!metadata.subjectCategory;

  const handleCreate = async () => {
    if (!metadata.title.trim()) return toast.error(t('courseCreation.titleRequired'));
    if (!metadata.targetAudience) return toast.error(t('courseCreation.audienceRequired'));
    if (!metadata.subjectCategory) return toast.error(t('courseCreation.subjectRequired'));

    setIsSaving(true);
    try {
      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: metadata.title.trim(),
          description: metadata.description || '',
          category: metadata.category || 'general',
          targetAudience: metadata.targetAudience,
          subjectCategory: metadata.subjectCategory,
          gradeLevel: metadata.gradeLevel ? parseInt(metadata.gradeLevel) : null,
          priceUzs: String(parseInt(metadata.priceUZS) || 0),
          coverImage: metadata.coverImage || null,
          language: metadata.language || 'uz',
          difficultyLevel: metadata.difficultyLevel || null,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
            {t('courseCreation.newCourseTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('courseCreation.newCourseSubtitle')}
          </p>
        </div>

        <CourseMetadataForm metadata={metadata} onMetadataChange={setMetadata} />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSaving || !canCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Icon name={isSaving ? 'ArrowPathIcon' : 'PlusIcon'} size={18} />
            {isSaving ? t('courseCreation.creating') : t('courseCreation.createAndContinue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCreationInteractive;
