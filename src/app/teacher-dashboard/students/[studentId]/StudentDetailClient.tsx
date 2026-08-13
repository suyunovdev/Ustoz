'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useStudentDetail,
  type StudentEnrollmentDTO,
} from '@/hooks/queries/useTeacherStudents';
import {
  useToggleEnrollmentMutation,
  useRemoveEnrollmentMutation,
  useNotifyStudentMutation,
} from '@/hooks/mutations/useTeacherStudentMutations';
import { useStartConversationMutation } from '@/hooks/mutations/useConversationMutations';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate, formatCurrency } from '@/lib/i18n/format';
import { type Locale } from '@/lib/i18n';

interface Props {
  studentId: string;
}

function formatUzs(s: string, locale: Locale): string {
  return formatCurrency(Number(s), locale, 'UZS');
}

export default function StudentDetailClient({ studentId }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { data, isLoading, error } = useStudentDetail(studentId);
  const toggle = useToggleEnrollmentMutation(studentId);
  const remove = useRemoveEnrollmentMutation(studentId);
  const notify = useNotifyStudentMutation();
  const startConv = useStartConversationMutation();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<StudentEnrollmentDTO | null>(null);

  const handleStartChat = () => {
    startConv.mutate(
      { studentId },
      {
        onSuccess: ({ conversation }) => {
          router.push(`/messages?c=${conversation.id}`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (isLoading) return <div className="p-8">{t('common.loading')}</div>;
  if (error || !data)
    return <div className="p-8 text-destructive">{(error as Error)?.message || t('teacher.errorPrefix')}</div>;

  const s = data.student;
  const testPassRate =
    s.totalTestAttempts > 0
      ? Math.round((s.passedTestAttempts / s.totalTestAttempts) * 100)
      : 0;
  const assignmentGradeRate =
    s.totalAssignmentSubmissions > 0
      ? Math.round((s.gradedAssignmentSubmissions / s.totalAssignmentSubmissions) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link
        href="/teacher-dashboard/students"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        {t('teacher.studentsTitle')}
      </Link>

      <div className="bg-card border border-border rounded-md p-6 mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {s.avatarUrl ? (
            <AppImage
              src={s.avatarUrl}
              alt={s.fullName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-medium">
              {s.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-heading font-semibold">{s.fullName}</h1>
            <p className="text-sm text-muted-foreground">{s.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('teacher.registeredOn')}: {formatDate(s.createdAt, locale)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleStartChat}
            disabled={startConv.isPending}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="ChatBubbleOvalLeftIcon" size={14} />
            {t('teacher.chat')}
          </button>
          <button
            onClick={() => setNotifyOpen(true)}
            className="px-3 py-2 border border-border rounded-md hover:bg-muted text-sm flex items-center gap-2"
          >
            <Icon name="BellIcon" size={14} />
            {t('teacher.notification')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label={t('teacher.studentsCoursesLabel')}
          value={`${s.enrollments.filter((e) => e.isActive).length} / ${s.enrollments.length}`}
          subValue={`${s.enrollments.filter((e) => e.completedAt).length} ${t('teacher.completedSuffix')}`}
          icon="BookOpenIcon"
        />
        <StatCard
          label={t('teacher.tests')}
          value={`${s.totalTestAttempts} ${t('teacher.countUnit')}`.trim()}
          subValue={`${testPassRate}% ${t('teacher.passedSuffix')}`}
          icon="AcademicCapIcon"
        />
        <StatCard
          label={t('teacher.assignments')}
          value={`${s.totalAssignmentSubmissions} ${t('teacher.countUnit')}`.trim()}
          subValue={`${assignmentGradeRate}% ${t('teacher.graded')}`}
          icon="ClipboardDocumentListIcon"
        />
        <StatCard
          label={t('teacher.certificates')}
          value={`${s.totalCertificates} ${t('teacher.countUnit')}`.trim()}
          subValue={formatUzs(s.totalPaymentsUzs, locale)}
          icon="TrophyIcon"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <SmallStat label={t('teacher.topicsCompleted')} value={s.totalTopicCompletions} />
        <SmallStat
          label={t('teacher.avgTest')}
          value={s.avgTestScore !== null ? `${s.avgTestScore}%` : '—'}
        />
        <SmallStat
          label={t('teacher.avgAssignment')}
          value={s.avgAssignmentGrade !== null ? `${s.avgAssignmentGrade}` : '—'}
        />
      </div>

      <h2 className="text-lg font-medium mb-3">{t('teacher.enrolledCourses')} ({s.enrollments.length})</h2>
      <div className="space-y-2">
        {s.enrollments.map((e) => (
          <div
            key={e.enrollmentId}
            className="bg-card border border-border rounded-md p-4"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="font-medium text-foreground">{e.courseTitle}</h3>
                {!e.isActive && (
                  <span className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                    {t('teacher.blocked')}
                  </span>
                )}
                {e.completedAt && (
                  <span className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded-full">
                    ✓ {t('teacher.completed')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    toggle.mutate(
                      { enrollmentId: e.enrollmentId, isActive: !e.isActive },
                      {
                        onSuccess: () =>
                          toast.success(e.isActive ? t('teacher.blocked') : t('teacher.groupDetailActivated')),
                        onError: (err) => toast.error(err.message),
                      },
                    )
                  }
                  disabled={toggle.isPending}
                  className={`px-2 py-1 rounded text-xs ${
                    e.isActive
                      ? 'bg-warning/10 text-warning hover:bg-warning/20'
                      : 'bg-success/10 text-success hover:bg-success/20'
                  } disabled:opacity-50`}
                >
                  {e.isActive ? t('teacher.block') : t('teacher.unblock')}
                </button>
                <button
                  onClick={() => setPendingRemove(e)}
                  className="p-1.5 hover:bg-destructive/10 rounded text-destructive"
                  aria-label={t('teacher.menuDelete')}
                >
                  <Icon name="TrashIcon" size={12} />
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span>{t('teacher.studentsProgressLabel')}:</span>
                <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${e.progress}%` }}
                  />
                </div>
                <span className="font-medium text-foreground">{e.progress}%</span>
              </div>
              <p>
                {t('teacher.enrolledLabel')}: {formatDate(e.enrolledAt, locale)} ·{' '}
                {t('teacher.lastLabel')}: {e.lastAccessedAt
                  ? formatDate(e.lastAccessedAt, locale)
                  : t('teacher.studentsNever')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {notifyOpen && (
        <NotifyModal
          studentName={s.fullName}
          courses={s.enrollments.map((e) => ({ id: e.courseId, title: e.courseTitle }))}
          isLoading={notify.isPending}
          onSubmit={(input) =>
            notify.mutate(
              { studentId, ...input },
              {
                onSuccess: () => {
                  toast.success(t('teacher.messageSent'));
                  setNotifyOpen(false);
                },
                onError: (err) => toast.error(err.message),
              },
            )
          }
          onClose={() => setNotifyOpen(false)}
        />
      )}

      {pendingRemove && (
        <ConfirmModal
          open={true}
          title={t('teacher.removeStudentTitle')}
          message={t('teacher.removeStudentMessage', { name: s.fullName, course: pendingRemove.courseTitle })}
          confirmLabel={t('teacher.groupDetailRemoveBtn')}
          variant="danger"
          isLoading={remove.isPending}
          onConfirm={() => {
            remove.mutate(pendingRemove.enrollmentId, {
              onSuccess: () => {
                toast.success(t('teacher.groupDetailRemoved'));
                setPendingRemove(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          onCancel={() => !remove.isPending && setPendingRemove(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon,
}: {
  label: string;
  value: string;
  subValue: string;
  icon: string;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-4">
      <Icon name={icon} size={20} className="text-primary mb-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-medium text-foreground">{value}</p>
    </div>
  );
}

function NotifyModal({
  studentName,
  courses,
  isLoading,
  onSubmit,
  onClose,
}: {
  studentName: string;
  courses: Array<{ id: string; title: string }>;
  isLoading: boolean;
  onSubmit: (input: { title: string; message: string; courseId?: string | null }) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [courseId, setCourseId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return toast.error(t('teacher.broadcastTitleMinLength'));
    if (message.trim().length < 2) return toast.error(t('teacher.broadcastMessageMinLength'));
    onSubmit({
      title: title.trim(),
      message: message.trim(),
      courseId: courseId || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">
            {t('teacher.messageToStudent', { name: studentName })}
          </h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.broadcastTitleLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.broadcastMessageLabel')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('teacher.relatedCourseLabel')}
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              <option value="">{t('teacher.generalOption')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            {t('teacher.gradeModalCancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('teacher.broadcastSend')}
          </button>
        </div>
      </form>
    </div>
  );
}
