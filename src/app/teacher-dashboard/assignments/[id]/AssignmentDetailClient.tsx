'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherAssignment,
  useAssignmentSubmissions,
  type SubmissionDTO,
  type SubmissionStatusDTO,
} from '@/hooks/queries/useAssignments';
import {
  useUpdateAssignmentMutation,
  useGradeSubmissionMutation,
  useReturnSubmissionMutation,
} from '@/hooks/mutations/useAssignmentMutations';
import { useI18n } from '@/contexts/I18nContext';

const STATUS_LABEL_KEYS: Record<SubmissionStatusDTO, { labelKey: string; color: string }> = {
  submitted: { labelKey: 'teacher.submissionStatusSubmitted', color: 'bg-primary/10 text-primary' },
  graded: { labelKey: 'teacher.submissionStatusGraded', color: 'bg-success/10 text-success' },
  returned: { labelKey: 'teacher.submissionStatusReturned', color: 'bg-warning/10 text-warning' },
  late: { labelKey: 'teacher.submissionStatusLate', color: 'bg-destructive/10 text-destructive' },
};

interface Props {
  assignmentId: string;
}

export default function AssignmentDetailClient({ assignmentId }: Props) {
  const { t } = useI18n();
  const { data, isLoading } = useTeacherAssignment(assignmentId);
  const updateMut = useUpdateAssignmentMutation(assignmentId);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusDTO | 'all'>('all');
  const subs = useAssignmentSubmissions(
    assignmentId,
    statusFilter === 'all' ? undefined : statusFilter,
  );
  const [grading, setGrading] = useState<SubmissionDTO | null>(null);

  if (isLoading || !data) return <div className="p-8">{t('common.loading')}</div>;

  const a = data.assignment;
  const isPublished = a.status === 'published';
  const due = new Date(a.dueDate);
  const overdue = due < new Date();

  const handlePublishToggle = () => {
    updateMut.mutate(
      { status: isPublished ? 'draft' : 'published' },
      {
        onSuccess: () =>
          toast.success(
            isPublished ? t('teacher.assignmentDetailUnpublished') : t('teacher.assignmentDetailPublished'),
          ),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const submissions = subs.data?.submissions ?? [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <Link
            href="/teacher-dashboard/assignments"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            {t('teacher.assignmentDetailBack')}
          </Link>
          <h1 className="text-2xl font-heading font-semibold">{a.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{a.courseTitle}</p>
          {a.description && (
            <p className="text-sm text-foreground mt-2">{a.description}</p>
          )}
          {a.instructions && (
            <details className="mt-2">
              <summary className="text-xs text-primary cursor-pointer hover:underline">
                {t('teacher.assignmentDetailShowInstructions')}
              </summary>
              <pre className="mt-2 p-3 bg-muted/30 rounded-md text-xs whitespace-pre-wrap font-mono">
                {a.instructions}
              </pre>
            </details>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
            <span className={overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              ⏰ {due.toLocaleString('uz-UZ')}
            </span>
            <span className="text-muted-foreground">⭐ {a.maxScore} {t('teacher.assignmentsScore')}</span>
            <span className="text-muted-foreground">
              📩 {a.submissionType === 'any' ? t('teacher.assignmentDetailAnyType') : a.submissionType}
            </span>
            {a.allowLateSubmission && (
              <span className="text-warning">
                ⏳ {t('teacher.assignmentDetailLateAllowed')}, -{a.latePenaltyPercent}%
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handlePublishToggle}
          disabled={updateMut.isPending}
          className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${
            isPublished
              ? 'bg-warning text-warning-foreground'
              : 'bg-success text-success-foreground'
          }`}
        >
          <Icon name={isPublished ? 'EyeSlashIcon' : 'EyeIcon'} size={14} />
          {isPublished ? t('teacher.assignmentDetailUnpublish') : t('teacher.assignmentDetailPublish')}
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">{t('teacher.assignmentDetailSubmissions')} ({submissions.length})</h2>
        <div className="flex items-center gap-2">
          {(['all', 'submitted', 'graded', 'returned', 'late'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s === 'all' ? t('teacher.submissionFilterAll') : t(STATUS_LABEL_KEYS[s].labelKey)}
            </button>
          ))}
        </div>
      </div>

      {subs.isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : submissions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 italic bg-muted/30 rounded-md">
          {t('teacher.submissionNoSubmissions')}
        </p>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="bg-card border border-border rounded-md p-4 hover:shadow-warm-md"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-foreground">{s.studentName}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        STATUS_LABEL_KEYS[s.status].color
                      }`}
                    >
                      {t(STATUS_LABEL_KEYS[s.status].labelKey)}
                    </span>
                    {s.isLate && (
                      <span className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                        {t('teacher.submissionLateLabel')}
                      </span>
                    )}
                    {s.revisionNumber > 1 && (
                      <span className="text-[10px] px-2 py-0.5 bg-warning/10 text-warning rounded-full">
                        v{s.revisionNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.submittedAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.grade !== null && (
                    <span className="text-lg font-bold text-success">
                      {s.grade}/{a.maxScore}
                    </span>
                  )}
                  <button
                    onClick={() => setGrading(s)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90"
                  >
                    {s.status === 'graded' ? t('teacher.submissionRegradeBtn') : t('teacher.submissionGradeBtn')}
                  </button>
                </div>
              </div>

              {s.submissionText && (
                <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap">
                  {s.submissionText}
                </div>
              )}
              {s.submissionUrl && (
                <a
                  href={s.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Icon name="LinkIcon" size={12} />
                  {s.submissionUrl}
                </a>
              )}
              {Array.isArray(s.attachments) && s.attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {s.attachments.map((att, i) => (
                    <li key={i} className="text-xs">
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Icon name="PaperClipIcon" size={10} />
                        {att.fileName || att.fileUrl}
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {s.feedback && (
                <div className="mt-2 p-2 bg-warning/10 text-warning text-xs rounded-md">
                  <strong>💬 {t('teacher.submissionFeedbackLabel')}:</strong> {s.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {grading && (
        <GradeModal
          submission={grading}
          maxScore={a.maxScore}
          assignmentId={assignmentId}
          allowLate={a.allowLateSubmission}
          onClose={() => setGrading(null)}
        />
      )}
    </div>
  );
}

function GradeModal({
  submission,
  maxScore,
  assignmentId,
  allowLate,
  onClose,
}: {
  submission: SubmissionDTO;
  maxScore: number;
  assignmentId: string;
  allowLate: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const gradeMut = useGradeSubmissionMutation(assignmentId);
  const returnMut = useReturnSubmissionMutation(assignmentId);
  const [grade, setGrade] = useState(submission.grade ?? Math.floor(maxScore * 0.8));
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [applyPenalty, setApplyPenalty] = useState(submission.isLate);

  const handleGrade = () => {
    gradeMut.mutate(
      { submissionId: submission.id, input: { grade, feedback, applyLatePenalty: applyPenalty } },
      {
        onSuccess: () => {
          toast.success(t('teacher.gradeModalGraded'));
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleReturn = () => {
    if (feedback.trim().length < 5) {
      toast.error(t('teacher.gradeModalFeedbackMinLength'));
      return;
    }
    returnMut.mutate(
      { submissionId: submission.id, feedback: feedback.trim() },
      {
        onSuccess: () => {
          toast.success(t('teacher.gradeModalReturned'));
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const isLoading = gradeMut.isPending || returnMut.isPending;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">{t('teacher.gradeModalTitle')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {submission.studentName}
          {submission.isLate && (
            <span className="ml-2 text-xs text-destructive">⚠ {t('teacher.gradeModalLateWarning')}</span>
          )}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('teacher.gradeModalScoreLabel')} (0–{maxScore}) *
            </label>
            <input
              type="number"
              min={0}
              max={maxScore}
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          {submission.isLate && allowLate && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={applyPenalty}
                onChange={(e) => setApplyPenalty(e.target.checked)}
              />
              {t('teacher.gradeModalApplyPenalty')}
            </label>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('teacher.gradeModalFeedbackLabel')}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={t('teacher.gradeModalFeedbackPlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-border">
          <button
            onClick={handleReturn}
            disabled={isLoading}
            className="px-3 py-2 bg-warning text-warning-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="ArrowUturnLeftIcon" size={14} />
            {t('teacher.gradeModalReturn')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
            >
              {t('teacher.gradeModalCancel')}
            </button>
            <button
              onClick={handleGrade}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {gradeMut.isPending && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {t('teacher.gradeModalSave')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
