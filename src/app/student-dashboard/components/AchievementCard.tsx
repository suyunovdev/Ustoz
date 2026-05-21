import Icon from '@/components/ui/AppIcon';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  type: 'certificate' | 'badge' | 'milestone';
}

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const getIconColor = () => {
    switch (achievement.type) {
      case 'certificate':
        return 'text-primary';
      case 'badge':
        return 'text-accent';
      case 'milestone':
        return 'text-success';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-4 bg-muted rounded-md hover:bg-muted/80 transition-smooth">
      <div className={`flex items-center justify-center w-12 h-12 bg-background rounded-md flex-shrink-0 ${getIconColor()}`}>
        <Icon name={achievement.icon as any} size={24} variant="solid" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-heading font-semibold text-foreground mb-0.5 line-clamp-1">
          {achievement.title}
        </h4>
        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
          {achievement.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {achievement.earnedDate}
        </p>
      </div>
    </div>
  );
};

export default AchievementCard;