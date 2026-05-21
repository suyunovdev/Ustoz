'use client';

interface ProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
}

const ProgressIndicator = ({
  currentQuestion,
  totalQuestions,
  answeredCount,
  flaggedCount
}: ProgressIndicatorProps) => {
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-sm text-muted-foreground">
              Javoblangan: <span className="font-medium text-foreground">{answeredCount}/{totalQuestions}</span>
            </span>
          </div>
          {flaggedCount > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-warning rounded-full" />
              <span className="text-sm text-muted-foreground">
                Belgilangan: <span className="font-medium text-foreground">{flaggedCount}</span>
              </span>
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {Math.round(progressPercentage)}% bajarildi
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-smooth"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;