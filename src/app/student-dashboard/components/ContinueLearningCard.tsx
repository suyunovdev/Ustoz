import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface ContinueLearningCourse {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  coverImageAlt: string;
  progress: number;
  nextTopic: string;
  totalTopics: number;
  completedTopics: number;
}

interface ContinueLearningCardProps {
  course: ContinueLearningCourse;
}

const ContinueLearningCard = ({ course }: ContinueLearningCardProps) => {
  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <AppImage
          src={course.coverImage}
          alt={course.coverImageAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-background px-3 py-1 rounded-full">
          <span className="text-sm font-data font-medium text-foreground">{course.progress}%</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
        
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Jarayon</span>
            <span>{course.completedTopics}/{course.totalTopics} mavzu</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-smooth"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-start space-x-2 mb-4 p-3 bg-muted rounded-md">
          <Icon name="BookOpenIcon" size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Keyingi mavzu:</p>
            <p className="text-sm font-medium text-foreground line-clamp-1">{course.nextTopic}</p>
          </div>
        </div>
        
        <Link
          href={`/learning-interface?courseId=${course.id}`}
          className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
        >
          <span className="font-medium">Davom ettirish</span>
          <Icon name="ArrowRightIcon" size={18} />
        </Link>
      </div>
    </div>
  );
};

export default ContinueLearningCard;