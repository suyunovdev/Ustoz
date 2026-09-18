'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

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
}

// Eslatma: savollar endi ALOHIDA saqlanmaydi — kurs (yoki qoralama) saqlanganda
// avtomatik yoziladi (course-quiz-sync). Ilgari qo'lda "Testni saqlash" tugmasi bor
// edi, u courseId/topicId talab qilib ko'pincha jimgina ishlamasdi.
const QuizBuilder = ({ questions, onQuestionsChange, topicTitle }: QuizBuilderProps) => {
  const { t } = useI18n();
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

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

  const canAddMore = questions.length < 15;
  const meetsMinimum = questions.length >= 3;

  return (
    <div className="space-y-4">
      {/* Slim header — hisob + qo'shish (modal joyni beradi, katta karta/qo'llanma yo'q) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
            meetsMinimum ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
          }`}
        >
          <Icon name={meetsMinimum ? 'CheckCircleIcon' : 'ExclamationTriangleIcon'} size={16} />
          <span>
            {questions.length} / 3-15 {t('courseCreation.questionsCount')}
          </span>
        </div>
        <button
          type="button"
          onClick={addQuestion}
          disabled={!canAddMore}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-smooth ${
            canAddMore
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          aria-label={t('courseCreation.addQuestion')}
        >
          <Icon name="PlusIcon" size={18} />
          <span className="font-medium">{t('courseCreation.addQuestion')}</span>
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-md">
            <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('courseCreation.noQuestionsYet')}</p>
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
                      {question.question || t('courseCreation.untitledQuestion')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(question.id);
                      }}
                      className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-smooth"
                      aria-label={t('courseCreation.deleteQuestion')}
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
                      <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.questionLabel')}</label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        placeholder={t('courseCreation.questionPlaceholder')}
                        rows={2}
                        className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.answerOptions')}</label>
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
                              placeholder={`${t('courseCreation.optionPlaceholder')} ${optIndex + 1}`}
                              className="flex-1 px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="caption text-muted-foreground mt-2">{t('courseCreation.correctAnswerHint')}</p>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.explanationOptional')}</label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                        placeholder={t('courseCreation.explanationPlaceholder')}
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