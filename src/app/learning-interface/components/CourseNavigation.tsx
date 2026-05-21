import Icon from '@/components/ui/AppIcon';

interface Topic {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isCurrent: boolean;
  videoUrl: string;
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
}

const CourseNavigation = ({ sections, currentTopicId, onTopicChange }: CourseNavigationProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-semibold text-foreground">Kurs mavzulari</h2>
      </div>

      <div className="flex-1 overflow-auto">
        {sections.map((section) => (
          <div key={section.id} className="border-b border-border">
            <div className="p-4 bg-muted">
              <h3 className="font-medium text-foreground text-sm">{section.title}</h3>
            </div>
            <div>
              {section.topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onTopicChange(topic)}
                  className={`w-full p-4 text-left transition-smooth border-l-4 ${
                    topic.id === currentTopicId
                      ? 'bg-primary/10 border-primary' :'border-transparent hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {topic.isCompleted ? (
                        <Icon name="CheckCircleIcon" size={20} variant="solid" className="text-success" />
                      ) : topic.id === currentTopicId ? (
                        <Icon name="PlayCircleIcon" size={20} variant="solid" className="text-primary" />
                      ) : (
                        <Icon name="PlayCircleIcon" size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium line-clamp-2 ${
                        topic.id === currentTopicId ? 'text-primary' : 'text-foreground'
                      }`}>
                        {topic.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-data">{topic.duration}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseNavigation;