'use client';

import Icon from '@/components/ui/AppIcon';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
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

interface QuestionReviewPanelProps {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  currentQuestionIndex: number;
  onGoToQuestion: (index: number) => void;
}

const QuestionReviewPanel = ({
  questions,
  answers,
  currentQuestionIndex,
  onGoToQuestion
}: QuestionReviewPanelProps) => {
  return (
    <div className="bg-card rounded-lg shadow-warm-md p-6 sticky top-24">
      <h3 className="text-lg font-heading font-bold text-foreground mb-4">
        Savollar ro\'yxati
      </h3>

      {/* Legend */}
      <div className="space-y-2 mb-4 pb-4 border-b border-border">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-medium">1</div>
          <span className="text-muted-foreground">Joriy savol</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-8 h-8 rounded-md bg-success/20 border-2 border-success flex items-center justify-center text-success font-medium">2</div>
          <span className="text-muted-foreground">Javoblangan</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-8 h-8 rounded-md bg-warning/20 border-2 border-warning flex items-center justify-center text-warning font-medium">
            <Icon name="FlagIcon" size={16} variant="solid" />
          </div>
          <span className="text-muted-foreground">Belgilangan</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-8 h-8 rounded-md border-2 border-border flex items-center justify-center text-muted-foreground font-medium">3</div>
          <span className="text-muted-foreground">Javoblanmagan</span>
        </div>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const answer = answers[index];
          const isCurrent = index === currentQuestionIndex;
          const isAnswered = answer?.answer !== null && answer?.answer !== '';
          const isFlagged = answer?.flagged;

          return (
            <button
              key={question.id}
              onClick={() => onGoToQuestion(index)}
              className={`relative w-full aspect-square rounded-md flex items-center justify-center font-medium transition-smooth ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-warm'
                  : isFlagged
                  ? 'bg-warning/20 border-2 border-warning text-warning hover:bg-warning/30'
                  : isAnswered
                  ? 'bg-success/20 border-2 border-success text-success hover:bg-success/30' :'border-2 border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {isFlagged && !isCurrent ? (
                <Icon name="FlagIcon" size={16} variant="solid" />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jami savollar:</span>
          <span className="font-medium text-foreground">{questions.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Javoblangan:</span>
          <span className="font-medium text-success">
            {answers.filter(a => a.answer !== null && a.answer !== '').length}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Javoblanmagan:</span>
          <span className="font-medium text-destructive">
            {answers.filter(a => a.answer === null || a.answer === '').length}
          </span>
        </div>
        {answers.filter(a => a.flagged).length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Belgilangan:</span>
            <span className="font-medium text-warning">
              {answers.filter(a => a.flagged).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionReviewPanel;