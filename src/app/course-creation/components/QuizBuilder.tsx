'use client';

import { useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onQuestionsChange: (questions: QuizQuestion[]) => void;
  topicTitle: string;
  teacherId: string;
  testId?: string;
}

const QuizBuilder = ({ questions, onQuestionsChange, topicTitle, teacherId, testId }: QuizBuilderProps) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | undefined>(testId);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    onQuestionsChange([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    const updated = questions.map((q) =>
      q.id === id ? { ...q, [field]: value } : q
    );
    onQuestionsChange(updated);
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const updated = questions.map((q) => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    onQuestionsChange(updated);
  };

  const deleteQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  const saveTest = useCallback(async () => {
    if (questions.length < 5 || questions.length > 15 || isSaving) return;

    setIsSaving(true);
    try {
      const letterByIndex = ['A', 'B', 'C', 'D'];
      const payloadQuestions = questions.map((q) => ({
        questionText: q.question,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctAnswer: letterByIndex[q.correctAnswer] || 'A',
        explanation: q.explanation,
      }));

      const res = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          testId: currentTestId,
          title: topicTitle || 'Untitled Test',
          description: `Test for ${topicTitle}`,
          passingScore: 80,
          questions: payloadQuestions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Save failed (${res.status})`);
      }

      const data = await res.json();
      if (data.test?.id) setCurrentTestId(data.test.id);

      alert('Test muvaffaqiyatli saqlandi!');
    } catch (error: any) {
      console.error('Error saving test:', error);
      alert(error.message || 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    } finally {
      setIsSaving(false);
    }
  }, [questions, topicTitle, currentTestId, isSaving]);

  const canAddMore = questions.length < 15;
  const meetsMinimum = questions.length >= 5;

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Test savollari</h3>
          <p className="caption text-muted-foreground mt-1">
            Mavzu: {topicTitle || 'Nomsiz mavzu'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={saveTest}
            disabled={!meetsMinimum || isSaving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth ${
              meetsMinimum && !isSaving
                ? 'bg-success text-success-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Icon name="CheckCircleIcon" size={20} />
            <span className="font-medium">{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
          </button>
          <button
            onClick={addQuestion}
            disabled={!canAddMore}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth ${
              canAddMore
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            aria-label="Add question"
          >
            <Icon name="PlusIcon" size={20} />
            <span className="font-medium">Savol qo'shish</span>
          </button>
        </div>
      </div>

      {/* Step-by-step Guide - NEW */}
      {questions.length === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-5 border-2 border-green-200 dark:border-green-800">
          <h4 className="font-bold text-foreground mb-4 flex items-center space-x-2">
            <Icon name="AcademicCapIcon" size={24} className="text-green-600" />
            <span>Test savoli qanday yaratiladi?</span>
          </h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 rounded-md p-3">
              <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">"Savol qo'shish" tugmasini bosing</p>
                <p className="text-xs text-muted-foreground mt-1">Yangi savol qo'shiladi</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 rounded-md p-3">
              <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Savol matnini yozing</p>
                <p className="text-xs text-muted-foreground mt-1">Masalan: "Pythonda o'zgaruvchi qanday e'lon qilinadi?"</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 rounded-md p-3">
              <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">4 ta javob varianti yozing</p>
                <p className="text-xs text-muted-foreground mt-1">A, B, C, D variantlarini to'ldiring</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 rounded-md p-3">
              <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">4</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">To'g'ri javobni belgilang</p>
                <p className="text-xs text-muted-foreground mt-1">Radio tugmani bosib to'g'ri javobni tanlang</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 rounded-md p-3">
              <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">5</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Izoh yozing (ixtiyoriy)</p>
                <p className="text-xs text-muted-foreground mt-1">Nima uchun bu javob to'g'ri ekanligini tushuntiring</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Info */}
      <div className={`flex items-center space-x-2 p-3 rounded-md ${
        meetsMinimum ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
      }`}>
        <Icon name={meetsMinimum ? 'CheckCircleIcon' : 'ExclamationTriangleIcon'} size={20} />
        <span className="caption">
          {questions.length} / 5-15 savol (Kamida 5 ta savol kerak, o'tish bali 80%)
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-md">
            <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Hali savollar yo'q. Birinchi test savolini qo'shing.</p>
          </div>
        ) : (
          questions.map((question, qIndex) => {
            const isExpanded = expandedQuestion === question.id;
            return (
              <div
                key={question.id}
                className="border border-border rounded-md overflow-hidden"
              >
                {/* Question Header */}
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                  className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-smooth"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="font-data text-sm text-muted-foreground">S{qIndex + 1}</span>
                    <span className="font-medium text-foreground truncate">
                      {question.question || 'Nomsiz savol'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(question.id);
                      }}
                      className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-smooth"
                      aria-label="Delete question"
                    >
                      <Icon name="TrashIcon" size={20} />
                    </button>
                    <Icon
                      name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                      size={20}
                      className="text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Question Content */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Savol *
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        placeholder="Savolingizni kiriting"
                        rows={2}
                        className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        required
                      />
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Javob variantlari *
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => updateQuestion(question.id, 'correctAnswer', optIndex)}
                              className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                              placeholder={`Variant ${optIndex + 1}`}
                              className="flex-1 px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <p className="caption text-muted-foreground mt-2">
                        To'g'ri javobni belgilash uchun radio tugmasini bosing
                      </p>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tushuntirish (ixtiyoriy)
                      </label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                        placeholder="Nima uchun bu javob to'g'ri ekanligini tushuntiring"
                        rows={2}
                        className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuizBuilder;