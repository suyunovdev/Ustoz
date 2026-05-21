import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface CourseHeroSectionProps {
  course: {
    title: string;
    subtitle: string;
    coverImage: string;
    coverImageAlt: string;
    instructor: {
      name: string;
      image: string;
      imageAlt: string;
      rating: number;
      studentsCount: number;
    };
    rating: number;
    reviewCount: number;
    enrollmentCount: number;
    level: string;
    totalDuration: string;
    lastUpdated: string;
  };
  onPurchase: () => void;
  isPurchasing: boolean;
}

const CourseHeroSection = ({ course, onPurchase, isPurchasing }: CourseHeroSectionProps) => {
  return (
    <div className="bg-card rounded-md shadow-warm-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cover Image */}
        <div className="relative h-64 md:h-auto">
          <AppImage
            src={course.coverImage}
            alt={course.coverImageAlt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Course Info */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-primary bg-opacity-10 text-primary text-sm font-medium rounded-full">
                {course.level}
              </span>
              <span className="text-sm text-muted-foreground">{course.totalDuration}</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground">{course.subtitle}</p>
          </div>

          {/* Instructor */}
          <div className="flex items-center space-x-3 py-3 border-y border-border">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <AppImage
                src={course.instructor.image}
                alt={course.instructor.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">O\'qituvchi</p>
              <p className="font-semibold text-foreground">{course.instructor.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  <Icon name="StarIcon" size={14} variant="solid" className="text-accent" />
                  <span className="text-xs font-data">{course.instructor.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {course.instructor.studentsCount.toLocaleString()} o\'quvchi
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <Icon name="StarIcon" size={18} variant="solid" className="text-accent" />
              <span className="font-data font-semibold">{course.rating}</span>
              <span className="text-sm text-muted-foreground">({course.reviewCount.toLocaleString()})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="UserGroupIcon" size={18} className="text-primary" />
              <span className="text-sm text-muted-foreground">
                {course.enrollmentCount.toLocaleString()} o\'quvchi
              </span>
            </div>
          </div>

          {/* CTA Button - Mobile */}
          <button
            onClick={onPurchase}
            disabled={isPurchasing}
            className="md:hidden w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPurchasing ? 'Yuklanmoqda...' : 'Kursni sotib olish'}
          </button>

          <p className="text-xs text-muted-foreground">
            Oxirgi yangilanish: {new Date(course.lastUpdated).toLocaleDateString('uz-UZ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseHeroSection;