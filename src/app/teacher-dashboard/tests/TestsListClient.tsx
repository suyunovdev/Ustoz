'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherTests,
  type TestListItemDTO,
  type TestStatusDTO,
} from '@/hooks/queries/useTeacherTests';
import {
  useCreateTestMutation,
  useDeleteTestMutation,
} from '@/hooks/mutations/useTestMutations';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';
import { useI18n } from '@/contexts/I18nContext';

export default function TestsListClient() {
  const { t } = useI18n();

  const STATUS_LABEL: Record<TestStatusDTO, { label: string; color: string }> = {
    draft: { label: t('teacher.testStatusDraft'), color: 'bg-muted text-muted-foreground' },
    published: { label: t('teacher.testStatusPublished'), color: 'bg-success/10 text-success' },
    archived: { label: t('teacher.testStatusArchived'), color: 'bg-warning/10 text-warning' },
  };
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<TestStatusDTO | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TestListItemDTO | null>(null);

  const { data, isLoading, error } = useTeacherTests({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];

  const createMut = useCreateTestMutation();
  const deleteMut = useDeleteTestMutation();

  const tests = data?.tests ?? [];

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteMut.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(t('teacher.testDeleted'));
        setPendingDelete(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/teacher-dashboard"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            {t('nav.dashboard')}
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-foreground">{t('teacher.tests')}</h1>
          <p className="text-sm text-muted-foreground">
            {tests.length} {t('teacher.testCount')} · {tests.reduce((s, t) => s + t.attemptCount, 0)} {t('teacher.attempts')}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={16} />
          {t('teacher.newTest')}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(['all', 'draft', 'published', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? t('common.all') : STATUS_LABEL[s].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-muted rounded-md" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">{t('teacher.noTests')}</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-primary hover:underline text-sm"
          >
            {t('teacher.createFirstTest')}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {tests.map((t) => (
            <Link
              key={t.id}
              href={`/teacher-dashboard/tests/${t.id}`}
              className="bg-card border border-border rounded-md p-4 hover:shadow-warm-md transition-smooth"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-foreground">{t.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        STATUS_LABEL[t.status as TestStatusDTO].color
                      }`}
                    >
                      {STATUS_LABEL[t.status as TestStatusDTO].label}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Icon name="QuestionMarkCircleIcon" size={12} />
                      {t.questionCount} {t('teacher.questions')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="StarIcon" size={12} />
                      {t.totalPoints} {t('teacher.points')}
                    </span>
                    {t.timeLimitSec && (
                      <span className="flex items-center gap-1">
                        <Icon name="ClockIcon" size={12} />
                        {Math.floor(t.timeLimitSec / 60)} {t('teacher.minutes')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Icon name="UserGroupIcon" size={12} />
                      {t.attemptCount} {t('teacher.attempts')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="CheckCircleIcon" size={12} />
                      {t.passingScore}% {t('teacher.passing')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setPendingDelete(t);
                  }}
                  className="p-2 hover:bg-destructive/10 rounded-md"
                  aria-label={t('common.delete')}
                >
                  <Icon name="TrashIcon" size={14} className="text-destructive" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateTestModal
          courses={courses}
          isLoading={createMut.isPending}
          onCreate={(input) =>
            createMut.mutate(input, {
              onSuccess: ({ test }) => {
                toast.success(t('teacher.testCreated'));
                router.push(`/teacher-dashboard/tests/${test.id}`);
              },
              onError: (err) => toast.error(err.message),
            })
          }
          onClose={() => setCreateOpen(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          open={true}
          title={t('teacher.deleteTest')}
          message={`"${pendingDelete.title}" ${t('teacher.deleteTestConfirm')}`}
          confirmLabel={t('common.delete')}
          variant="danger"
          isLoading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => !deleteMut.isPending && setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function CreateTestModal({
  courses,
  isLoading,
  onCreate,
  onClose,
}: {
  courses: Array<{ id: string; title: string }>;
  isLoading: boolean;
  onCreate: (input: {
    courseId: string;
    title: string;
    description?: string;
    passingScore?: number;
    timeLimitSec?: number | null;
    allowedAttempts?: number;
  }) => void;
  onClose: () => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimitMin, setTimeLimitMin] = useState<number | ''>('');
  const [allowedAttempts, setAllowedAttempts] = useState(3);
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      toast.error(t('teacher.selectCourse'));
      return;
    }
    if (title.trim().length < 2) {
      toast.error(t('teacher.titleMinLength'));
      return;
    }
    onCreate({
      courseId,
      title: title.trim(),
      description: description.trim() || undefined,
      passingScore,
      timeLimitSec:
        typeof timeLimitMin === 'number' && timeLimitMin > 0
          ? timeLimitMin * 60
          : null,
      allowedAttempts,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">{t('teacher.newTest')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
            aria-label={t('common.close')}
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('teacher.course')} *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              required
            >
              <option value="">— {t('teacher.select')} —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('teacher.title')} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t('teacher.testTitlePlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('teacher.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('teacher.passingPercent')}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('teacher.timeMinutes')}
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={timeLimitMin}
                onChange={(e) =>
                  setTimeLimitMin(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder={t('teacher.unlimited')}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('teacher.attempts')}
              </label>
              <input
                type="number"
                min={0}
                max={20}
                value={allowedAttempts}
                onChange={(e) => setAllowedAttempts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('teacher.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
