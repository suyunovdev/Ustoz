import Icon from '@/components/ui/AppIcon';

interface CourseSidebarProps {
  course: {
    pricing: {
      usd: number;
      uzs: number;
    };
    language: string;
    lastUpdated: string;
    totalDuration: string;
    enrollmentCount: number;
    hasCertificate: boolean;
  };
  onPurchase: () => void;
  isPurchasing: boolean;
}

const CourseSidebar = ({ course, onPurchase, isPurchasing }: CourseSidebarProps) => {
  return (
    <div className="sticky top-24 space-y-4">
      {/* Pricing Card */}
      <div className="bg-card rounded-md shadow-warm-lg p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-bold text-primary">
              ${course.pricing.usd}
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          <div className="text-lg text-muted-foreground">
            {course.pricing.uzs.toLocaleString()} so\'m
          </div>
        </div>

        <button
          onClick={onPurchase}
          disabled={isPurchasing}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPurchasing ? 'Yuklanmoqda...' : 'Kursni sotib olish'}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          30 kunlik pul qaytarish kafolati
        </p>
      </div>

      {/* Course Info Card */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Kurs ma\'lumotlari</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Icon name="ClockIcon" size={18} />
              <span className="text-sm">Davomiyligi</span>
            </div>
            <span className="text-sm font-medium text-foreground">{course.totalDuration}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Icon name="UserGroupIcon" size={18} />
              <span className="text-sm">O\'quvchilar</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {course.enrollmentCount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Icon name="LanguageIcon" size={18} />
              <span className="text-sm">Til</span>
            </div>
            <span className="text-sm font-medium text-foreground">{course.language}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Icon name="CalendarIcon" size={18} />
              <span className="text-sm">Yangilangan</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {new Date(course.lastUpdated).toLocaleDateString('uz-UZ')}
            </span>
          </div>

          {course.hasCertificate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Icon name="AcademicCapIcon" size={18} />
                <span className="text-sm">Sertifikat</span>
              </div>
              <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success" />
            </div>
          )}
        </div>
      </div>

      {/* Share Card */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Ulashish</h3>
        <div className="flex items-center space-x-2">
          <button className="flex-1 p-2 bg-muted rounded-md hover:bg-muted/80 transition-smooth">
            <Icon name="ShareIcon" size={20} className="mx-auto text-foreground" />
          </button>
          <button className="flex-1 p-2 bg-muted rounded-md hover:bg-muted/80 transition-smooth">
            <Icon name="LinkIcon" size={20} className="mx-auto text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseSidebar;