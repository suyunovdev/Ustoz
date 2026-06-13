'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import TestStructurePanel from './TestStructurePanel';
import QuestionEditor from './QuestionEditor';
import PublishingPanel from './PublishingPanel';

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

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
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

  const handlePublish = () => {
    console.log('Publishing test:', { testConfig, questions });
    alert('Test muvaffaqiyatli nashr etildi!');
  };

  const sections = [
    { id: 'structure', label: 'Test tuzilmasi', icon: 'ListBulletIcon' },
    { id: 'editor', label: 'Savol muharriri', icon: 'PencilSquareIcon' },
    { id: 'publish', label: 'Nashr qilish', icon: 'PaperAirplaneIcon' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Ketma-ket test yaratish</h1>
              <p className="text-muted-foreground mt-1">Kurslaringiz uchun professional testlar yarating</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="font-medium hidden sm:inline">Orqaga</span>
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
                    <span className="font-medium">Savol qo'shish</span>
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
              <PublishingPanel
                config={testConfig}
                questions={questions}
                onConfigUpdate={handleConfigUpdate}
                onPublish={handlePublish}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequentialTestBuilderInteractive;