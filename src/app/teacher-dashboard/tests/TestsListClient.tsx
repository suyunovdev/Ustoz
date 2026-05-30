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

const STATUS_LABEL: Record<TestStatusDTO, { label: string; color: string }> = {
  draft: { label: 'Qoralama', color: 'bg-muted text-muted-foreground' },
  published: { label: "E'lon qilingan", color: 'bg-success/10 text-success' },
  archived: { label: 'Arxiv', color: 'bg-warning/10 text-warning' },
};

export default function TestsListClient() {
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
        toast.success("Test o'chirildi");
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
            Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-foreground">Testlar</h1>
          <p className="text-sm text-muted-foreground">
            {tests.length} ta test · {tests.reduce((s, t) => s + t.attemptCount, 0)} urinish
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={16} />
          Yangi test
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
            {s === 'all' ? 'Hammasi' : STATUS_LABEL[s].label}
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
          <p className="text-muted-foreground mb-3">Hali test yo'q</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-primary hover:underline text-sm"
          >
            Birinchi testni yarating →
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
                      {t.questionCount} savol
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="StarIcon" size={12} />
                      {t.totalPoints} bal
                    </span>
                    {t.timeLimitSec && (
                      <span className="flex items-center gap-1">
                        <Icon name="ClockIcon" size={12} />
                        {Math.floor(t.timeLimitSec / 60)} daq
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Icon name="UserGroupIcon" size={12} />
                      {t.attemptCount} urinish
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="CheckCircleIcon" size={12} />
                      {t.passingScore}% o'tish
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setPendingDelete(t);
                  }}
                  className="p-2 hover:bg-destructive/10 rounded-md"
                  aria-label="O'chirish"
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
                toast.success("Test yaratildi — endi savol qo'shing");
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
          title="Testni o'chirish"
          message={`"${pendingDelete.title}" va barcha savol/urinishlar o'chiriladi.`}
          confirmLabel="O'chirish"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      toast.error("Kurs tanlang");
      return;
    }
    if (title.trim().length < 2) {
      toast.error("Sarlavha kamida 2 belgi");
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
          <h3 className="text-lg font-heading font-semibold text-foreground">Yangi test</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
            aria-label="Yopish"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kurs *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              required
            >
              <option value="">— tanlang —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sarlavha *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Masalan: JavaScript asoslari testi"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tavsif</label>
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
                O'tish %
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
                Vaqt (daq)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={timeLimitMin}
                onChange={(e) =>
                  setTimeLimitMin(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="cheklanmagan"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Urinish
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
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            Yaratish
          </button>
        </div>
      </form>
    </div>
  );
}
