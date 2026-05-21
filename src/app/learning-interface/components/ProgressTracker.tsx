import Icon from '@/components/ui/AppIcon';

interface Topic {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface Section {
  id: string;
  title: string;
  topics: Topic[];
}

interface ProgressTrackerProps {
  sections: Section[];
  currentTopicId: string;
}

const ProgressTracker = ({ sections, currentTopicId }: ProgressTrackerProps) => {
  const allTopics = sections.flatMap(section => section.topics);
  const completedCount = allTopics.filter(topic => topic.isCompleted).length;
  const totalCount = allTopics.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const calculateTotalDuration = () => {
    let totalSeconds = 0;
    allTopics.forEach(topic => {
      const [minutes, seconds] = topic.duration.split(':').map(Number);
      totalSeconds += minutes * 60 + seconds;
    });
    return totalSeconds;
  };

  const calculateRemainingDuration = () => {
    let remainingSeconds = 0;
    allTopics.forEach(topic => {
      if (!topic.isCompleted) {
        const [minutes, seconds] = topic.duration.split(':').map(Number);
        remainingSeconds += minutes * 60 + seconds;
      }
    });
    return remainingSeconds;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}s ${minutes}d`;
  };

  const totalDuration = calculateTotalDuration();
  const remainingDuration = calculateRemainingDuration();

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icon name="AcademicCapIcon" size={20} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                Jarayon: {completedCount}/{totalCount} mavzu
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="ClockIcon" size={20} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Qolgan vaqt: {formatDuration(remainingDuration)}
              </span>
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-primary">
            {progressPercentage}%
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;