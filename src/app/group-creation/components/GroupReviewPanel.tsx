'use client';

import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  performance: 'high' | 'medium' | 'low';
  attendance: number;
  averageScore: number;
  enrolledCourses: string[];
}

interface GroupMetadata {
  name: string;
  description: string;
  courseId: string;
  maxStudents: number;
  balancingStrategy: 'performance' | 'random' | 'manual';
}

interface GroupReviewPanelProps {
  metadata: GroupMetadata;
  selectedStudents: Student[];
}

const GroupReviewPanel = ({ metadata, selectedStudents }: GroupReviewPanelProps) => {
  const mockCourses = [
    { id: '1', name: 'Matematika - 9-sinf' },
    { id: '2', name: 'Fizika - 10-sinf' },
    { id: '3', name: 'Kimyo - 11-sinf' },
    { id: '4', name: 'Ingliz tili - Boshlang\'ich' },
    { id: '5', name: 'Dasturlash - Python' }
  ];

  const selectedCourse = mockCourses.find((c) => c.id === metadata.courseId);

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'performance':
        return 'Natijaga ko\'ra';
      case 'random':
        return 'Tasodifiy';
      case 'manual':
        return 'Qo\'lda';
      default:
        return strategy;
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'high':
        return {
          label: 'Yuqori',
          color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
        };
      case 'medium':
        return {
          label: 'O\'rta',
          color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
        };
      case 'low':
        return {
          label: 'Past',
          color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
        };
      default:
        return { label: '', color: '' };
    }
  };

  const highPerformers = selectedStudents.filter((s) => s.performance === 'high').length;
  const mediumPerformers = selectedStudents.filter((s) => s.performance === 'medium').length;
  const lowPerformers = selectedStudents.filter((s) => s.performance === 'low').length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/30">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="UserGroupIcon" size={28} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{metadata.name}</h2>
            {metadata.description && (
              <p className="text-muted-foreground mb-3">{metadata.description}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-background/50 rounded-md px-3 py-1.5">
                <Icon name="BookOpenIcon" size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{selectedCourse?.name || 'Kurs tanlanmagan'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-background/50 rounded-md px-3 py-1.5">
                <Icon name="UserGroupIcon" size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{selectedStudents.length} o'quvchi</span>
              </div>
              <div className="flex items-center space-x-2 bg-background/50 rounded-md px-3 py-1.5">
                <Icon name="ScaleIcon" size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{getStrategyLabel(metadata.balancingStrategy)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Composition */}
      <div className="bg-card rounded-md border border-border p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Guruh tarkibi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-500/10 rounded-md p-4 border border-green-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Yuqori natijali</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{highPerformers}</span>
            </div>
          </div>
          <div className="bg-yellow-500/10 rounded-md p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">O'rta natijali</span>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{mediumPerformers}</span>
            </div>
          </div>
          <div className="bg-red-500/10 rounded-md p-4 border border-red-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Past natijali</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{lowPerformers}</span>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {selectedStudents.map((student, index) => {
            const badge = getPerformanceBadge(student.performance);
            return (
              <div
                key={student.id}
                className="flex items-center space-x-4 p-3 bg-muted rounded-md"
              >
                <span className="text-sm font-medium text-muted-foreground w-8">{index + 1}.</span>
                <AppImage
                  src={student.avatar}
                  alt={`${student.name} avatar`}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">{student.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Ball</p>
                    <p className="text-sm font-semibold text-foreground">{student.averageScore}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Davomat</p>
                    <p className="text-sm font-semibold text-foreground">{student.attendance}%</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Summary */}
      <div className="bg-card rounded-md border border-border p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Sozlamalar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Icon name="AdjustmentsHorizontalIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Maksimal o'quvchilar</p>
              <p className="text-lg font-bold text-primary">{metadata.maxStudents} ta</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Icon name="ScaleIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Muvozanatlash</p>
              <p className="text-lg font-bold text-primary">{getStrategyLabel(metadata.balancingStrategy)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final Check */}
      <div className="bg-blue-500/10 rounded-md p-5 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <Icon name="InformationCircleIcon" size={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-2">Yakuniy tekshiruv</h4>
            <ul className="space-y-1 text-sm text-foreground">
              <li className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={16} className="text-green-500" />
                <span>Guruh nomi va tavsif to'g'ri</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={16} className="text-green-500" />
                <span>Kurs tanlangan</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={16} className="text-green-500" />
                <span>O'quvchilar tanlangan ({selectedStudents.length} ta)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="CheckCircleIcon" size={16} className="text-green-500" />
                <span>Muvozanatlash strategiyasi belgilangan</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Barcha ma'lumotlar to'g'ri bo'lsa, "Guruhni Saqlash" tugmasini bosing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupReviewPanel;