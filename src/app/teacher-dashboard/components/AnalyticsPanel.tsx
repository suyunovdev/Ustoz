import Icon from '@/components/ui/AppIcon';
import RevenueChart from './RevenueChart';

interface AnalyticsPanelProps {
  revenueData: Array<{
    month: string;
    revenue: number;
    payout: number;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    revenue: number;
    completionRate: number;
  }>;
  studentEngagement: {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
  };
}

const AnalyticsPanel = ({ revenueData, topCourses, studentEngagement }: AnalyticsPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <RevenueChart data={revenueData} />

      {/* Student Engagement */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-6">Talabalar faolligi</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="UserGroupIcon" size={20} className="text-primary" />
              <p className="text-sm text-muted-foreground">Jami talabalar</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{studentEngagement.totalStudents}</p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="UserIcon" size={20} className="text-success" />
              <p className="text-sm text-muted-foreground">Faol talabalar</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{studentEngagement.activeStudents}</p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="ChartBarIcon" size={20} className="text-secondary" />
              <p className="text-sm text-muted-foreground">O'rtacha progress</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{studentEngagement.averageProgress}%</p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="AcademicCapIcon" size={20} className="text-accent" />
              <p className="text-sm text-muted-foreground">Tugatish darajasi</p>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{studentEngagement.completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Top Performing Courses */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-6">Eng yaxshi kurslar</h3>
        <div className="space-y-4">
          {topCourses.map((course, index) => (
            <div 
              key={course.id}
              className="flex items-center space-x-4 p-4 border border-border rounded-md hover:bg-muted transition-smooth"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-md font-heading font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-heading font-semibold text-foreground mb-1">{course.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Icon name="UserGroupIcon" size={14} />
                    <span>{course.enrollments} talaba</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="CheckCircleIcon" size={14} />
                    <span>{course.completionRate}% tugatgan</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading font-bold text-foreground">${course.revenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">daromad</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;