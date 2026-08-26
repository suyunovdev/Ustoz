'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface Topic {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isCurrent: boolean;
  videoUrl: string;
  content: string;
  moduleTitle: string;
}

interface Section {
  id: string;
  title: string;
  topics: Topic[];
}

interface CourseNavigationProps {
  sections: Section[];
  currentTopicId: string;
  onTopicChange: (topic: Topic) => void;
  progress: number;
}

const CourseNavigation = ({ sections, currentTopicId, onTopicChange, progress }: CourseNavigationProps) => {
  const { t } = useI18n();
  const allTopics = sections.flatMap((s) => s.topics);
  const completedCount = allTopics.filter((tp) => tp.isCompleted).length;

  return (
    <div className="flex flex-col h-full">
      {/* Sarlavha + progress (yagona) */}
      <div className="sticky top-0 z-10 bg-card p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading font-semibold text-foreground text-sm">
            {t('learning.courseTopics')}
          </h2>
          <span className="text-xs font-data tabular-nums text-muted-foreground">
            {completedCount}/{allTopics.length}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Mavzular ro'yxati */}
      <nav className="flex-1 py-2">
        {allTopics.map((topic, i) => {
          const active = topic.id === currentTopicId;
          return (
            <button
              key={topic.id}
              onClick={() => onTopicChange(topic)}
              aria-current={active ? 'true' : undefined}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left border-l-2 transition-smooth ${
                active
                  ? 'bg-primary/10 border-primary'
                  : 'border-transparent hover:bg-muted/50'
              }`}
            >
              {/* Status / raqam */}
              <span className="mt-0.5 flex-shrink-0">
                {topic.isCompleted ? (
                  <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success" />
                ) : active ? (
                  <Icon name="PlayCircleIcon" size={20} variant="solid" className="text-primary" />
                ) : (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full border border-border text-[11px] font-data text-muted-foreground">
                    {i + 1}
                  </span>
                )}
              </span>

              {/* Nom + meta */}
              <span className="flex-1 min-w-0">
                <span
                  className={`block text-sm font-medium line-clamp-2 ${
                    active ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {topic.title}
                </span>
                <span className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {topic.videoUrl && <Icon name="VideoCameraIcon" size={13} />}
                  {topic.duration && topic.duration !== '—' && (
                    <span className="font-data">{topic.duration}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CourseNavigation;
