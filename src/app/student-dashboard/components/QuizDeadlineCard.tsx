import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface QuizDeadline {
  id: string;
  courseTitle: string;
  topicTitle: string;
  dueDate: string;
  daysRemaining: number;
  isUrgent: boolean;
}

interface QuizDeadlineCardProps {
  deadline: QuizDeadline;
}

const QuizDeadlineCard = ({ deadline }: QuizDeadlineCardProps) => {
  return (
    <Link
      href={`/course-learning/${deadline.id}`}
      className="block p-4 bg-card rounded-md border-l-4 border-primary hover:shadow-warm transition-smooth"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-heading font-semibold text-foreground mb-0.5 line-clamp-1">
            {deadline.courseTitle}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {deadline.topicTitle}
          </p>
        </div>
        <Icon name="ClockIcon" size={20} className={deadline.isUrgent ? 'text-warning' : 'text-muted-foreground'} />
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{deadline.dueDate}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          deadline.isUrgent 
            ? 'bg-warning text-warning-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {deadline.daysRemaining} kun qoldi
        </span>
      </div>
    </Link>
  );
};

export default QuizDeadlineCard;