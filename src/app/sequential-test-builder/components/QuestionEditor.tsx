'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

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

interface QuestionEditorProps {
  question: TestQuestion | undefined;
  onQuestionUpdate: (question: TestQuestion) => void;
  onQuestionDelete: (questionId: string) => void;
}

const QuestionEditor = ({ question, onQuestionUpdate, onQuestionDelete }: QuestionEditorProps) => {
  const { t } = useI18n();
  const [localQuestion, setLocalQuestion] = useState<TestQuestion | null>(null);

  useEffect(() => {
    if (question) {
      setLocalQuestion(question);
    }
  }, [question]);

  if (!localQuestion) {
    return (
      <div className="bg-card rounded-md shadow-warm p-12 text-center">
        <Icon name="PencilSquareIcon" size={64} className="text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
          Savol tanlanmagan
        </h3>
        <p className="text-muted-foreground">
          Tahrirlash uchun chap paneldan savolni tanlang
        </p>
      </div>
    );
  }

  const handleChange = (field: keyof TestQuestion, value: any) => {
    const updated = { ...localQuestion, [field]: value };
    setLocalQuestion(updated);
    onQuestionUpdate(updated);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(localQuestion.options || [])];
    newOptions[index] = value;
    handleChange('options', newOptions);
  };

  const questionTypes = [
    { value: 'multiple-choice', label: 'Ko\'p tanlovli', icon: 'ListBulletIcon' },
    { value: 'true-false', label: 'To\'g\'ri/Noto\'g\'ri', icon: 'CheckCircleIcon' },
    { value: 'fill-blank', label: 'Bo\'sh joyni to\'ldirish', icon: 'PencilIcon' },
    { value: 'essay', label: 'Insho', icon: 'DocumentTextIcon' }
  ];

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">{t('testBuilder.questionEditor')}</h3>
          <p className="caption text-muted-foreground">Savol #{localQuestion.order}</p>
        </div>
        <button
          onClick={() => onQuestionDelete(localQuestion.id)}
          className="flex items-center space-x-2 px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-smooth"
        >
          <Icon name="TrashIcon" size={20} />
          <span className="font-medium">{t('common.delete')}</span>
        </button>
      </div>

      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Savol turi
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {questionTypes.map((type) => {
            const isSelected = localQuestion.type === type.value;
            return (
              <button
                key={type.value}
                onClick={() => handleChange('type', type.value)}
                className={`flex flex-col items-center space-y-2 p-4 rounded-md border-2 transition-smooth ${
                  isSelected
                    ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50'
                }`}
              >
                <Icon name={type.icon as any} size={24} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                <span className={`text-sm font-medium text-center ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Savol matni *
        </label>
        <textarea
          value={localQuestion.question}
          onChange={(e) => handleChange('question', e.target.value)}
          placeholder={t("testBuilder.questionPlaceholder")}
          rows={3}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          required
        />
      </div>

      {/* Options (for multiple-choice and true-false) */}
      {(localQuestion.type === 'multiple-choice' || localQuestion.type === 'true-false') && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Javob variantlari *
          </label>
          <div className="space-y-3">
            {localQuestion.type === 'true-false' ? (
              <div className="space-y-2">
                {['To\'g\'ri', 'Noto\'g\'ri'].map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-muted/50 rounded-md">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={localQuestion.correctAnswer === index}
                      onChange={() => handleChange('correctAnswer', index)}
                      className="w-5 h-5 text-primary focus:ring-2 focus:ring-ring"
                    />
                    <span className="font-medium text-foreground">{option}</span>
                  </div>
                ))}
              </div>
            ) : (
              (localQuestion.options || ['', '', '', '']).map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={localQuestion.correctAnswer === index}
                    onChange={() => handleChange('correctAnswer', index)}
                    className="w-5 h-5 text-primary focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Variant ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              ))
            )}
          </div>
          <p className="caption text-muted-foreground mt-2">
            To'g'ri javobni belgilash uchun radio tugmasini bosing
          </p>
        </div>
      )}

      {/* Correct Answer (for fill-blank and essay) */}
      {(localQuestion.type === 'fill-blank' || localQuestion.type === 'essay') && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {localQuestion.type === 'fill-blank' ? 'To\'g\'ri javob *' : 'Namuna javob'}
          </label>
          <textarea
            value={localQuestion.correctAnswer as string}
            onChange={(e) => handleChange('correctAnswer', e.target.value)}
            placeholder={localQuestion.type === 'fill-blank' ? 'To\'g\'ri javobni kiriting' : 'Namuna javobni kiriting (ixtiyoriy)'}
            rows={2}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tushuntirish (ixtiyoriy)
        </label>
        <textarea
          value={localQuestion.explanation}
          onChange={(e) => handleChange('explanation', e.target.value)}
          placeholder="Nima uchun bu javob to'g'ri ekanligini tushuntiring..."
          rows={3}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Ball *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={localQuestion.points}
            onChange={(e) => handleChange('points', parseInt(e.target.value) || 10)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Qiyinlik darajasi *
          </label>
          <select
            value={localQuestion.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="easy">{t('testBuilder.easy')}</option>
            <option value="medium">{t('testBuilder.mediumDiff')}</option>
            <option value="hard">{t('testBuilder.hard')}</option>
          </select>
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Vaqt limiti (soniya)
          </label>
          <input
            type="number"
            min="0"
            value={localQuestion.timeLimit || 0}
            onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || 0)}
            placeholder="0 = cheksiz"
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mavzu
        </label>
        <input
          type="text"
          value={localQuestion.topic}
          onChange={(e) => handleChange('topic', e.target.value)}
          placeholder={t("testBuilder.topicPlaceholder")}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
};

export default QuestionEditor;