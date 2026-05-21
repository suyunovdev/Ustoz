'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface ExternalLink {
  id: string;
  type: 'telegram' | 'youtube' | 'other';
  url: string;
  title: string;
  description: string;
  addedDate: string;
  status?: string;
}

interface ExternalLinkIntegrationProps {
  links: ExternalLink[];
  onLinkAdd: (link: ExternalLink) => void;
  onLinkDelete: (linkId: string) => void;
  teacherId: string;
}

const ExternalLinkIntegration = ({ links, onLinkAdd, onLinkDelete, teacherId }: ExternalLinkIntegrationProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLink, setNewLink] = useState<Partial<ExternalLink>>({
    type: 'youtube',
    url: '',
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleAddLink = useCallback(async () => {
    if (!newLink.url || !newLink.title || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('external_links')
        .insert({
          teacher_id: teacherId,
          link_type: newLink.type,
          url: newLink.url,
          title: newLink.title,
          description: newLink.description || '',
          moderation_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const link: ExternalLink = {
        id: data.id,
        type: data.link_type,
        url: data.url,
        title: data.title,
        description: data.description,
        addedDate: new Date(data.created_at).toISOString().split('T')[0],
        status: data.moderation_status
      };

      onLinkAdd(link);
      setNewLink({ type: 'youtube', url: '', title: '', description: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding link:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newLink, teacherId, supabase, onLinkAdd, isSubmitting]);

  const handleDeleteLink = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('external_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      onLinkDelete(linkId);
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  }, [supabase, onLinkDelete]);

  const getLinkIcon = (type: string) => {
    const icons = {
      telegram: 'ChatBubbleLeftRightIcon',
      youtube: 'PlayCircleIcon',
      other: 'LinkIcon'
    };
    return icons[type as keyof typeof icons] || 'LinkIcon';
  };

  const getLinkColor = (type: string) => {
    const colors = {
      telegram: 'text-blue-500',
      youtube: 'text-red-500',
      other: 'text-primary'
    };
    return colors[type as keyof typeof colors] || 'text-primary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-heading font-semibold text-foreground">Tashqi havolalar</h3>
            <p className="caption text-muted-foreground mt-1">Telegram, YouTube va boshqa resurslar</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
          >
            <Icon name="PlusIcon" size={20} />
            <span className="font-medium">Havola qo'shish</span>
          </button>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {links.length === 0 ? (
          <div className="bg-card rounded-md shadow-warm p-12 text-center">
            <Icon name="LinkIcon" size={64} className="text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">Havolalar yo'q</h4>
            <p className="text-muted-foreground mb-4">Telegram kanal, YouTube playlist yoki boshqa resurslarni qo'shing</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
            >
              <Icon name="PlusIcon" size={20} />
              <span className="font-medium">Birinchi havolani qo'shish</span>
            </button>
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="bg-card rounded-md shadow-warm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-3 bg-muted rounded-md ${getLinkColor(link.type)}`}>
                    <Icon name={getLinkIcon(link.type) as any} size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{link.title}</h4>
                      <span className="caption px-2 py-0.5 bg-muted text-muted-foreground rounded-md uppercase">
                        {link.type}
                      </span>
                      {link.status && (
                        <span className={`caption px-2 py-0.5 rounded-md ${
                          link.status === 'approved' ? 'bg-success/10 text-success' :
                          link.status === 'rejected'? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                        }`}>
                          {link.status === 'approved' ? 'Tasdiqlangan' :
                           link.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                        </span>
                      )}
                    </div>
                    {link.description && (
                      <p className="text-muted-foreground mb-3">{link.description}</p>
                    )}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-primary hover:underline caption"
                    >
                      <span className="truncate max-w-md">{link.url}</span>
                      <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                    </a>
                    <p className="caption text-muted-foreground mt-2">
                      Qo'shilgan: {new Date(link.addedDate).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-smooth"
                  aria-label="Delete link"
                >
                  <Icon name="TrashIcon" size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-xl border border-border w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-semibold text-foreground">Havola qo'shish</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-md hover:bg-muted transition-smooth"
                aria-label="Close modal"
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Link Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Havola turi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'youtube', label: 'YouTube', icon: 'PlayCircleIcon' },
                    { value: 'telegram', label: 'Telegram', icon: 'ChatBubbleLeftRightIcon' },
                    { value: 'other', label: 'Boshqa', icon: 'LinkIcon' }
                  ].map((type) => {
                    const isSelected = newLink.type === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewLink({ ...newLink, type: type.value as any })}
                        className={`flex items-center justify-center space-x-2 p-3 rounded-md border-2 transition-smooth ${
                          isSelected
                            ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon name={type.icon as any} size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Havola URL *
                </label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sarlavha *
                </label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  placeholder="Masalan: Dasturlash asoslari kursi"
                  className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tavsif (ixtiyoriy)
                </label>
                <textarea
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  placeholder="Qisqacha tavsif..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleAddLink}
                  disabled={!newLink.url || !newLink.title || isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth font-medium"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalLinkIntegration;