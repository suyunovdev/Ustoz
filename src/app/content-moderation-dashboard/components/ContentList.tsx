'use client';

import Icon from '@/components/ui/AppIcon';

interface ContentItem {
  id: string;
  type: 'material' | 'link' | 'test';
  title: string;
  teacherName: string;
  submittedAt: string;
  status: string;
  contentType?: string;
}

interface ContentListProps {
  items: ContentItem[];
  selectedItem: ContentItem | null;
  onSelectItem: (item: ContentItem) => void;
  isLoading: boolean;
}

const ContentList = ({ items, selectedItem, onSelectItem, isLoading }: ContentListProps) => {
  const getTypeIcon = (type: string) => {
    const icons = {
      material: 'DocumentTextIcon',
      link: 'LinkIcon',
      test: 'AcademicCapIcon'
    };
    return icons[type as keyof typeof icons] || 'DocumentIcon';
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Kutilmoqda', color: 'bg-warning/10 text-warning' },
      approved: { label: 'Tasdiqlangan', color: 'bg-success/10 text-success' },
      rejected: { label: 'Rad etilgan', color: 'bg-destructive/10 text-destructive' },
      revision_requested: { label: 'Qayta ko\'rib chiqish', color: 'bg-secondary/10 text-secondary' }
    };
    return config[status as keyof typeof config] || config.pending;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md shadow-warm p-4 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Kontent ro'yxati ({items.length})
      </h3>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="InboxIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Kontent topilmadi</p>
        </div>
      ) : (
        items.map((item) => {
          const isSelected = selectedItem?.id === item.id;
          const statusBadge = getStatusBadge(item.status);
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className={`p-4 rounded-md cursor-pointer transition-smooth ${
                isSelected
                  ? 'bg-primary/10 border-2 border-primary' :'bg-muted/50 hover:bg-muted border-2 border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Icon
                  name={getTypeIcon(item.type) as any}
                  size={24}
                  className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                  <p className="caption text-muted-foreground mt-1">
                    {item.teacherName} • {new Date(item.submittedAt).toLocaleDateString('uz-UZ')}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`caption px-2 py-0.5 rounded-md ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    {item.contentType && (
                      <span className="caption px-2 py-0.5 bg-muted text-muted-foreground rounded-md uppercase">
                        {item.contentType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ContentList;