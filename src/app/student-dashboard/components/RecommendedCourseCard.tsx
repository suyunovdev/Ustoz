import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface RecommendedCourse {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  studentsCount: number;
  duration: string;
}

interface RecommendedCourseCardProps {
  course: RecommendedCourse;
}

const RecommendedCourseCard = ({ course }: RecommendedCourseCardProps) => {
  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <AppImage
          src={course.coverImage}
          alt={course.coverImageAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 bg-accent px-3 py-1 rounded-full">
          <span className="text-xs font-medium text-accent-foreground">{course.category}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
        
        <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="StarIcon" size={16} className="text-accent" variant="solid" />
            <span className="font-data">{course.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="UserGroupIcon" size={16} />
            <span className="font-data">{course.studentsCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="ClockIcon" size={16} />
            <span>{course.duration}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-heading font-bold text-primary">
              {course.price === 0 ? 'Bepul' : `${course.price.toLocaleString()} ${course.currency}`}
            </span>
          </div>
          <Link
            href={`/course-marketplace/${course.id}`}
            className="flex items-center space-x-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
          >
            <span className="font-medium">Ko'rish</span>
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecommendedCourseCard;