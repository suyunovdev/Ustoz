'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

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

interface GroupBalancingPanelProps {
  selectedStudents: Student[];
  balancingStrategy: 'performance' | 'random' | 'manual';
  onStrategyChange: (strategy: 'performance' | 'random' | 'manual') => void;
}

const GroupBalancingPanel = ({
  selectedStudents,
  balancingStrategy,
  onStrategyChange
}: GroupBalancingPanelProps) => {
  const { t } = useI18n();
  // Calculate distribution
  const highPerformers = selectedStudents.filter((s) => s.performance === 'high');
  const mediumPerformers = selectedStudents.filter((s) => s.performance === 'medium');
  const lowPerformers = selectedStudents.filter((s) => s.performance === 'low');

  const total = selectedStudents.length;
  const highPercent = total > 0 ? Math.round((highPerformers.length / total) * 100) : 0;
  const mediumPercent = total > 0 ? Math.round((mediumPerformers.length / total) * 100) : 0;
  const lowPercent = total > 0 ? Math.round((lowPerformers.length / total) * 100) : 0;

  // Ideal distribution: 30% high, 50% medium, 20% low
  const idealHigh = 30;
  const idealMedium = 50;
  const idealLow = 20;

  const getBalanceStatus = () => {
    const highDiff = Math.abs(highPercent - idealHigh);
    const mediumDiff = Math.abs(mediumPercent - idealMedium);
    const lowDiff = Math.abs(lowPercent - idealLow);
    const totalDiff = highDiff + mediumDiff + lowDiff;

    if (totalDiff <= 15) {
      return {
        status: 'excellent',
        label: 'Ajoyib muvozanat',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: 'CheckCircleIcon' as const,
        message: 'Guruh ideal nisbatda muvozanatlangan. O\'quvchilar bir-birlariga samarali yordam berishlari mumkin.'
      };
    } else if (totalDiff <= 30) {
      return {
        status: 'good',
        label: 'Yaxshi muvozanat',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: 'InformationCircleIcon' as const,
        message: 'Guruh yaxshi muvozanatlangan. Kichik o\'zgarishlar qilishingiz mumkin.'
      };
    } else if (totalDiff <= 50) {
      return {
        status: 'fair',
        label: 'Qoniqarli muvozanat',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: 'ExclamationTriangleIcon' as const,
        message: 'Guruh muvozanati qoniqarli, lekin yaxshilash tavsiya etiladi. Ba\'zi o\'quvchilarni almashtiring.'
      };
    } else {
      return {
        status: 'poor',
        label: 'Nomuvozanat',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: 'XCircleIcon' as const,
        message: 'Guruh nomuvozanat. Turli darajadagi o\'quvchilarni qo\'shing yoki olib tashlang.'
      };
    }
  };

  const balanceStatus = getBalanceStatus();

  const averageScore = total > 0
    ? Math.round(selectedStudents.reduce((sum, s) => sum + s.averageScore, 0) / total)
    : 0;

  const averageAttendance = total > 0
    ? Math.round(selectedStudents.reduce((sum, s) => sum + s.attendance, 0) / total)
    : 0;

  return (
    <div className="space-y-6">
      {/* Balance Status Card */}
      <div className={`rounded-lg p-5 border-2 ${balanceStatus.bgColor} ${balanceStatus.borderColor}`}>
        <div className="flex items-start space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${balanceStatus.bgColor}`}>
            <Icon name={balanceStatus.icon} size={24} className={balanceStatus.color} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-1 ${balanceStatus.color}`}>
              {balanceStatus.label}
            </h3>
            <p className="text-sm text-foreground">{balanceStatus.message}</p>
          </div>
        </div>
      </div>

      {/* Distribution Visualization */}
      <div className="bg-card rounded-md border border-border p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          O'quvchilar taqsimoti
        </h3>

        {/* Visual Bar */}
        <div className="mb-6">
          <div className="flex h-12 rounded-md overflow-hidden">
            {highPercent > 0 && (
              <div
                className="bg-green-500 flex items-center justify-center text-white text-sm font-bold transition-all duration-300"
                style={{ width: `${highPercent}%` }}
              >
                {highPercent}%
              </div>
            )}
            {mediumPercent > 0 && (
              <div
                className="bg-yellow-500 flex items-center justify-center text-white text-sm font-bold transition-all duration-300"
                style={{ width: `${mediumPercent}%` }}
              >
                {mediumPercent}%
              </div>
            )}
            {lowPercent > 0 && (
              <div
                className="bg-red-500 flex items-center justify-center text-white text-sm font-bold transition-all duration-300"
                style={{ width: `${lowPercent}%` }}
              >
                {lowPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Distribution Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* High Performers */}
          <div className="bg-green-500/10 rounded-md p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Icon name="ArrowUpIcon" size={16} className="text-white" />
                </div>
                <span className="font-semibold text-foreground">{t('groups.high')}</span>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {highPerformers.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('groups.current')}</span>
                <span className="font-semibold text-foreground">{highPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('groups.ideal')}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{idealHigh}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('groups.difference')}</span>
                <span className={`font-semibold ${
                  Math.abs(highPercent - idealHigh) <= 5
                    ? 'text-green-600 dark:text-green-400' :'text-amber-600 dark:text-amber-400'
                }`}>
                  {highPercent > idealHigh ? '+' : ''}{highPercent - idealHigh}%
                </span>
              </div>
            </div>
          </div>

          {/* Medium Performers */}
          <div className="bg-yellow-500/10 rounded-md p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Icon name="MinusIcon" size={16} className="text-white" />
                </div>
                <span className="font-semibold text-foreground">{t('groups.medium')}</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {mediumPerformers.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hozirgi:</span>
                <span className="font-semibold text-foreground">{mediumPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ideal:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{idealMedium}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Farq:</span>
                <span className={`font-semibold ${
                  Math.abs(mediumPercent - idealMedium) <= 5
                    ? 'text-green-600 dark:text-green-400' :'text-amber-600 dark:text-amber-400'
                }`}>
                  {mediumPercent > idealMedium ? '+' : ''}{mediumPercent - idealMedium}%
                </span>
              </div>
            </div>
          </div>

          {/* Low Performers */}
          <div className="bg-red-500/10 rounded-md p-4 border border-red-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Icon name="ArrowDownIcon" size={16} className="text-white" />
                </div>
                <span className="font-semibold text-foreground">{t('groups.low')}</span>
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {lowPerformers.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hozirgi:</span>
                <span className="font-semibold text-foreground">{lowPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ideal:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{idealLow}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Farq:</span>
                <span className={`font-semibold ${
                  Math.abs(lowPercent - idealLow) <= 5
                    ? 'text-green-600 dark:text-green-400' :'text-amber-600 dark:text-amber-400'
                }`}>
                  {lowPercent > idealLow ? '+' : ''}{lowPercent - idealLow}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Statistics */}
      <div className="bg-card rounded-md border border-border p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Guruh statistikasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="UserGroupIcon" size={20} className="text-primary" />
              <span className="text-sm text-muted-foreground">{t('groups.totalStudents')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{total}</p>
          </div>
          <div className="bg-muted rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="ChartBarIcon" size={20} className="text-primary" />
              <span className="text-sm text-muted-foreground">{t('groups.avgScore')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{averageScore}%</p>
          </div>
          <div className="bg-muted rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="CalendarIcon" size={20} className="text-primary" />
              <span className="text-sm text-muted-foreground">{t('groups.avgAttendance')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{averageAttendance}%</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {balanceStatus.status !== 'excellent' && (
        <div className="bg-blue-500/10 rounded-md p-5 border border-blue-500/30">
          <div className="flex items-start space-x-3">
            <Icon name="LightBulbIcon" size={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground mb-2">{t('groups.recommendations')}</h4>
              <ul className="space-y-2 text-sm text-foreground">
                {highPercent < idealHigh - 5 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 dark:text-green-400 flex-shrink-0">•</span>
                    <span>
                      Yana <strong>{Math.ceil((idealHigh - highPercent) * total / 100)}</strong> ta yuqori natijali o'quvchi qo'shing
                    </span>
                  </li>
                )}
                {highPercent > idealHigh + 5 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">•</span>
                    <span>
                      <strong>{Math.ceil((highPercent - idealHigh) * total / 100)}</strong> ta yuqori natijali o'quvchini boshqa guruhga o'tkazing
                    </span>
                  </li>
                )}
                {mediumPercent < idealMedium - 5 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 dark:text-yellow-400 flex-shrink-0">•</span>
                    <span>
                      Yana <strong>{Math.ceil((idealMedium - mediumPercent) * total / 100)}</strong> ta o'rta natijali o'quvchi qo'shing
                    </span>
                  </li>
                )}
                {lowPercent > idealLow + 5 && (
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600 dark:text-red-400 flex-shrink-0">•</span>
                    <span>
                      Past natijali o'quvchilar ko'p. Ularni bir necha guruhga taqsimlang yoki qo'shimcha yordam bering
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-muted rounded-md p-4">
        <div className="flex items-start space-x-3">
          <Icon name="InformationCircleIcon" size={20} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              <strong>Eslatma:</strong> Muvozanatli guruh o'quvchilarning bir-biridan o'rganishiga yordam beradi. Yuqori natijali o'quvchilar boshqalarga tushuntirish orqali o'z bilimlarini mustahkamlaydi,
              past natijali o'quvchilar esa hamkasblaridan yordam oladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupBalancingPanel;