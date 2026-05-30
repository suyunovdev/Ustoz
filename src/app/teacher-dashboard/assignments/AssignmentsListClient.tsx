'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherAssignments,
  type AssignmentListItemDTO,
  type AssignmentStatusDTO,
  type SubmissionTypeDTO,
} from '@/hooks/queries/useAssignments';
import {
  useCreateAssignmentMutation,
  useDeleteAssignmentMutation,
} from '@/hooks/mutations/useAssignmentMutations';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';

const STATUS_LABEL: Record<AssignmentStatusDTO, { label: string; color: string }> = {
  draft: { label: 'Qoralama', color: 'bg-muted text-muted-foreground' },
  published: { label: "E'lon", color: 'bg-success/10 text-success' },
  archived: { label: 'Arxiv', color: 'bg-warning/10 text-warning' },
};

const TYPE_LABEL: Record<SubmissionTypeDTO, string> = {
  text: '📝 Matn',
  file: '📎 Fayl',
  url: '🔗 URL',
  any: '↕ Har qanday',
};

export default function AssignmentsListClient() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<AssignmentStatusDTO | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AssignmentListItemDTO | null>(null);

  const { data, isLoading, error } = useTeacherAssignments({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];

  const createMut = useCreateAssignmentMutation();
  const deleteMut = useDeleteAssignmentMutation();

  const assignments = data?.assignments ?? [];

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
          <h1 className="text-2xl font-heading font-semibold text-foreground">Vazifalar</h1>
          <p className="text-sm text-muted-foreground">
            {assignments.length} ta vazifa ·{' '}
            {assignments.reduce((s, a) => s + a.submissionCount, 0)} topshiriq
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={16} />
          Yangi vazifa
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(['all', 'draft', 'published', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
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
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon
            name="ClipboardDocumentListIcon"
            size={48}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground mb-3">Hali vazifa yo'q</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-primary hover:underline text-sm"
          >
            Birinchi vazifani yarating →
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {assignments.map((a) => {
            const due = new Date(a.dueDate);
            const overdue = due < new Date();
            const ungraded = a.submissionCount - a.gradedCount;
            return (
              <Link
                key={a.id}
                href={`/teacher-dashboard/assignments/${a.id}`}
                className="bg-card border border-border rounded-md p-4 hover:shadow-warm-md transition-smooth"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-foreground">{a.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          STATUS_LABEL[a.status].color
                        }`}
                      >
                        {STATUS_LABEL[a.status].label}
                      </span>
                      {ungraded > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-warning/10 text-warning rounded-full">
                          {ungraded} baholanmagan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{a.courseTitle}</p>
                    {a.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {a.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span
                        className={overdue ? 'text-destructive font-medium' : ''}
                      >
                        ⏰ {due.toLocaleDateString('uz-UZ')}{' '}
                        {due.toLocaleTimeString('uz-UZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>⭐ {a.maxScore} bal</span>
                      <span>{TYPE_LABEL[a.submissionType]}</span>
                      <span>
                        📥 {a.submissionCount} / ✓ {a.gradedCount}
                      </span>
                      {a.allowLateSubmission && (
                        <span className="text-warning">
                          ⏳ Kech: -{a.latePenaltyPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setPendingDelete(a);
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-md"
                    aria-label="O'chirish"
                  >
                    <Icon name="TrashIcon" size={14} className="text-destructive" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateAssignmentModal
          courses={courses}
          isLoading={createMut.isPending}
          onCreate={(input) =>
            createMut.mutate(input, {
              onSuccess: ({ assignment }) => {
                toast.success("Vazifa yaratildi");
                router.push(`/teacher-dashboard/assignments/${assignment.id}`);
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
          title="Vazifani o'chirish"
          message={`"${pendingDelete.title}" va barcha topshiriqlar o'chiriladi.`}
          confirmLabel="O'chirish"
          variant="danger"
          isLoading={deleteMut.isPending}
          onConfirm={() => {
            deleteMut.mutate(pendingDelete.id, {
              onSuccess: () => {
                toast.success("Vazifa o'chirildi");
                setPendingDelete(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          onCancel={() => !deleteMut.isPending && setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function CreateAssignmentModal({
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
    instructions?: string;
    dueDate: string;
    maxScore?: number;
    submissionType?: SubmissionTypeDTO;
    allowLateSubmission?: boolean;
    latePenaltyPercent?: number;
  }) => void;
  onClose: () => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [maxScore, setMaxScore] = useState(100);
  const [submissionType, setSubmissionType] = useState<SubmissionTypeDTO>('any');
  const [allowLate, setAllowLate] = useState(false);
  const [latePenalty, setLatePenalty] = useState(20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return toast.error("Kurs tanlang");
    if (title.trim().length < 2) return toast.error("Sarlavha kamida 2 belgi");
    if (!dueDate) return toast.error("Muddat majburiy");
    onCreate({
      courseId,
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      dueDate: new Date(dueDate).toISOString(),
      maxScore,
      submissionType,
      allowLateSubmission: allowLate,
      latePenaltyPercent: allowLate ? latePenalty : 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-lg w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold">Yangi vazifa</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kurs *</label>
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
            <label className="block text-sm font-medium mb-1">Sarlavha *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="React Hooks vazifasi"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Qisqa tavsif</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Batafsil yo'riqnoma (markdown)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Vazifa qadamlari, kutilayotgan natija, baholash mezonlari…"
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Muddat *</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max bal</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topshirish turi</label>
            <div className="grid grid-cols-4 gap-2">
              {(['text', 'file', 'url', 'any'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSubmissionType(t)}
                  className={`p-2 rounded-md border text-xs ${
                    submissionType === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowLate}
                onChange={(e) => setAllowLate(e.target.checked)}
              />
              Kechikkan topshiriqlarga ruxsat
            </label>
            {allowLate && (
              <div className="mt-2 ml-6">
                <label className="block text-xs text-muted-foreground mb-1">
                  Penalty (%) — kechikkan ish balidan ayriladi
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 border border-border rounded-md text-sm"
                />
              </div>
            )}
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
