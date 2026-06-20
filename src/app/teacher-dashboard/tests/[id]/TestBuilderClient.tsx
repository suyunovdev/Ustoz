'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherTest,
  useTeacherTestAttempts,
  type QuestionDTO,
  type QuestionTypeDTO,
  type QuestionOptionDTO,
} from '@/hooks/queries/useTeacherTests';
import {
  useUpdateTestMutation,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from '@/hooks/mutations/useTestMutations';
import { useI18n } from '@/contexts/I18nContext';

interface Props {
  testId: string;
}

export default function TestBuilderClient({ testId }: Props) {
  const { t } = useI18n();

  const TYPE_LABEL: Record<QuestionTypeDTO, { label: string; icon: string }> = {
    single: { label: t('teacher.singleChoice'), icon: 'CheckCircleIcon' },
    multiple: { label: t('teacher.multipleChoice'), icon: 'CheckBadgeIcon' },
    true_false: { label: t('teacher.trueFalse'), icon: 'CheckIcon' },
    text: { label: t('teacher.textAnswer'), icon: 'PencilSquareIcon' },
  };

  const { data, isLoading, error } = useTeacherTest(testId);
  const updateTest = useUpdateTestMutation(testId);
  const addQuestion = useAddQuestionMutation(testId);
  const updateQuestion = useUpdateQuestionMutation(testId);
  const deleteQuestion = useDeleteQuestionMutation(testId);

  const [showAttempts, setShowAttempts] = useState(false);
  const [editing, setEditing] = useState<QuestionDTO | null>(null);
  const [adderOpen, setAdderOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<QuestionDTO | null>(null);

  const attempts = useTeacherTestAttempts(testId, showAttempts);

  if (isLoading) return <div className="p-8">{t('common.loading')}</div>;
  if (error || !data)
    return <div className="p-8 text-destructive">{(error as Error)?.message || t('common.error')}</div>;

  const test = data.test;
  const isPublished = test.status === 'published';

  const handlePublishToggle = () => {
    const newStatus = isPublished ? 'draft' : 'published';
    updateTest.mutate(
      { status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'published' ? t('teacher.testPublished') : t('teacher.testUnpublished'),
          );
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <Link
            href="/teacher-dashboard/tests"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            {t('teacher.tests')}
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            {test.title}
          </h1>
          {test.description && (
            <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span>📝 {test.questions.length} {t('teacher.questions')}</span>
            <span>⭐ {test.totalPoints} {t('teacher.points')}</span>
            {test.timeLimitSec && <span>⏱ {Math.floor(test.timeLimitSec / 60)} {t('teacher.minutes')}</span>}
            <span>🎯 {test.passingScore}% {t('teacher.passing')}</span>
            <span>🔁 {test.allowedAttempts || '∞'} {t('teacher.attempts')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAttempts((v) => !v)}
            className="px-3 py-2 border border-border rounded-md hover:bg-muted text-sm flex items-center gap-2"
          >
            <Icon name="ChartBarIcon" size={14} />
            {t('teacher.results')}
          </button>
          <button
            onClick={handlePublishToggle}
            disabled={updateTest.isPending || test.questions.length === 0}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${
              isPublished
                ? 'bg-warning text-warning-foreground'
                : 'bg-success text-success-foreground'
            }`}
            title={test.questions.length === 0 ? t('teacher.addQuestionFirst') : ''}
          >
            <Icon name={isPublished ? 'EyeSlashIcon' : 'EyeIcon'} size={14} />
            {isPublished ? t('teacher.toDraft') : t('teacher.publish')}
          </button>
        </div>
      </div>

      {showAttempts && (
        <div className="bg-card border border-border rounded-md p-4 mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Icon name="ChartBarIcon" size={16} />
            {t('teacher.studentResults')}
          </h3>
          {attempts.isLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (attempts.data?.attempts.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {t('teacher.noAttempts')}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2">{t('teacher.student')}</th>
                  <th className="text-right">{t('teacher.points')}</th>
                  <th className="text-right">%</th>
                  <th className="text-right">{t('teacher.status')}</th>
                  <th className="text-right">{t('teacher.date')}</th>
                </tr>
              </thead>
              <tbody>
                {attempts.data?.attempts.map((a) => (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="py-2">{a.studentName || a.studentEmail}</td>
                    <td className="text-right">
                      {a.score}/{a.maxScore}
                    </td>
                    <td className="text-right font-medium">{a.percentage}%</td>
                    <td className="text-right">
                      {a.passed ? (
                        <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">
                          {t('teacher.passed')}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                          {t('teacher.failed')}
                        </span>
                      )}
                    </td>
                    <td className="text-right text-xs text-muted-foreground">
                      {a.submittedAt
                        ? new Date(a.submittedAt).toLocaleDateString('uz-UZ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">{t('teacher.questions')} ({test.questions.length})</h2>
        <button
          onClick={() => setAdderOpen(true)}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-2"
        >
          <Icon name="PlusIcon" size={14} />
          {t('teacher.addQuestion')}
        </button>
      </div>

      {test.questions.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-md">
          <Icon
            name="QuestionMarkCircleIcon"
            size={40}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground mb-2">{t('teacher.noQuestions')}</p>
          <button
            onClick={() => setAdderOpen(true)}
            className="text-primary hover:underline text-sm"
          >
            {t('teacher.addFirstQuestion')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {test.questions.map((q, i) => (
            <div
              key={q.id}
              className="bg-card border border-border rounded-md p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-muted-foreground shrink-0 mt-1">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="font-medium text-foreground">{q.questionText}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">
                      {TYPE_LABEL[q.questionType].label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-warning/10 text-warning rounded-full">
                      {q.points} {t('teacher.points')}
                    </span>
                  </div>
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <ul className="space-y-1 text-sm">
                      {q.options.map((o, j) => (
                        <li
                          key={j}
                          className={`flex items-center gap-2 ${
                            o.isCorrect ? 'text-success font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          <Icon
                            name={o.isCorrect ? 'CheckCircleIcon' : 'CircleStackIcon'}
                            size={12}
                          />
                          {o.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.questionType === 'true_false' && (
                    <p className="text-sm text-success">
                      {t('teacher.correctAnswer')}:{' '}
                      <strong>{q.correctAnswers?.[0] === 'true' ? t('teacher.true') : t('teacher.false')}</strong>
                    </p>
                  )}
                  {q.questionType === 'text' && (
                    <p className="text-sm text-success">
                      {t('teacher.accepted')}: <code className="bg-muted px-1 rounded">{q.correctAnswers?.join(', ')}</code>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(q)}
                    className="p-2 hover:bg-muted rounded-md"
                    aria-label={t('common.edit')}
                  >
                    <Icon name="PencilIcon" size={14} className="text-primary" />
                  </button>
                  <button
                    onClick={() => setPendingDelete(q)}
                    className="p-2 hover:bg-destructive/10 rounded-md"
                    aria-label={t('common.delete')}
                  >
                    <Icon name="TrashIcon" size={14} className="text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adderOpen && (
        <QuestionEditorModal
          isLoading={addQuestion.isPending}
          onSubmit={(input) =>
            addQuestion.mutate(input, {
              onSuccess: () => {
                toast.success(t('teacher.questionAdded'));
                setAdderOpen(false);
              },
              onError: (err) => toast.error(err.message),
            })
          }
          onClose={() => setAdderOpen(false)}
        />
      )}

      {editing && (
        <QuestionEditorModal
          initial={editing}
          isLoading={updateQuestion.isPending}
          onSubmit={(input) =>
            updateQuestion.mutate(
              { questionId: editing.id, input },
              {
                onSuccess: () => {
                  toast.success(t('teacher.questionUpdated'));
                  setEditing(null);
                },
                onError: (err) => toast.error(err.message),
              },
            )
          }
          onClose={() => setEditing(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          open={true}
          title={t('teacher.deleteQuestion')}
          message={t('teacher.deleteQuestionConfirm')}
          confirmLabel={t('common.delete')}
          variant="danger"
          isLoading={deleteQuestion.isPending}
          onConfirm={() => {
            deleteQuestion.mutate(pendingDelete.id, {
              onSuccess: () => {
                toast.success(t('teacher.questionDeleted'));
                setPendingDelete(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          onCancel={() => !deleteQuestion.isPending && setPendingDelete(null)}
        />
      )}
    </div>
  );
}

interface QuestionFormInput {
  questionText: string;
  questionType: QuestionTypeDTO;
  options?: QuestionOptionDTO[];
  correctAnswers?: string[];
  points: number;
  explanation?: string;
}

function QuestionEditorModal({
  initial,
  isLoading,
  onSubmit,
  onClose,
}: {
  initial?: QuestionDTO;
  isLoading: boolean;
  onSubmit: (input: QuestionFormInput) => void;
  onClose: () => void;
}) {
  const [questionText, setQuestionText] = useState(initial?.questionText ?? '');
  const [questionType, setQuestionType] = useState<QuestionTypeDTO>(
    (initial?.questionType as QuestionTypeDTO) ?? 'single',
  );
  const [options, setOptions] = useState<QuestionOptionDTO[]>(
    Array.isArray(initial?.options) && initial.options.length > 0
      ? initial.options
      : [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
  );
  const [textAnswers, setTextAnswers] = useState<string>(
    initial?.questionType === 'text' && Array.isArray(initial.correctAnswers)
      ? initial.correctAnswers.join(', ')
      : '',
  );
  const [trueFalseValue, setTrueFalseValue] = useState<'true' | 'false'>(
    initial?.questionType === 'true_false' && Array.isArray(initial.correctAnswers)
      ? (initial.correctAnswers[0] as 'true' | 'false')
      : 'true',
  );
  const [points, setPoints] = useState(initial?.points ?? 1);
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const { t } = useI18n();

  const TYPE_LABEL: Record<QuestionTypeDTO, { label: string; icon: string }> = {
    single: { label: t('teacher.singleChoice'), icon: 'CheckCircleIcon' },
    multiple: { label: t('teacher.multipleChoice'), icon: 'CheckBadgeIcon' },
    true_false: { label: t('teacher.trueFalse'), icon: 'CheckIcon' },
    text: { label: t('teacher.textAnswer'), icon: 'PencilSquareIcon' },
  };

  const addOption = () => setOptions((o) => [...o, { text: '', isCorrect: false }]);
  const removeOption = (i: number) =>
    setOptions((o) => (o.length > 2 ? o.filter((_, idx) => idx !== i) : o));
  const setOptionText = (i: number, text: string) =>
    setOptions((o) => o.map((x, idx) => (idx === i ? { ...x, text } : x)));
  const setOptionCorrect = (i: number, isCorrect: boolean) => {
    if (questionType === 'single') {
      setOptions((o) => o.map((x, idx) => ({ ...x, isCorrect: idx === i ? isCorrect : false })));
    } else {
      setOptions((o) => o.map((x, idx) => (idx === i ? { ...x, isCorrect } : x)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionText.trim().length < 2) {
      toast.error(t('teacher.questionMinLength'));
      return;
    }

    const input: QuestionFormInput = {
      questionText: questionText.trim(),
      questionType,
      points,
      explanation: explanation.trim() || undefined,
    };

    if (questionType === 'single' || questionType === 'multiple') {
      const cleaned = options.filter((o) => o.text.trim().length > 0);
      if (cleaned.length < 2) {
        toast.error(t('teacher.minTwoOptions'));
        return;
      }
      const correctCount = cleaned.filter((o) => o.isCorrect).length;
      if (questionType === 'single' && correctCount !== 1) {
        toast.error(t('teacher.selectOneCorrect'));
        return;
      }
      if (questionType === 'multiple' && correctCount < 1) {
        toast.error(t('teacher.minOneCorrect'));
        return;
      }
      input.options = cleaned;
    } else if (questionType === 'true_false') {
      input.correctAnswers = [trueFalseValue];
    } else if (questionType === 'text') {
      const answers = textAnswers
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (answers.length === 0) {
        toast.error(t('teacher.minOneCorrect'));
        return;
      }
      input.correctAnswers = answers;
    }

    onSubmit(input);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-2xl w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">
            {initial ? t('teacher.editQuestion') : t('teacher.newQuestion')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
            aria-label={t('common.close')}
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.questionType')} *</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TYPE_LABEL) as QuestionTypeDTO[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQuestionType(t)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-smooth ${
                    questionType === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <Icon name={TYPE_LABEL[t].icon} size={16} />
                  <span>{TYPE_LABEL[t].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.questionText')} *</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
              rows={2}
              placeholder={t('teacher.enterQuestion')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>

          {(questionType === 'single' || questionType === 'multiple') && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('teacher.options')} *</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type={questionType === 'single' ? 'radio' : 'checkbox'}
                      checked={opt.isCorrect}
                      onChange={(e) => setOptionCorrect(i, e.target.checked)}
                      className="shrink-0"
                    />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => setOptionText(i, e.target.value)}
                      placeholder={`Variant ${i + 1}`}
                      className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      className="p-2 hover:bg-destructive/10 rounded-md disabled:opacity-30"
                      aria-label={t('common.delete')}
                    >
                      <Icon name="TrashIcon" size={14} className="text-destructive" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Icon name="PlusIcon" size={12} />
                  {t('teacher.addOption')}
                </button>
              </div>
            </div>
          )}

          {questionType === 'true_false' && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('teacher.correctAnswer')} *</label>
              <div className="flex gap-2">
                {(['true', 'false'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTrueFalseValue(v)}
                    className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium ${
                      trueFalseValue === v
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {v === 'true' ? `✓ ${t('teacher.true')}` : `✗ ${t('teacher.false')}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {questionType === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('teacher.acceptableAnswers')} *
              </label>
              <input
                type="text"
                value={textAnswers}
                onChange={(e) => setTextAnswers(e.target.value)}
                placeholder="function, fn, def"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('teacher.caseInsensitiveNote')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('teacher.points')} *</label>
              <input
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('teacher.explanationOptional')}</label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={t('teacher.shownAfterAnswer')}
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
            {initial ? t('common.save') : t('teacher.add')}
          </button>
        </div>
      </form>
    </div>
  );
}
