import Icon from '@/components/ui/AppIcon';

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
  const totalTopics = sections.reduce((acc, section) => acc + section.topics.length, 0);
  const totalDuration = sections.reduce((acc, section) => {
    return acc + section.topics.reduce((topicAcc, topic) => {
      const [minutes, seconds] = topic.duration.split(':').map(Number);
      return topicAcc + minutes * 60 + seconds;
    }, 0);
  }, 0);

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}s ${minutes}d`;
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-heading font-bold text-foreground">O\'quv dasturi</h2>
        <div className="text-sm text-muted-foreground">
          {sections.length} bo\'lim • {totalTopics} mavzu • {formatTotalDuration(totalDuration)}
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const sectionDuration = section.topics.reduce((acc, topic) => {
            const [minutes, seconds] = topic.duration.split(':').map(Number);
            return acc + minutes * 60 + seconds;
          }, 0);

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
                  {section.topics.length} mavzu • {Math.floor(sectionDuration / 60)}d
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

                      <div className="flex items-center space-x-4">
                        {topic.hasQuiz && (
                          <div className="flex items-center space-x-1 text-xs text-accent">
                            <Icon name="AcademicCapIcon" size={16} />
                            <span>Test</span>
                          </div>
                        )}
                        {topic.hasPreview && !topic.isLocked && (
                          <button className="text-xs text-primary hover:underline">
                            Ko\'rish
                          </button>
                        )}
                        <span className="text-xs text-muted-foreground font-data">
                          {topic.duration}
                        </span>
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