'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Skeleton, SkeletonForm } from '@/components/ui/Skeleton';
import TestStructurePanel from './TestStructurePanel';
import QuestionEditor from './QuestionEditor';
import PublishingPanel from './PublishingPanel';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';

interface TestQuestion {
  id: string;
  order: number;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  points: number;
  timeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface TestConfig {
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  retakePolicy: 'unlimited' | 'limited' | 'once';
  maxRetakes: number;
  randomizeQuestions: boolean;
  showResults: boolean;
}

const SequentialTestBuilderInteractive = () => {
  const { t } = useI18n();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<'structure' | 'editor' | 'publish'>('structure');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([
    {
      id: 'q-1',
      order: 1,
      type: 'multiple-choice',
      question: 'Dasturlashda o\'zgaruvchi nima?',
      options: ['Ma\'lumot saqlash joyi', 'Funksiya', 'Operator', 'Shart'],
      correctAnswer: 0,
      explanation: 'O\'zgaruvchi - bu ma\'lumotlarni vaqtinchalik saqlash uchun xotira joyi.',
      points: 10,
      difficulty: 'easy',
      topic: 'Asoslar'
    }
  ]);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    title: '',
    description: '',
    passingScore: 80,
    timeLimit: 60,
    retakePolicy: 'unlimited',
    maxRetakes: 3,
    randomizeQuestions: false,
    showResults: true
  });
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedTestId, setPublishedTestId] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    // O'qituvchining kurslarini yuklaymiz (test qaysi kursga tegishli bo'lishini tanlash uchun)
    fetch('/api/teacher/courses', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { courses: [] }))
      .then((data) => setCourses(Array.isArray(data.courses) ? data.courses : []))
      .catch(() => setCourses([]));
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-md" />
            ))}
          </div>
          <SkeletonForm fields={5} />
        </div>
      </div>
    );
  }

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  const handleAddQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `q-${Date.now()}`,
      order: questions.length + 1,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      points: 10,
      difficulty: 'medium',
      topic: ''
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setActiveSection('editor');
  };

  const handleQuestionUpdate = (updatedQuestion: TestQuestion) => {
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  };

  const handleQuestionDelete = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null);
    }
  };

  const handleQuestionReorder = (questions: TestQuestion[]) => {
    setQuestions(questions);
  };

  const handleConfigUpdate = (config: TestConfig) => {
    setTestConfig(config);
  };

  // Local savol shaklini backend DTO (AddQuestionInput)ga o'giradi
  const mapQuestionToDTO = (q: TestQuestion) => {
    const points = q.points || 1;
    const explanation = q.explanation || undefined;
    if (q.type === 'multiple-choice') {
      const opts = (q.options || []).map((text, i) => ({
        text,
        isCorrect: i === Number(q.correctAnswer),
      }));
      return { questionText: q.question, questionType: 'single', options: opts, points, explanation };
    }
    if (q.type === 'true-false') {
      const isTrue =
        typeof q.correctAnswer === 'string'
          ? q.correctAnswer.toLowerCase() === 'true'
          : Number(q.correctAnswer) === 0;
      return {
        questionText: q.question,
        questionType: 'true_false',
        correctAnswers: [isTrue ? 'true' : 'false'],
        points,
        explanation,
      };
    }
    // fill-blank | essay → text
    const ca = String(q.correctAnswer ?? '').trim();
    return {
      questionText: q.question,
      questionType: 'text',
      correctAnswers: [ca || '—'],
      points,
      explanation,
    };
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    if (publishedTestId) {
      toast.error('Bu test allaqachon chop etilgan');
      return;
    }
    if (!selectedCourseId) {
      toast.error('Iltimos, test uchun kursni tanlang');
      return;
    }
    if (!testConfig.title.trim()) {
      toast.error('Test nomi majburiy');
      return;
    }
    if (questions.length === 0) {
      toast.error("Kamida bitta savol qo'shing");
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: selectedCourseId,
          title: testConfig.title,
          description: testConfig.description || undefined,
          passingScore: testConfig.passingScore,
          timeLimitSec: testConfig.timeLimit ? testConfig.timeLimit * 60 : undefined,
          allowedAttempts: testConfig.retakePolicy === 'unlimited' ? 0 : testConfig.maxRetakes,
          randomizeQuestions: testConfig.randomizeQuestions,
          showCorrectAnswers: testConfig.showResults,
          questions: questions.map(mapQuestionToDTO),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Xatolik (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      if (data?.test?.id) setPublishedTestId(data.test.id);
      toast.success(t('testBuilder.testPublished'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Testni saqlab bo'lmadi");
    } finally {
      setIsPublishing(false);
    }
  };

  const sections = [
    { id: 'structure', label: t('testBuilder.testStructure'), icon: 'ListBulletIcon' },
    { id: 'editor', label: t('testBuilder.questionEditor'), icon: 'PencilSquareIcon' },
    { id: 'publish', label: t('testBuilder.publishLabel'), icon: 'PaperAirplaneIcon' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">{t('testBuilder.createSequentialTest')}</h1>
              <p className="text-muted-foreground mt-1">{t('testBuilder.createProfessionalTests')}</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="font-medium hidden sm:inline">{t('common.back')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Navigation */}
        <div className="bg-card rounded-md shadow-warm p-2 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as typeof activeSection)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-smooth whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-warm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name={section.icon} size={20} />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Always visible on desktop */}
          <div className="lg:col-span-1">
            <TestStructurePanel
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onQuestionSelect={setSelectedQuestionId}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onQuestionReorder={handleQuestionReorder as any}
              onAddQuestion={handleAddQuestion}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeSection === 'structure' && (
              <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
                <div className="text-center py-12">
                  <Icon name="ListBulletIcon" size={64} className="text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                    Test tuzilmasi
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Chap panelda savollarni ko'ring va tartibini o'zgartiring
                  </p>
                  <button
                    onClick={handleAddQuestion}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
                  >
                    <Icon name="PlusIcon" size={20} />
                    <span className="font-medium">{t('testBuilder.addQuestion')}</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'editor' && (
              <QuestionEditor
                question={selectedQuestion}
                onQuestionUpdate={handleQuestionUpdate}
                onQuestionDelete={handleQuestionDelete}
              />
            )}

            {activeSection === 'publish' && (
              <div className="space-y-6">
                {/* Kurs tanlash — test qaysi kursga tegishli bo'lishini belgilaydi */}
                <div className="bg-card rounded-md shadow-warm p-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kurs *
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Kursni tanlang —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Sizda hali kurs yo'q. Avval kurs yarating.
                    </p>
                  )}
                </div>

                <PublishingPanel
                  config={testConfig}
                  questions={questions}
                  onConfigUpdate={handleConfigUpdate}
                  onPublish={handlePublish}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequentialTestBuilderInteractive;