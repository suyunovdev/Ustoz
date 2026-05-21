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

interface QuestionDisplayProps {
  question: QuizQuestion;
  questionNumber: number;
  answer: string | number | null;
  isFlagged: boolean;
  onAnswerChange: (answer: string | number) => void;
  onFlagToggle: () => void;
}

const QuestionDisplay = ({
  question,
  questionNumber,
  answer,
  isFlagged,
  onAnswerChange,
  onFlagToggle
}: QuestionDisplayProps) => {
  return (
    <div className="bg-card rounded-lg shadow-warm-md p-6 mb-6">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <span className="inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full font-bold">
              {questionNumber}
            </span>
            <div>
              <span className="text-sm text-muted-foreground">Mavzu: {question.topic}</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                  {question.type === 'multiple-choice' && 'Ko\'p variantli'}
                  {question.type === 'true-false' && 'To\'g\'ri/Noto\'g\'ri'}
                  {question.type === 'fill-blank' && 'Bo\'sh joyni to\'ldiring'}
                </span>
                <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-md font-medium">
                  {question.points} ball
                </span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground leading-relaxed">
            {question.question}
          </h3>
        </div>
        <button
          onClick={onFlagToggle}
          className={`ml-4 p-2 rounded-md transition-smooth ${
            isFlagged
              ? 'bg-warning/10 text-warning hover:bg-warning/20' :'text-muted-foreground hover:bg-muted'
          }`}
          title={isFlagged ? 'Belgilangan' : 'Belgilash'}
        >
          <Icon name="FlagIcon" size={20} variant={isFlagged ? 'solid' : 'outline'} />
        </button>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.type === 'multiple-choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = answer === index;
              return (
                <button
                  key={index}
                  onClick={() => onAnswerChange(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-smooth ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-warm'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-primary bg-primary' :'border-border'
                    }`}>
                      {isSelected && (
                        <Icon name="CheckIcon" size={16} className="text-primary-foreground" />
                      )}
                    </div>
                    <span className={`flex-1 ${
                      isSelected ? 'text-foreground font-medium' : 'text-foreground'
                    }`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'true-false' && (
          <div className="grid grid-cols-2 gap-4">
            {['To\'g\'ri', 'Noto\'g\'ri'].map((option, index) => {
              const isSelected = answer === index;
              return (
                <button
                  key={index}
                  onClick={() => onAnswerChange(index)}
                  className={`p-6 rounded-lg border-2 transition-smooth ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-warm'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Icon
                      name={index === 0 ? 'CheckCircleIcon' : 'XCircleIcon'}
                      size={32}
                      className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                      variant={isSelected ? 'solid' : 'outline'}
                    />
                    <span className={`font-medium ${
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'fill-blank' && (
          <div>
            <input
              type="text"
              value={answer as string || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Javobingizni kiriting..."
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-smooth"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              <Icon name="InformationCircleIcon" size={16} className="inline mr-1" />
              Javobni aniq va to\'liq kiriting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDisplay;