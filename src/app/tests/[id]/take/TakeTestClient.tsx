'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';

interface QuestionForStudent {
  id: string;
  questionText: string;
  questionType: 'single' | 'multiple' | 'true_false' | 'text';
  options: { text: string }[] | null;
  points: number;
  questionOrder: number;
}

interface StartResponse {
  attempt: {
    id: string;
    attemptNumber: number;
    startedAt: string;
  };
  questions: QuestionForStudent[];
  test: {
    id: string;
    title: string;
    timeLimitSec: number | null;
    totalPoints: number;
    passingScore: number;
  };
}

interface Props {
  testId: string;
}

export default function TakeTestClient({ testId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);

  // Test boshlash
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tests/${testId}/attempts`, {
          method: 'POST',
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        if (!cancelled) {
          setData(json);
          if (json.test.timeLimitSec) {
            const elapsed = Math.floor(
              (Date.now() - new Date(json.attempt.startedAt).getTime()) / 1000,
            );
            const remaining = Math.max(0, json.test.timeLimitSec - elapsed);
            setTimeLeftSec(remaining);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Xato');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  // Timer
  useEffect(() => {
    if (timeLeftSec === null) return;
    if (timeLeftSec <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setInterval(() => setTimeLeftSec((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSec]);

  const handleSubmit = async (auto = false) => {
    if (!data) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attempts/${data.attempt.id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || `Xato: ${res.status}`);
        setSubmitting(false);
        return;
      }
      if (auto) toast.info("Vaqt tugadi — avtomatik topshirildi");
      router.push(`/tests/${testId}/result/${data.attempt.id}`);
    } catch (e: any) {
      toast.error(e?.message || 'Xato');
      setSubmitting(false);
    }
  };

  const handleAnswer = (qId: string, value: string | string[]) => {
    setAnswers((a) => ({ ...a, [qId]: value }));
  };

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => answers[k] && (answers[k] as any).length !== 0).length,
    [answers],
  );

  if (loading) return <div className="p-8 text-center">Test yuklanmoqda…</div>;
  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <Icon name="ExclamationTriangleIcon" size={48} className="text-destructive mx-auto mb-3" />
        <p className="text-destructive mb-3">{error}</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline text-sm"
        >
          ← Orqaga
        </button>
      </div>
    );
  }
  if (!data) return null;

  const q = data.questions[currentIdx];
  const isLast = currentIdx === data.questions.length - 1;
  const isFirst = currentIdx === 0;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-card border border-border rounded-md p-4 mb-4 sticky top-2 z-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading font-semibold text-foreground truncate">
              {data.test.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {answeredCount}/{data.questions.length} javob berildi
              {' · '}
              O'tish balli: {data.test.passingScore}%
            </p>
          </div>
          {timeLeftSec !== null && (
            <div
              className={`px-3 py-1.5 rounded-md font-mono text-sm ${
                timeLeftSec < 60
                  ? 'bg-destructive/10 text-destructive animate-pulse'
                  : 'bg-warning/10 text-warning'
              }`}
            >
              <Icon name="ClockIcon" size={14} className="inline mr-1" />
              {String(Math.floor(timeLeftSec / 60)).padStart(2, '0')}:
              {String(timeLeftSec % 60).padStart(2, '0')}
            </div>
          )}
        </div>
        <div className="mt-2 flex gap-1 flex-wrap">
          {data.questions.map((qi, i) => {
            const answered = !!answers[qi.id];
            return (
              <button
                key={qi.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-7 h-7 rounded-md text-xs font-medium transition-smooth ${
                  i === currentIdx
                    ? 'bg-primary text-primary-foreground'
                    : answered
                    ? 'bg-success/20 text-success'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-md p-6 mb-4">
        <div className="flex items-start justify-between gap-2 mb-4">
          <p className="text-xs text-muted-foreground">
            Savol {currentIdx + 1} / {data.questions.length}
          </p>
          <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full">
            {q.points} bal
          </span>
        </div>
        <h2 className="text-lg font-medium text-foreground mb-4">{q.questionText}</h2>

        {q.questionType === 'single' && Array.isArray(q.options) && (
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === opt.text;
              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-smooth ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={selected}
                    onChange={() => handleAnswer(q.id, opt.text)}
                    className="shrink-0"
                  />
                  <span className="text-sm">{opt.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {q.questionType === 'multiple' && Array.isArray(q.options) && (
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const current = (answers[q.id] as string[]) || [];
              const selected = current.includes(opt.text);
              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-smooth ${
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...current, opt.text]
                        : current.filter((x) => x !== opt.text);
                      handleAnswer(q.id, newValue);
                    }}
                    className="shrink-0"
                  />
                  <span className="text-sm">{opt.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {q.questionType === 'true_false' && (
          <div className="grid grid-cols-2 gap-3">
            {(['true', 'false'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleAnswer(q.id, v)}
                className={`p-4 rounded-md border text-base font-medium transition-smooth ${
                  answers[q.id] === v
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {v === 'true' ? '✓ Rost' : '✗ Yolg\'on'}
              </button>
            ))}
          </div>
        )}

        {q.questionType === 'text' && (
          <input
            type="text"
            value={(answers[q.id] as string) || ''}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
            placeholder="Javobingizni yozing…"
            className="w-full px-4 py-3 border border-border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="px-4 py-2 border border-border rounded-md hover:bg-muted text-sm disabled:opacity-30 flex items-center gap-2"
        >
          <Icon name="ArrowLeftIcon" size={14} />
          Oldingisi
        </button>
        {isLast ? (
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-6 py-2 bg-success text-success-foreground rounded-md hover:opacity-90 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            Yakunlash
            <Icon name="CheckIcon" size={14} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(data.questions.length - 1, i + 1))}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-2"
          >
            Keyingisi
            <Icon name="ArrowRightIcon" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
