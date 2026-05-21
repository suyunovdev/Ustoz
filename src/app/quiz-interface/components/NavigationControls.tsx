'use client';

import Icon from '@/components/ui/AppIcon';

interface NavigationControlsProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onReview: () => void;
  onSubmit: () => void;
  isLastQuestion: boolean;
  showReviewButton: boolean;
}

const NavigationControls = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onReview,
  onSubmit,
  isLastQuestion,
  showReviewButton
}: NavigationControlsProps) => {
  return (
    <div className="bg-card rounded-lg shadow-warm p-4">
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-md border-2 border-border text-foreground hover:bg-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="ChevronLeftIcon" size={20} />
          <span className="font-medium">Oldingi</span>
        </button>

        {/* Middle Buttons */}
        <div className="flex items-center space-x-3">
          {showReviewButton && (
            <button
              onClick={onReview}
              className="flex items-center space-x-2 px-4 py-2 rounded-md border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground transition-smooth"
            >
              <Icon name="DocumentCheckIcon" size={20} />
              <span className="font-medium">Ko\'rib chiqish</span>
            </button>
          )}
          
          {isLastQuestion && (
            <button
              onClick={onSubmit}
              className="flex items-center space-x-2 px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-warm transition-smooth"
            >
              <Icon name="CheckCircleIcon" size={20} />
              <span className="font-medium">Testni yakunlash</span>
            </button>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={isLastQuestion}
          className="flex items-center space-x-2 px-4 py-2 rounded-md border-2 border-border text-foreground hover:bg-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-medium">Keyingi</span>
          <Icon name="ChevronRightIcon" size={20} />
        </button>
      </div>
    </div>
  );
};

export default NavigationControls;