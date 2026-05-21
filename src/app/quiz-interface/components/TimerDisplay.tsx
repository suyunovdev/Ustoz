'use client';

import Icon from '@/components/ui/AppIcon';

interface TimerDisplayProps {
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
}

const TimerDisplay = ({ timeRemaining, totalTime }: TimerDisplayProps) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / totalTime) * 100;

  // Color coding based on time remaining
  const getTimerColor = () => {
    if (percentage > 50) return 'text-success';
    if (percentage > 25) return 'text-warning';
    return 'text-destructive';
  };

  const getBgColor = () => {
    if (percentage > 50) return 'bg-success/10';
    if (percentage > 25) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const isUrgent = percentage <= 25;

  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${getBgColor()} ${isUrgent ? 'animate-pulse' : ''}`}>
      <Icon name="ClockIcon" size={24} className={getTimerColor()} />
      <div>
        <div className={`text-2xl font-data font-bold ${getTimerColor()}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-xs text-muted-foreground">Qolgan vaqt</div>
      </div>
    </div>
  );
};

export default TimerDisplay;