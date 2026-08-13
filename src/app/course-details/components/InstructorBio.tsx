import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatNumber } from '@/lib/i18n/format';

interface InstructorBioProps {
  instructor: {
    name: string;
    image: string;
    imageAlt: string;
    rating: number;
    studentsCount: number;
    coursesCount: number;
    bio: string;
  };
}

const InstructorBio = ({ instructor }: InstructorBioProps) => {
  const { t, locale } = useI18n();
  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">{t('courseDetails.aboutInstructor')}</h2>

      {/* Instructor Profile */}
      <div className="flex items-start space-x-4">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
          <AppImage
            src={instructor.image}
            alt={instructor.imageAlt}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
            {instructor.name}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon name="StarIcon" size={16} variant="solid" className="text-accent" />
              <span className="text-sm font-data">{instructor.rating} {t('courseDetails.averageRating')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="UserGroupIcon" size={16} className="text-primary" />
              <span className="text-sm">{formatNumber(instructor.studentsCount, locale)} {t('courseDetails.studentsSuffix')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="BookOpenIcon" size={16} className="text-primary" />
              <span className="text-sm">{instructor.coursesCount} {t('courseDetails.courses')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">{t('courseDetails.biography')}</h4>
        <p className="text-foreground leading-relaxed">{instructor.bio}</p>
      </div>

      {/* Other Courses */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">{t('courseDetails.otherCourses')}</h4>
        <div className="space-y-3">
          {[
            { id: '1', title: 'React.js: Zamonaviy Web Ilovalar', students: 8500, rating: 4.9 },
            { id: '2', title: 'Node.js Backend Dasturlash', students: 6200, rating: 4.7 },
            { id: '3', title: 'TypeScript Professional', students: 5400, rating: 4.8 },
          ].map((course) => (
            <div key={course.id} className="p-3 bg-muted rounded-md hover:bg-muted/80 transition-smooth cursor-pointer">
              <h5 className="font-medium text-foreground mb-1">{course.title}</h5>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Icon name="StarIcon" size={12} variant="solid" className="text-accent" />
                  <span>{course.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="UserGroupIcon" size={12} />
                  <span>{formatNumber(course.students, locale)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructorBio;