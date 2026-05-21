import Icon from '@/components/ui/AppIcon';

interface WelcomeStats {
  coursesCompleted: number;
  certificatesEarned: number;
  currentStreak: number;
}

interface WelcomeSectionProps {
  userName: string;
  stats: WelcomeStats;
}

const WelcomeSection = ({ userName, stats }: WelcomeSectionProps) => {
  return (
    <div className="bg-gradient-to-r from-primary to-secondary rounded-md p-6 md:p-8 text-primary-foreground shadow-warm-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            Xush kelibsiz, {userName}!
          </h1>
          <p className="text-primary-foreground opacity-90">
            O'qishni davom ettiring va yangi bilimlar oling
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary-foreground rounded-md mb-2 mx-auto">
              <Icon name="CheckCircleIcon" size={28} className="text-primary" variant="solid" />
            </div>
            <div className="text-2xl md:text-3xl font-heading font-bold">{stats.coursesCompleted}</div>
            <div className="text-xs md:text-sm opacity-90">Tugallangan</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary-foreground rounded-md mb-2 mx-auto">
              <Icon name="TrophyIcon" size={28} className="text-accent" variant="solid" />
            </div>
            <div className="text-2xl md:text-3xl font-heading font-bold">{stats.certificatesEarned}</div>
            <div className="text-xs md:text-sm opacity-90">Sertifikat</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-primary-foreground rounded-md mb-2 mx-auto">
              <Icon name="FireIcon" size={28} className="text-warning" variant="solid" />
            </div>
            <div className="text-2xl md:text-3xl font-heading font-bold">{stats.currentStreak}</div>
            <div className="text-xs md:text-sm opacity-90">Kun ketma-ket</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;