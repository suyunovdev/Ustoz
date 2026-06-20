'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

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

interface QuizConfig {
  title: string;
  description: string;
  totalQuestions: number;
  totalPoints: number;
  timeLimit: number;
  passingScore: number;
}

interface ResultsScreenProps {
  results: {
    correctCount: number;
    totalQuestions: number;
    totalPoints: number;
    maxPoints: number;
    percentage: number;
    passed: boolean;
    topicScores: { [key: string]: { correct: number; total: number } };
  };
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  quizConfig: QuizConfig;
}

const ResultsScreen = ({ results, questions, answers, quizConfig }: ResultsScreenProps) => {
  const { t } = useI18n();
  const router = useRouter();

  const getAnswerDisplay = (question: QuizQuestion, userAnswer: string | number | null) => {
    if (question.type === 'multiple-choice' && question.options) {
      return question.options[userAnswer as number] || t('learning.notAnswered');
    }
    if (question.type === 'true-false') {
      return userAnswer === 0 ? 'To\'g\'ri' : userAnswer === 1 ? 'Noto\'g\'ri' : 'Javob berilmagan';
    }
    return userAnswer || 'Javob berilmagan';
  };

  const getCorrectAnswerDisplay = (question: QuizQuestion) => {
    if (question.type === 'multiple-choice' && question.options) {
      return question.options[question.correctAnswer as number];
    }
    if (question.type === 'true-false') {
      return question.correctAnswer === 0 ? 'To\'g\'ri' : 'Noto\'g\'ri';
    }
    return question.correctAnswer;
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Results Header */}
        <div className={`rounded-lg shadow-warm-lg p-8 mb-8 ${
          results.passed ? 'bg-gradient-to-br from-success/10 to-success/5' : 'bg-gradient-to-br from-destructive/10 to-destructive/5'
        }`}>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              results.passed ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
            }`}>
              <Icon name={results.passed ? 'CheckCircleIcon' : 'XCircleIcon'} size={48} variant="solid" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              {results.passed ? t('learning.congratsExcl') : t('learning.testFinished')}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {results.passed 
                ? 'Siz testdan muvaffaqiyatli o\'tdingiz!' :'Afsuski, o\'tish ballini to\'play olmadingiz.'}
            </p>
            
            {/* Score Display */}
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div>
                <div className="text-5xl font-bold text-foreground">{Math.round(results.percentage)}%</div>
                <div className="text-sm text-muted-foreground">{t('learning.result')}</div>
              </div>
              <div className="h-16 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">{results.totalPoints}/{results.maxPoints}</div>
                <div className="text-sm text-muted-foreground">{t('learning.score')}</div>
              </div>
              <div className="h-16 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">{results.correctCount}/{results.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">{t('learning.correctAnswer')}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => router.push('/student-dashboard')}
                className="flex items-center space-x-2 px-6 py-3 rounded-md border-2 border-border text-foreground hover:bg-muted transition-smooth"
              >
                <Icon name="HomeIcon" size={20} />
                <span className="font-medium">{t('learning.homePage')}</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-warm transition-smooth"
              >
                <Icon name="ArrowPathIcon" size={20} />
                <span className="font-medium">{t('learning.retakeTest')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        <div className="bg-card rounded-lg shadow-warm-md p-6 mb-8">
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            Mavzular bo\'yicha natijalar
          </h2>
          <div className="space-y-4">
            {Object.entries(results.topicScores).map(([topic, scores]) => {
              const percentage = (scores.correct / scores.total) * 100;
              return (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{topic}</span>
                    <span className="text-sm text-muted-foreground">
                      {scores.correct}/{scores.total} to\'g\'ri ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all ${
                        percentage >= 80 ? 'bg-success' : percentage >= 60 ? 'bg-warning' : 'bg-destructive'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Answers */}
        <div className="bg-card rounded-lg shadow-warm-md p-6">
          <h2 className="text-xl font-heading font-bold text-foreground mb-6">
            Batafsil javoblar
          </h2>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = answers[index];
              const isCorrect = answer?.answer === question.correctAnswer;
              const userAnswerDisplay = getAnswerDisplay(question, answer?.answer || null);
              const correctAnswerDisplay = getCorrectAnswerDisplay(question);

              return (
                <div key={question.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}>
                      <Icon name={isCorrect ? 'CheckIcon' : 'XMarkIcon'} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-foreground">{t('learning.question')} {index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                          {question.topic}
                        </span>
                      </div>
                      <p className="text-foreground mb-3">{question.question}</p>
                      
                      <div className="space-y-2">
                        <div className={`p-3 rounded-md ${
                          isCorrect ? 'bg-success/10' : 'bg-destructive/10'
                        }`}>
                          <span className="text-sm font-medium text-muted-foreground">{t('learning.yourAnswer')} </span>
                          <span className={`text-sm font-medium ${
                            isCorrect ? 'text-success' : 'text-destructive'
                          }`}>
                            {userAnswerDisplay}
                          </span>
                        </div>
                        
                        {!isCorrect && (
                          <div className="p-3 rounded-md bg-success/10">
                            <span className="text-sm font-medium text-muted-foreground">{t('learning.correctAnswerLabel')} </span>
                            <span className="text-sm font-medium text-success">
                              {correctAnswerDisplay}
                            </span>
                          </div>
                        )}
                      </div>

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <div className="flex items-start space-x-2">
                            <Icon name="InformationCircleIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium text-foreground block mb-1">{t('learning.explanation')}</span>
                              <p className="text-sm text-muted-foreground">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;