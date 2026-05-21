import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    thumbnail: string;
    thumbnailAlt: string;
    enrolledStudents: number;
    status: 'approved' | 'pending' | 'rejected';
    revenue: number;
    rating: number;
    totalRatings: number;
  };
  onEdit: () => void;
  onPreview: () => void;
  onAnalytics: () => void;
  onDuplicate: () => void;
}

const CourseCard = ({ course, onEdit, onPreview, onAnalytics, onDuplicate }: CourseCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Tasdiqlangan';
      case 'pending':
        return 'Kutilmoqda';
      case 'rejected':
        return 'Rad etilgan';
      default:
        return status;
    }
  };

  return (
    <div className="bg-card rounded-md shadow-warm overflow-hidden transition-smooth hover:shadow-warm-md">
      <div className="relative h-48 overflow-hidden">
        <AppImage
          src={course.thumbnail}
          alt={course.thumbnailAlt}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium caption ${getStatusColor(course.status)}`}>
            {getStatusLabel(course.status)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-3 line-clamp-2">
          {course.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Icon name="UserGroupIcon" size={16} />
              <span>{course.enrolledStudents} talaba</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="StarIcon" size={16} className="text-accent" variant="solid" />
              <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({course.totalRatings})</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="CurrencyDollarIcon" size={16} className="text-success" />
            <span className="font-medium text-foreground">${course.revenue.toLocaleString()}</span>
            <span className="text-muted-foreground">daromad</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-md transition-smooth hover:bg-primary/90"
          >
            <Icon name="PencilIcon" size={16} />
            <span className="text-sm font-medium">Tahrirlash</span>
          </button>
          
          <button
            onClick={onPreview}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-muted text-foreground rounded-md transition-smooth hover:bg-muted/80"
          >
            <Icon name="EyeIcon" size={16} />
            <span className="text-sm font-medium">Ko'rish</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={onAnalytics}
            className="flex items-center justify-center space-x-2 px-3 py-2 border border-border text-foreground rounded-md transition-smooth hover:bg-muted"
          >
            <Icon name="ChartBarIcon" size={16} />
            <span className="text-sm font-medium">Tahlil</span>
          </button>
          
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center space-x-2 px-3 py-2 border border-border text-foreground rounded-md transition-smooth hover:bg-muted"
          >
            <Icon name="DocumentDuplicateIcon" size={16} />
            <span className="text-sm font-medium">Nusxa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;