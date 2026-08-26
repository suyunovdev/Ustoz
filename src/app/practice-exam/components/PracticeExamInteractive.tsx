'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { SUBJECT_LABELS } from '@/lib/data/subject-labels';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

type Phase = 'setup' | 'loading' | 'taking' | 'results';

const SUBJECT_OPTIONS = Object.entries(SUBJECT_LABELS).map(([value, label]) => ({ value, label }));
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const COUNTS = [10, 20, 30];

const PracticeExamInteractive = () => {
  const { t } = useI18n();
  const router = useRouter();

  const [subActive, setSubActive] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [subject, setSubject] = useState('mathematics');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('intermediate');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/subscriptions/my', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { subscription: null }))
      .then((d) => { if (!cancelled) setSubActive(Boolean(d?.subscription)); })
      .catch(() => { if (!cancelled) setSubActive(false); });
    return () => { cancelled = true; };
  }, []);

  const start = async () => {
    setError(null);
    setPhase('loading');
    try {
      const res = await fetch('/api/learning/practice-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, difficulty, count }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) { setSubActive(false); setPhase('setup'); return; }
      if (res.status === 429) { setError(t('exam.limitReached')); setPhase('setup'); return; }
      if (res.status === 503) { setError(t('exam.notConfigured')); setPhase('setup'); return; }
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setError(t('exam.genFailed')); setPhase('setup'); return;
      }
      setQuestions(data.questions);
      setAnswers({});
      setPhase('taking');
    } catch {
      setError(t('exam.genFailed'));
      setPhase('setup');
    }
  };

  const submit = () => setPhase('results');
  const reset = () => { setPhase('setup'); setQuestions([]); setAnswers({}); setError(null); };

  // ── Yuklanmoqda (obuna tekshiruvi) ──
  if (subActive === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Obuna yo'q → upsell ──
  if (!subActive) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-5">
          <Icon name="ClipboardDocumentCheckIcon" size={30} variant="solid" className="text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{t('exam.title')}</h2>
        <p className="text-muted-foreground mb-6">{t('exam.upsellDesc')}</p>
        <button onClick={() => router.push('/student-subscription')} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          <Icon name="SparklesIcon" size={18} /> {t('exam.subscribe')}
        </button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const scorePct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const weakTopics = Array.from(
    new Set(questions.filter((q) => answers[q.id] !== q.correctIndex).map((q) => q.topic)),
  ).slice(0, 8);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Icon name="ClipboardDocumentCheckIcon" size={26} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{t('exam.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('exam.subtitle')}</p>
          </div>
        </div>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-xl">
            {error && <p className="text-sm text-error">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('exam.subject')}</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                {SUBJECT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('exam.difficulty')}</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${difficulty === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:border-primary/50'}`}>
                    {t(`misc.${d}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('exam.count')}</label>
              <div className="flex gap-2">
                {COUNTS.map((c) => (
                  <button key={c} onClick={() => setCount(c)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${count === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:border-primary/50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={start} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              <Icon name="PlayIcon" size={18} variant="solid" /> {t('exam.startBtn')}
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground font-medium">{t('exam.generating')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('exam.generatingHint')}</p>
          </div>
        )}

        {/* ── TAKING ── */}
        {phase === 'taking' && (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('exam.answered', { n: answeredCount, total: questions.length })}</span>
              <button onClick={submit} disabled={answeredCount === 0} className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 disabled:opacity-50">
                {t('exam.finish')}
              </button>
            </div>
            {questions.map((q, i) => (
              <div key={q.id} className="bg-card rounded-xl border border-border p-5">
                <p className="font-medium text-foreground mb-3"><span className="text-primary">{i + 1}.</span> {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${answers[q.id] === oi ? 'bg-primary/10 border-primary text-foreground' : 'bg-background border-border text-foreground hover:border-primary/40'}`}>
                      <span className="font-data text-muted-foreground mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={submit} disabled={answeredCount === 0} className="w-full px-4 py-3 bg-success text-white rounded-lg font-semibold hover:bg-success/90 disabled:opacity-50">
              {t('exam.finish')}
            </button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === 'results' && (
          <div className="space-y-5">
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <div className={`text-5xl font-heading font-bold mb-1 ${scorePct >= 60 ? 'text-success' : 'text-warning'}`}>{scorePct}%</div>
              <p className="text-muted-foreground">{t('exam.scoreLine', { correct: correctCount, total: questions.length })}</p>
              {weakTopics.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="text-sm font-medium text-foreground mb-2">{t('exam.weakTopics')}</p>
                  <div className="flex flex-wrap gap-2">
                    {weakTopics.map((tp) => (
                      <span key={tp} className="px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">{tp}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={reset} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                <Icon name="ArrowPathIcon" size={16} /> {t('exam.newExam')}
              </button>
            </div>
            {questions.map((q, i) => {
              const chosen = answers[q.id];
              const correct = chosen === q.correctIndex;
              return (
                <div key={q.id} className="bg-card rounded-xl border border-border p-5">
                  <p className="font-medium text-foreground mb-3 flex items-start gap-2">
                    <Icon name={correct ? 'CheckCircleIcon' : 'XCircleIcon'} size={18} variant="solid" className={correct ? 'text-success flex-shrink-0 mt-0.5' : 'text-error flex-shrink-0 mt-0.5'} />
                    <span><span className="text-primary">{i + 1}.</span> {q.question}</span>
                  </p>
                  <div className="space-y-1.5 ml-6">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      const isChosen = oi === chosen;
                      return (
                        <div key={oi} className={`px-3 py-2 rounded-lg text-sm border ${isCorrect ? 'bg-success/10 border-success/40 text-foreground' : isChosen ? 'bg-error/10 border-error/40 text-foreground' : 'border-transparent text-muted-foreground'}`}>
                          <span className="font-data mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                          {isCorrect && <Icon name="CheckIcon" size={14} className="inline ml-1 text-success" />}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && <p className="text-sm text-muted-foreground mt-3 ml-6"><span className="font-medium text-foreground">{t('exam.explanation')}:</span> {q.explanation}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default PracticeExamInteractive;
