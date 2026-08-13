'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useAssignmentForStudent,
  useMyAssignmentSubmission,
  type SubmissionStatusDTO,
} from '@/hooks/queries/useAssignments';
import { useSubmitAssignmentMutation } from '@/hooks/mutations/useAssignmentMutations';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/i18n/format';

const STATUS_LABEL: Record<SubmissionStatusDTO, { labelKey: string; color: string }> = {
  submitted: { labelKey: 'assignments.statusSubmitted', color: 'bg-primary/10 text-primary' },
  graded: { labelKey: 'assignments.gradedStatus', color: 'bg-success/10 text-success' },
  returned: { labelKey: 'assignments.statusReturned', color: 'bg-warning/10 text-warning' },
  late: { labelKey: 'assignments.statusLate', color: 'bg-destructive/10 text-destructive' },
};

interface Props {
  assignmentId: string;
}

export default function StudentAssignmentClient({ assignmentId }: Props) {
  const assignment = useAssignmentForStudent(assignmentId);
  const mySub = useMyAssignmentSubmission(assignmentId);
  const submitMut = useSubmitAssignmentMutation(assignmentId);

  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [attachments, setAttachments] = useState<Array<{ fileUrl: string; fileName?: string }>>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [now, setNow] = useState(Date.now());

  const { t, locale } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Mavjud submission'dan formni to'ldirish
  useEffect(() => {
    const sub = mySub.data?.submission;
    if (sub) {
      setText(sub.submissionText ?? '');
      setUrl(sub.submissionUrl ?? '');
      setAttachments(
        Array.isArray(sub.attachments)
          ? sub.attachments.map((a) => ({ fileUrl: a.fileUrl, fileName: a.fileName }))
          : [],
      );
    }
  }, [mySub.data?.submission?.id]);

  if (assignment.isLoading || mySub.isLoading) {
    return <div className="p-8">{t('common.loading')}</div>;
  }
  if (assignment.error || !assignment.data) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <p className="text-destructive">{(assignment.error as Error)?.message || t('assignments.errGeneric')}</p>
      </div>
    );
  }

  const a = assignment.data.assignment;
  const sub = mySub.data?.submission ?? null;
  const due = new Date(a.dueDate);
  const remainingMs = due.getTime() - now;
  const isOverdue = remainingMs < 0;
  const canSubmit = !isOverdue || a.allowLateSubmission;

  const fmt = (ms: number) => {
    const abs = Math.abs(ms);
    const days = Math.floor(abs / 86_400_000);
    const hours = Math.floor((abs % 86_400_000) / 3_600_000);
    const mins = Math.floor((abs % 3_600_000) / 60_000);
    if (days > 0) return `${days} ${t('assignments.unitDay')} ${hours} ${t('assignments.unitHour')}`;
    if (hours > 0) return `${hours} ${t('assignments.unitHour')} ${mins} ${t('assignments.unitMin')}`;
    return `${mins} ${t('assignments.unitMin')}`;
  };

  const addAttachment = () => {
    if (!attachmentUrl.trim()) return;
    try {
      new URL(attachmentUrl);
    } catch {
      toast.error(t('assignments.toastInvalidUrl'));
      return;
    }
    setAttachments((arr) => [
      ...arr,
      { fileUrl: attachmentUrl.trim(), fileName: attachmentName.trim() || undefined },
    ]);
    setAttachmentUrl('');
    setAttachmentName('');
  };

  const handleSubmit = () => {
    if (!text.trim() && !url.trim() && attachments.length === 0) {
      toast.error(t('assignments.toastAtLeastOne'));
      return;
    }
    submitMut.mutate(
      {
        submissionText: text.trim() || undefined,
        submissionUrl: url.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: () => {
          toast.success(sub ? t('assignments.toastUpdated') : t('assignments.toastSubmitted'));
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const showText = a.submissionType === 'text' || a.submissionType === 'any';
  const showUrl = a.submissionType === 'url' || a.submissionType === 'any';
  const showFiles = a.submissionType === 'file' || a.submissionType === 'any';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/student-dashboard"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        Dashboard
      </Link>

      <div className="bg-card border border-border rounded-md p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-heading font-semibold">{a.title}</h1>
            <p className="text-sm text-muted-foreground">{a.courseTitle}</p>
          </div>
          {sub && (
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                STATUS_LABEL[sub.status as SubmissionStatusDTO].color
              }`}
            >
              {t(STATUS_LABEL[sub.status as SubmissionStatusDTO].labelKey)}
            </span>
          )}
        </div>

        {a.description && (
          <p className="text-sm text-foreground mb-3">{a.description}</p>
        )}

        {a.instructions && (
          <details open className="mb-3">
            <summary className="text-sm font-medium text-foreground cursor-pointer hover:text-primary">
              📋 {t('assignments.instructions')}
            </summary>
            <pre className="mt-2 p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap font-mono">
              {a.instructions}
            </pre>
          </details>
        )}

        <div className="flex items-center gap-4 text-xs flex-wrap pt-3 border-t border-border">
          <div>
            <p className="text-muted-foreground">{t('assignments.dueDate')}</p>
            <p
              className={`font-medium ${
                isOverdue ? 'text-destructive' : remainingMs < 86400_000 ? 'text-warning' : 'text-foreground'
              }`}
            >
              {formatDateTime(due, locale, {})}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{isOverdue ? t('assignments.overdueLabel') : t('assignments.remainingLabel')}</p>
            <p
              className={`font-medium ${
                isOverdue ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {fmt(remainingMs)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('assignments.maxScoreShort')}</p>
            <p className="font-medium text-foreground">{a.maxScore}</p>
          </div>
          {a.allowLateSubmission && (
            <div>
              <p className="text-muted-foreground">{t('assignments.latePenalty')}</p>
              <p className="font-medium text-warning">-{a.latePenaltyPercent}%</p>
            </div>
          )}
        </div>
      </div>

      {sub && (sub.status === 'graded' || sub.status === 'returned') && (
        <div
          className={`p-4 rounded-md mb-4 ${
            sub.status === 'graded' ? 'bg-success/10' : 'bg-warning/10'
          }`}
        >
          {sub.status === 'graded' && sub.grade !== null && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground">{t('assignments.yourScore')}</p>
              <p className="text-3xl font-bold text-success">
                {sub.grade} / {a.maxScore}
              </p>
            </div>
          )}
          {sub.feedback && (
            <div>
              <p className="text-xs text-muted-foreground">{t('assignments.teacherFeedback')}</p>
              <p className="text-sm text-foreground mt-1">{sub.feedback}</p>
            </div>
          )}
        </div>
      )}

      {!canSubmit && !sub && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">
          ⚠ {t('assignments.lateNotAllowed')}
        </div>
      )}

      {(canSubmit || sub) && sub?.status !== 'graded' && (
        <div className="bg-card border border-border rounded-md p-6">
          <h2 className="text-lg font-medium mb-3">
            {sub ? t('assignments.updateSubmission') : t('assignments.submit')}
          </h2>

          {showText && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">{t('assignments.textAnswer')}</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder={t('assignments.textAnswerPlaceholder')}
                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
              />
            </div>
          )}

          {showUrl && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">{t('assignments.urlLabel')}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          )}

          {showFiles && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">{t('assignments.filesWithUrl')}</label>
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm"
                  >
                    <Icon name="PaperClipIcon" size={12} />
                    <span className="flex-1 truncate">
                      {att.fileName || att.fileUrl}
                    </span>
                    <button
                      onClick={() => setAttachments((arr) => arr.filter((_, idx) => idx !== i))}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Icon name="XMarkIcon" size={12} className="text-destructive" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/…"
                    className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder={t('assignments.namePlaceholder')}
                    className="w-40 px-3 py-1.5 border border-border rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={addAttachment}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs"
                  >
                    {t('assignments.add')}
                  </button>
                </div>
                {a.fileRequirements && (
                  <p className="text-xs text-muted-foreground">
                    📝 {t('assignments.requirementLabel')}: {a.fileRequirements}
                  </p>
                )}
              </div>
            </div>
          )}

          {isOverdue && a.allowLateSubmission && (
            <div className="mb-3 p-3 bg-warning/10 text-warning text-sm rounded-md">
              ⚠ {t('assignments.lateWarning')}
              {a.latePenaltyPercent > 0 && ` ${t('assignments.latePenaltyDeduct', { percent: a.latePenaltyPercent })}`}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitMut.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitMut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {sub ? t('assignments.update') : t('assignments.submit')}
          </button>
        </div>
      )}
    </div>
  );
}
