import Icon from '@/components/ui/AppIcon';

interface WelcomeSectionProps {
  userName: string;
  stats: {
    coursesCompleted: number;
    certificatesEarned: number;
    streak: {
      current: number;
      longest: number;
      activeToday: boolean;
    };
    enrolledCount?: number;
  };
}

/**
 * Streak rang darajasi:
 *   0          → muted (oddiy ko'rinish)
 *   1–6        → warning (sariq-to'q sariq)
 *   7–29       → accent (yorqin to'q sariq + flame)
 *   30+        → gradient (qizil-to'q sariq + special badge)
 */
function getStreakStyle(current: number): { bg: string; iconColor: string; badge?: string } {
  if (current === 0) {
    return { bg: 'bg-primary-foreground', iconColor: 'text-muted-foreground' };
  }
  if (current < 7) {
    return { bg: 'bg-primary-foreground', iconColor: 'text-warning' };
  }
  if (current < 30) {
    return { bg: 'bg-primary-foreground', iconColor: 'text-accent-foreground' };
  }
  return {
    bg: 'bg-gradient-to-br from-warning via-accent to-destructive',
    iconColor: 'text-primary-foreground',
    badge: 'Mahoratli o\'quvchi',
  };
}

const WelcomeSection = ({ userName, stats }: WelcomeSectionProps) => {
  const hasNoEnrollments = stats.enrolledCount === 0;
  const streakStyle = getStreakStyle(stats.streak.current);
  const streakLabel = stats.streak.current === 0
    ? 'Kun ketma-ket'
    : stats.streak.current === 1
    ? 'Kun'
    : 'Kun ketma-ket';

  return (
    <div className="bg-gradient-to-r from-primary to-secondary rounded-md p-6 md:p-8 text-primary-foreground shadow-warm-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            Xush kelibsiz, {userName}!
          </h1>
          <p className="text-primary-foreground opacity-90">
            {hasNoEnrollments
              ? "Bugun birinchi kursingizni boshlang! 🚀"
              : stats.streak.activeToday
              ? "Bugun ham faolligingizni davom ettiring!"
              : "O'qishni davom ettiring va yangi bilimlar oling"}
          </p>
          {streakStyle.badge && (
            <span className="inline-block mt-2 px-3 py-1 bg-primary-foreground/20 text-primary-foreground text-xs font-semibold rounded-full uppercase tracking-wider">
              ⚡ {streakStyle.badge}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-6">
          {/* Tugatilgan kurslar */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary-foreground rounded-md mb-2 mx-auto">
              <Icon name="CheckCircleIcon" size={28} className="text-primary" variant="solid" />
            </div>
            <div className="text-2xl md:text-3xl font-heading font-bold">{stats.coursesCompleted}</div>
            <div className="text-xs md:text-sm opacity-90">Tugallangan</div>
          </div>

          {/* Sertifikatlar */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary-foreground rounded-md mb-2 mx-auto">
              <Icon name="TrophyIcon" size={28} className="text-accent" variant="solid" />
            </div>
            <div className="text-2xl md:text-3xl font-heading font-bold">{stats.certificatesEarned}</div>
            <div className="text-xs md:text-sm opacity-90">Sertifikat</div>
          </div>

          {/* Streak — real qiymat, hover'da longest */}
          <div
            className="text-center group relative cursor-help"
            title={`Eng uzun streak: ${stats.streak.longest} kun`}
          >
            <div
              className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-md mb-2 mx-auto transition-all ${streakStyle.bg}`}
            >
              <Icon
                name="FireIcon"
                size={28}
                className={streakStyle.iconColor}
                variant="solid"
              />
            </div>
            <div className="text-2xl md:text-3xl font-heading font-bold flex items-center justify-center gap-1">
              {stats.streak.current > 0 && '🔥'}
              {stats.streak.current}
            </div>
            <div className="text-xs md:text-sm opacity-90">{streakLabel}</div>

            {/* Tooltip — hover (desktop) */}
            {stats.streak.longest > 0 && (
              <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Eng uzun: {stats.streak.longest} kun
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
