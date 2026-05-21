import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface RelatedCoursesProps {
  currentCourseId: string;
}

const RelatedCourses = ({ currentCourseId }: RelatedCoursesProps) => {
  const relatedCourses = [
  {
    id: '2',
    title: 'React.js: Zamonaviy Web Ilovalar',
    instructor: 'Aziz Rahimov',
    coverImage: "https://img.rocket.new/generatedImages/rocket_gen_img_1e96a65dc-1767722347351.png",
    coverImageAlt: 'React logo with modern web development tools on desk',
    rating: 4.9,
    price: 59,
    students: 8500
  },
  {
    id: '3',
    title: 'Node.js Backend Dasturlash',
    instructor: 'Aziz Rahimov',
    coverImage: "https://img.rocket.new/generatedImages/rocket_gen_img_153fb131f-1765864438603.png",
    coverImageAlt: 'Server room with Node.js backend architecture diagram',
    rating: 4.7,
    price: 54,
    students: 6200
  },
  {
    id: '4',
    title: 'TypeScript Professional',
    instructor: 'Dilshod Karimov',
    coverImage: "https://img.rocket.new/generatedImages/rocket_gen_img_10af01abc-1768238504170.png",
    coverImageAlt: 'TypeScript code on multiple monitors in modern office',
    rating: 4.8,
    price: 49,
    students: 5400
  }];


  return (
    <div className="mt-12">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">O\'xshash kurslar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedCourses.map((course) =>
        <Link
          key={course.id}
          href={`/course-details/${course.id}`}
          className="bg-card rounded-md shadow-warm hover:shadow-warm-lg transition-smooth overflow-hidden group">

            <div className="relative h-40 overflow-hidden">
              <AppImage
              src={course.coverImage}
              alt={course.coverImageAlt}
              className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />

            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-heading font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-smooth">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground">{course.instructor}</p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Icon name="StarIcon" size={14} variant="solid" className="text-accent" />
                  <span className="text-sm font-data">{course.rating}</span>
                  <span className="text-xs text-muted-foreground">({course.students.toLocaleString()})</span>
                </div>
                <span className="text-lg font-heading font-bold text-primary">${course.price}</span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>);

};

export default RelatedCourses;