'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface ResultData {
  attempt: {
    id: string;
    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;
    score: number;
    maxScore: number;
    percentage: string;
    passed: boolean;
    status: string;
  };
  test: {
    id: string;
    title: string;
    passingScore: number;
    totalPoints: number;
  };
  results: Array<{
    questionId: string;
    questionText: string;
    questionType: 'single' | 'multiple' | 'true_false' | 'text';
    questionOrder: number;
    points: number;
    userAnswer: string | string[] | null;
    correct: boolean;
    pointsEarned: number;
    correctAnswer: string[] | null;
    options: Array<{ text: string; isCorrect?: boolean }> | null;
    explanation: string | null;
  }>;
}

interface Props {
  testId: string;
  attemptId: string;
}

export default function ResultClient({ testId, attemptId }: Props) {
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/attempts/${attemptId}`, { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setData(json);
      } catch (e: any) {
        setError(e?.message || 'Xato');
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  if (loading) return <div className="p-8 text-center">Yuklanmoqda…</div>;
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <p className="text-destructive">{error || 'Yuklab bo\'lmadi'}</p>
      </div>
    );
  }

  const { attempt, test, results } = data;
  const correctCount = results.filter((r) => r.correct).length;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div
        className={`rounded-md p-6 mb-6 text-center ${
          attempt.passed ? 'bg-success/10' : 'bg-destructive/10'
        }`}
      >
        <Icon
          name={attempt.passed ? 'CheckCircleIcon' : 'XCircleIcon'}
          size={48}
          className={`mx-auto mb-2 ${attempt.passed ? 'text-success' : 'text-destructive'}`}
        />
        <h1 className="text-2xl font-heading font-semibold mb-1">
          {attempt.passed ? 'Tabriklaymiz! O\'tdingiz' : 'Afsus, o\'tmadingiz'}
        </h1>
        <p className="text-sm text-muted-foreground mb-3">{test.title}</p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground">Bal</p>
            <p className="text-3xl font-bold text-foreground">
              {attempt.score} / {attempt.maxScore}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Foiz</p>
            <p className="text-3xl font-bold text-foreground">{attempt.percentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">To'g'ri</p>
            <p className="text-3xl font-bold text-foreground">
              {correctCount} / {results.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">O'tish balli</p>
            <p className="text-3xl font-bold text-foreground">{test.passingScore}%</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-3">Savol-javoblar tahlili</h2>
      <div className="space-y-3 mb-6">
        {results.map((r, i) => (
          <div
            key={r.questionId}
            className={`bg-card border rounded-md p-4 ${
              r.correct ? 'border-success/50' : 'border-destructive/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  r.correct ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                }`}
              >
                <Icon name={r.correct ? 'CheckIcon' : 'XMarkIcon'} size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="font-medium text-foreground">
                    {i + 1}. {r.questionText}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.correct ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {r.pointsEarned}/{r.points} bal
                  </span>
                </div>

                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Sizning javobingiz: </span>
                    <span
                      className={r.correct ? 'text-success font-medium' : 'text-destructive font-medium'}
                    >
                      {Array.isArray(r.userAnswer)
                        ? r.userAnswer.join(', ') || '—'
                        : r.userAnswer || '— (javob berilmagan)'}
                    </span>
                  </p>
                  {!r.correct && r.correctAnswer && (
                    <p>
                      <span className="text-muted-foreground">To'g'ri javob: </span>
                      <span className="text-success font-medium">
                        {r.correctAnswer.join(', ')}
                      </span>
                    </p>
                  )}
                </div>

                {r.explanation && (
                  <p className="mt-2 text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                    💡 {r.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/tests/${testId}/take`}
          className="px-4 py-2 border border-border rounded-md hover:bg-muted text-sm"
        >
          Qayta urinish
        </Link>
        <Link
          href="/student-dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm"
        >
          Dashboard'ga qaytish
        </Link>
      </div>
    </div>
  );
}
