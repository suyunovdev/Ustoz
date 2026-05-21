import Icon from '@/components/ui/AppIcon';

interface ResourceDownloadsProps {
  topicId: string;
}

const ResourceDownloads = ({ topicId }: ResourceDownloadsProps) => {
  const mockResources = [
    {
      id: '1',
      name: 'Visual Studio Code Sozlamalari',
      type: 'PDF',
      size: '2.4 MB',
      icon: 'DocumentTextIcon',
      downloadUrl: '#',
    },
    {
      id: '2',
      name: 'Amaliy Mashqlar',
      type: 'ZIP',
      size: '5.8 MB',
      icon: 'FolderIcon',
      downloadUrl: '#',
    },
    {
      id: '3',
      name: 'Kod Namunalari',
      type: 'JS',
      size: '124 KB',
      icon: 'CodeBracketIcon',
      downloadUrl: '#',
    },
    {
      id: '4',
      name: 'Qo\'shimcha O\'quv Materiallari',
      type: 'PDF',
      size: '1.2 MB',
      icon: 'DocumentTextIcon',
      downloadUrl: '#',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-2">Resurslar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ushbu mavzu uchun qo\'shimcha materiallar va fayllar
        </p>
      </div>

      <div className="space-y-3">
        {mockResources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-4 bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={resource.icon as any} size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{resource.name}</p>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{resource.type}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{resource.size}</span>
                </div>
              </div>
            </div>
            <button className="ml-4 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth flex-shrink-0">
              <Icon name="ArrowDownTrayIcon" size={20} />
            </button>
          </div>
        ))}
      </div>

      <button className="w-full px-4 py-3 border-2 border-dashed border-border rounded-md text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-smooth">
        Barcha resurslarni yuklab olish
      </button>
    </div>
  );
};

export default ResourceDownloads;