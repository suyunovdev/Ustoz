'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import QuestionDisplay from './QuestionDisplay';
import ProgressIndicator from './ProgressIndicator';
import NavigationControls from './NavigationControls';
import TimerDisplay from './TimerDisplay';
import QuestionReviewPanel from './QuestionReviewPanel';
import ResultsScreen from './ResultsScreen';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctAnswer: string | number;
  explanation: string;
  points: number;
  topic: string;
}

interface QuizAnswer {
  questionId: string;
  answer: string | number | null;
  flagged: boolean;
}

interface QuizConfig {
  title: string;
  description: string;
  totalQuestions: number;
  totalPoints: number;
  timeLimit: number;
  passingScore: number;
}

const QuizInterfaceInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const courseId = searchParams.get('courseId');

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quizState, setQuizState] = useState<'taking' | 'review' | 'results'>('taking');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
    if (!testId) {
      router.push('/student-dashboard');
      return;
    }
    loadQuiz(testId);
  }, [testId]);

  // Timer countdown
  useEffect(() => {
    if (quizState !== 'taking' || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizState, timeRemaining]);

  const loadQuiz = async (id: string) => {
    setIsLoading(true);
    try {
      // Auth check via JWT
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const me = await meRes.json();
      setUserId(me.user.id);

      // Load test + questions
      const res = await fetch(`/api/tests/${id}`, { credentials: 'include' });
      if (!res.ok) {
        router.push('/student-dashboard');
        return;
      }
      const { test } = await res.json();

      if (!test || !test.questions || test.questions.length === 0) {
        router.push('/student-dashboard');
        return;
      }

      const mapped: QuizQuestion[] = test.questions.map((q: { id: string; questionText: string; optionA: string; optionB: string; optionC: string; optionD: string }) => ({
        id: q.id,
        type: 'multiple-choice',
        question: q.questionText,
        options: [q.optionA, q.optionB, q.optionC, q.optionD],
        // correctAnswer client'ga yuborilmaydi — backend tekshiradi
        correctAnswer: -1,
        explanation: '',
        points: 10,
        topic: test.title,
      }));

      setQuestions(mapped);
      setAnswers(mapped.map((q) => ({ questionId: q.id, answer: null, flagged: false })));
      setQuizConfig({
        title: test.title,
        description: test.description || '',
        totalQuestions: mapped.length,
        totalPoints: mapped.length * 10,
        timeLimit: 3600,
        passingScore: test.passingScore || 80,
      });
      setTimeRemaining(3600);
    } catch (err) {
      console.error('Test yuklanmadi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: string | number) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentQuestionIndex ? { ...a, answer } : a))
    );
  };

  const handleFlag = (questionId: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, flagged: !a.flagged } : a))
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!quizConfig || !userId || !testId) return;

    try {
      // Server tomonida tekshirish va saqlash
      const indexToLetter = ['A', 'B', 'C', 'D'];
      const payloadAnswers = answers.map((a) => ({
        questionId: a.questionId,
        answer: typeof a.answer === 'number' ? indexToLetter[a.answer] : a.answer,
      }));

      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: payloadAnswers, courseId: courseId || null }),
      });

      if (res.ok) {
        const result = await res.json();
        setScore(result.percentage);

        // Backend details bilan questions ni yangilash (correct answer + explanation)
        const detailsById = new Map((result.details || []).map((d: { questionId: string; correctAnswer: string; explanation?: string }) => [d.questionId, d]));
        setQuestions((prev) =>
          prev.map((q) => {
            const d = detailsById.get(q.id);
            if (!d) return q;
            const correctIdx = ['A', 'B', 'C', 'D'].indexOf(d.correctAnswer);
            return {
              ...q,
              correctAnswer: correctIdx,
              explanation: d.explanation || '',
            };
          })
        );
      } else {
        // Lokal hisoblab natijani ko'rsatish (offline)
        const correct = questions.filter((q, i) => answers[i]?.answer === q.correctAnswer).length;
        setScore(Math.round((correct / questions.length) * 100));
      }
    } catch (err) {
      console.error('Natija saqlanmadi:', err);
    } finally {
      setQuizState('results');
    }
  }, [quizConfig, userId, testId, courseId, questions, answers]);

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Test yuklanmoqda...</div>
      </div>
    );
  }

  if (!quizConfig || questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  if (quizState === 'results') {
    return (
      <div className="min-h-screen bg-background pt-20">
        <ResultsScreen
          score={score}
          totalPoints={quizConfig.totalPoints}
          passingScore={quizConfig.passingScore}
          answers={answers}
          questions={questions}
          onRetake={() => {
            setAnswers(questions.map((q) => ({ questionId: q.id, answer: null, flagged: false })));
            setCurrentQuestionIndex(0);
            setTimeRemaining(3600);
            setQuizState('taking');
          }}
          onExit={() => courseId ? router.push(`/learning-interface?courseId=${courseId}`) : router.push('/student-dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{quizConfig.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{quizConfig.description}</p>
          </div>
          <TimerDisplay timeRemaining={timeRemaining} isUrgent={timeRemaining < 300} />
        </div>

        <ProgressIndicator
          current={currentQuestionIndex + 1}
          total={quizConfig.totalQuestions}
          answers={answers}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              selectedAnswer={currentAnswer?.answer}
              isFlagged={currentAnswer?.flagged || false}
              onAnswer={handleAnswer}
              onFlag={() => handleFlag(currentQuestion.id)}
              showExplanation={quizState === 'review'}
            />

            <NavigationControls
              currentIndex={currentQuestionIndex}
              totalQuestions={quizConfig.totalQuestions}
              onPrevious={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              onNext={() => setCurrentQuestionIndex((i) => Math.min(quizConfig.totalQuestions - 1, i + 1))}
              onSubmit={handleSubmit}
              onToggleReview={() => setShowReviewPanel(!showReviewPanel)}
              answeredCount={answers.filter((a) => a.answer !== null).length}
            />
          </div>

          {showReviewPanel && (
            <div className="lg:col-span-1">
              <QuestionReviewPanel
                questions={questions}
                answers={answers}
                currentIndex={currentQuestionIndex}
                onQuestionSelect={setCurrentQuestionIndex}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizInterfaceInteractive;
