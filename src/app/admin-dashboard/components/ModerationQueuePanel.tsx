// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ModerationItem {
  id: string;
  material_id: string;
  status: string;
  submitted_at: string;
  title?: string;
  content_type?: string;
}

interface ModerationQueuePanelProps {
  expanded?: boolean;
}

const ModerationQueuePanel = ({ expanded = false }: ModerationQueuePanelProps) => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    avgReviewTime: '0h 0m'
  });

  useEffect(() => {
    loadModerationQueue();
  }, []);

  const loadModerationQueue = async () => {
    setIsLoading(true);
    try {
      // TODO: add /api/admin/moderation-queue endpoint that joins
      //       moderation_queue with course_materials and returns
      //       { items: [...], stats: { pending, underReview, avgReviewTime } }
      setItems([]);
      setStats({ pending: 0, underReview: 0, avgReviewTime: '0h 0m' });
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      document: 'DocumentTextIcon',
      video: 'VideoCameraIcon',
      audio: 'MusicalNoteIcon',
      external_link: 'LinkIcon'
    };
    return icons[type as keyof typeof icons] || 'DocumentIcon';
  };

  const getStatusBadge = (status: string) => {
    const config = {
      submitted: { label: 'Yuborilgan', color: 'bg-warning/10 text-warning' },
      under_review: { label: 'Ko\'rib chiqilmoqda', color: 'bg-secondary/10 text-secondary' }
    };
    return config[status as keyof typeof config] || config.submitted;
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">
          Moderatsiya navbati
        </h3>
        {!expanded && (
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            Barchasini ko'rish
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-warning/10 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Kutilmoqda</p>
          <p className="text-2xl font-heading font-bold text-warning">{stats.pending}</p>
        </div>
        <div className="p-4 bg-secondary/10 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Ko'rib chiqilmoqda</p>
          <p className="text-2xl font-heading font-bold text-secondary">{stats.underReview}</p>
        </div>
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground mb-1">O'rtacha vaqt</p>
          <p className="text-2xl font-heading font-bold text-foreground">{stats.avgReviewTime}</p>
        </div>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={`mod-skeleton-${i}`} className="animate-pulse">
              <div className="h-16 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="CheckCircleIcon" size={48} className="text-success mx-auto mb-4" />
          <p className="text-muted-foreground">Moderatsiya navbati bo'sh</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const statusBadge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted transition-smooth"
              >
                <div className="flex items-center space-x-3">
                  <Icon name={getContentTypeIcon(item.content_type || 'document') as any} size={20} className="text-primary" />
                  <div>
                    <h4 className="font-heading font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.submitted_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  <button className="p-2 hover:bg-primary/10 rounded-md transition-smooth">
                    <Icon name="EyeIcon" size={18} className="text-primary" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModerationQueuePanel;
