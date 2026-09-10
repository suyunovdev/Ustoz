import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { parseDurationToMinutes, formatMinutes } from '@/lib/duration';

interface CurriculumSection {
  id: string;
  title: string;
  topics: {
    id: string;
    title: string;
    duration: string;
    hasQuiz: boolean;
    hasPreview: boolean;
    isLocked: boolean;
  }[];
}

interface CourseCurriculumProps {
  sections: CurriculumSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
}

const CourseCurriculum = ({ sections, expandedSections, onToggleSection }: CourseCurriculumProps) => {
  const { t } = useI18n();
  const totalTopics = sections.reduce((acc, section) => acc + section.topics.length, 0);
  // Davomiylik erkin formatda ("10 min", "1:30", "45 daqiqa") — xavfsiz parslash
  const totalMinutes = sections.reduce(
    (acc, section) =>
      acc + section.topics.reduce((tAcc, topic) => tAcc + parseDurationToMinutes(topic.duration), 0),
    0,
  );

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-heading font-bold text-foreground">{t('courseDetails.curriculum')}</h2>
        <div className="text-sm text-muted-foreground">
          {totalTopics} {t('courseDetails.topics')}
          {totalMinutes > 0 && ` • ${formatMinutes(totalMinutes)}`}
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const sectionMinutes = section.topics.reduce(
            (acc, topic) => acc + parseDurationToMinutes(topic.duration),
            0,
          );

          return (
            <div key={section.id} className="border border-border rounded-md overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => onToggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-muted hover:bg-muted/80 transition-smooth"
              >
                <div className="flex items-center space-x-3">
                  <Icon 
                    name={isExpanded ? 'ChevronDownIcon' : 'ChevronRightIcon'} 
                    size={20} 
                    className="text-foreground"
                  />
                  <span className="font-semibold text-foreground">{section.title}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {section.topics.length} {t('courseDetails.topics')}
                  {sectionMinutes > 0 && ` • ${formatMinutes(sectionMinutes)}`}
                </div>
              </button>

              {/* Topics List */}
              {isExpanded && (
                <div className="bg-card">
                  {section.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-4 border-t border-border hover:bg-muted/50 transition-smooth"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon 
                          name={topic.isLocked ? 'LockClosedIcon' : 'PlayCircleIcon'} 
                          size={20} 
                          className={topic.isLocked ? 'text-muted-foreground' : 'text-primary'}
                        />
                        <span className={`text-sm ${topic.isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {topic.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {topic.hasQuiz && (
                          <div className="flex items-center space-x-1 text-xs text-accent">
                            <Icon name="AcademicCapIcon" size={16} />
                            <span>{t('courseDetails.test')}</span>
                          </div>
                        )}
                        {topic.hasPreview && (
                          <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                            {t('courseDetails.freePreview')}
                          </span>
                        )}
                        {topic.duration && topic.duration !== '—' && (
                          <span className="text-xs text-muted-foreground font-data">
                            {topic.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCurriculum;