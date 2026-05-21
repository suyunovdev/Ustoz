'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface TestQuestion {
  id: string;
  order: number;
  type: string;
  question: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface TestStructurePanelProps {
  questions: TestQuestion[];
  selectedQuestionId: string | null;
  onQuestionSelect: (questionId: string) => void;
  onQuestionReorder: (questions: TestQuestion[]) => void;
  onAddQuestion: () => void;
}

const TestStructurePanel = ({
  questions,
  selectedQuestionId,
  onQuestionSelect,
  onQuestionReorder,
  onAddQuestion
}: TestStructurePanelProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedQuestion);

    const reorderedQuestions = newQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1
    }));

    onQuestionReorder(reorderedQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-success',
      medium: 'text-warning',
      hard: 'text-destructive'
    };
    return colors[difficulty as keyof typeof colors] || 'text-muted-foreground';
  };

  const getQuestionTypeIcon = (type: string) => {
    const icons = {
      'multiple-choice': 'ListBulletIcon',
      'true-false': 'CheckCircleIcon',
      'fill-blank': 'PencilIcon',
      'essay': 'DocumentTextIcon'
    };
    return icons[type as keyof typeof icons] || 'QuestionMarkCircleIcon';
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="bg-card rounded-md shadow-warm p-4 space-y-4 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">Test tuzilmasi</h3>
          <p className="caption text-muted-foreground">{questions.length} savol • {totalPoints} ball</p>
        </div>
        <button
          onClick={onAddQuestion}
          className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-smooth"
          aria-label="Add question"
        >
          <Icon name="PlusIcon" size={20} />
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Savollar yo'q</p>
            <button
              onClick={onAddQuestion}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
            >
              <Icon name="PlusIcon" size={20} />
              <span className="font-medium">Savol qo'shish</span>
            </button>
          </div>
        ) : (
          questions.map((question, index) => {
            const isSelected = selectedQuestionId === question.id;
            return (
              <div
                key={question.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onQuestionSelect(question.id)}
                className={`p-3 rounded-md border-2 cursor-pointer transition-smooth ${
                  isSelected
                    ? 'border-primary bg-primary/10' :'border-transparent bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="Bars3Icon" size={16} className="text-muted-foreground cursor-move" />
                    <span className="font-data text-sm text-muted-foreground">#{question.order}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name={getQuestionTypeIcon(question.type) as any} size={16} className="text-primary" />
                      <span className={`caption ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty === 'easy' ? 'Oson' : question.difficulty === 'medium' ? 'O\'rta' : 'Qiyin'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {question.question || 'Savol matni yo\'q'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="caption text-muted-foreground">
                        {question.topic || 'Mavzu ko\'rsatilmagan'}
                      </span>
                      <span className="caption font-data text-primary">{question.points} ball</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {questions.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="caption text-muted-foreground">Jami savollar</span>
            <span className="font-data text-sm text-foreground">{questions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="caption text-muted-foreground">Jami ball</span>
            <span className="font-data text-sm text-primary">{totalPoints}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestStructurePanel;