import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Course {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  coverImageAlt: string;
  progress: number;
  lastAccessed: string;
  totalTopics: number;
  completedTopics: number;
  isCompleted: boolean;
}

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <AppImage
          src={course.coverImage}
          alt={course.coverImageAlt}
          className="w-full h-full object-cover"
        />
        {course.isCompleted && (
          <div className="absolute top-2 right-2 bg-success px-3 py-1 rounded-full flex items-center space-x-1">
            <Icon name="CheckCircleIcon" size={16} className="text-success-foreground" variant="solid" />
            <span className="text-xs font-medium text-success-foreground">Tugallangan</span>
          </div>
        )}
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
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center space-x-1">
            <Icon name="ClockIcon" size={14} />
            <span>Oxirgi kirish: {course.lastAccessed}</span>
          </div>
        </div>
        
        <Link
          href={`/learning-interface?courseId=${course.id}`}
          className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-smooth"
        >
          <span className="font-medium">{course.isCompleted ? "Qayta ko'rish" : "Davom ettirish"}</span>
          <Icon name="ArrowRightIcon" size={18} />
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;