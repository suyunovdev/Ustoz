'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface TestQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  orderIndex: number;
}

interface SequentialTestBuilderProps {
  materialId?: string;
  questions: TestQuestion[];
  onQuestionsChange: (questions: TestQuestion[]) => void;
}

const SequentialTestBuilder = ({ materialId, questions, onQuestionsChange }: SequentialTestBuilderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion>({
    id: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    orderIndex: 0
  });
  const [isAdding, setIsAdding] = useState(false);

  const startAddingQuestion = () => {
    setEditingQuestion({
      id: `temp-${Date.now()}`,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      orderIndex: questions.length
    });
    setCurrentStep(0);
    setIsAdding(true);
  };

  const saveQuestion = () => {
    if (!editingQuestion.questionText.trim()) return;
    // Savollar parent ga uzatiladi va parent test'ni butun bo'lib /api/teacher/tests'ga saqlaydi
    const newQuestions = [...questions, editingQuestion];
    onQuestionsChange(newQuestions);
    setIsAdding(false);
    setCurrentStep(0);
  };

  const deleteQuestion = (id: string) => {
    const filtered = questions.filter((q) => q.id !== id);
    onQuestionsChange(filtered);
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return editingQuestion.questionText.trim().length > 0;
      case 1: return editingQuestion.optionA.trim().length > 0;
      case 2: return editingQuestion.optionB.trim().length > 0;
      case 3: return editingQuestion.optionC.trim().length > 0;
      case 4: return editingQuestion.optionD.trim().length > 0;
      case 5: return true;
      case 6: return editingQuestion.explanation.trim().length > 0;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Savol matni</label>
            <textarea
              value={editingQuestion.questionText}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
              placeholder="Savolingizni kiriting..."
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        );
      case 1:
      case 2:
      case 3:
      case 4:
        const optionKey = ['optionA', 'optionB', 'optionC', 'optionD'][currentStep - 1] as keyof TestQuestion;
        const optionLabel = ['A', 'B', 'C', 'D'][currentStep - 1];
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Variant {optionLabel}</label>
            <input
              type="text"
              value={editingQuestion[optionKey] as string}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, [optionKey]: e.target.value })}
              placeholder={`${optionLabel}-variant javobini kiriting...`}
              className="w-full px-4 py-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground mb-3">To'g'ri javobni tanlang</label>
            <div className="grid grid-cols-2 gap-3">
              {['A', 'B', 'C', 'D'].map((option) => (
                <button
                  key={option}
                  onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: option as 'A' | 'B' | 'C' | 'D' })}
                  className={`p-4 rounded-md border-2 transition-smooth ${
                    editingQuestion.correctAnswer === option
                      ? 'border-success bg-success/10 text-success' :'border-border bg-muted/50 text-foreground hover:border-primary'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon
                      name={editingQuestion.correctAnswer === option ? 'CheckCircleIcon' : 'CircleStackIcon'}
                      size={24}
                    />
                    <span className="font-medium text-lg">Variant {option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Tushuntirish</label>
            <textarea
              value={editingQuestion.explanation}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
              placeholder="Nima uchun bu javob to'g'ri ekanligini tushuntiring..."
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const meetsMinimum = questions.length >= 5;
  const canAddMore = questions.length < 15;

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Test Savollari</h3>
          <p className="caption text-muted-foreground mt-1">Ketma-ket savollar qo'shing (5-15 ta)</p>
        </div>
        {!isAdding && (
          <button
            onClick={startAddingQuestion}
            disabled={!canAddMore}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth ${
              canAddMore
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Icon name="PlusIcon" size={20} />
            <span className="font-medium">Savol qo'shish</span>
          </button>
        )}
      </div>

      {/* Requirements Info */}
      <div className={`flex items-center space-x-2 p-3 rounded-md ${
        meetsMinimum ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
      }`}>
        <Icon name={meetsMinimum ? 'CheckCircleIcon' : 'ExclamationTriangleIcon'} size={20} />
        <span className="caption">
          {questions.length} / 5-15 savol (Kamida 5 ta savol talab qilinadi)
        </span>
      </div>

      {/* Question Builder */}
      {isAdding && (
        <div className="border-2 border-primary rounded-lg p-6 space-y-6 bg-primary/5">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[0, 1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-smooth ${
                    step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? <Icon name="CheckIcon" size={16} /> : step + 1}
                </div>
                {step < 6 && (
                  <div
                    className={`w-8 h-1 mx-1 transition-smooth ${
                      step < currentStep ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              Bekor qilish
            </button>
            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
                >
                  <Icon name="ChevronLeftIcon" size={20} />
                  <span>Orqaga</span>
                </button>
              )}
              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth ${
                    canProceed()
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <span>Keyingisi</span>
                  <Icon name="ChevronRightIcon" size={20} />
                </button>
              ) : (
                <button
                  onClick={saveQuestion}
                  disabled={!canProceed()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth ${
                    canProceed()
                      ? 'bg-success text-success-foreground hover:opacity-90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <Icon name="CheckIcon" size={20} />
                  <span>Saqlash</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-md">
            <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Hali savollar qo'shilmagan</p>
            <p className="caption text-muted-foreground">Kamida 5 ta test savoli qo'shing</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <div
              key={question.id}
              className="p-4 bg-muted/50 rounded-md hover:bg-muted transition-smooth"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                      Savol {index + 1}
                    </span>
                    <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
                      To'g'ri: {question.correctAnswer}
                    </span>
                  </div>
                  <p className="font-medium text-foreground mb-2">{question.questionText}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">A) {question.optionA}</p>
                    <p className="text-muted-foreground">B) {question.optionB}</p>
                    <p className="text-muted-foreground">C) {question.optionC}</p>
                    <p className="text-muted-foreground">D) {question.optionD}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-smooth"
                  aria-label="O'chirish"
                >
                  <Icon name="TrashIcon" size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SequentialTestBuilder;