'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface UploadedFile {
  id: string;
  name: string;
  type: 'document' | 'video' | 'audio';
  size: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  watermarkEnabled: boolean;
  url: string;
  thumbnailUrl?: string;
}

interface FileLibraryPanelProps {
  files: UploadedFile[];
  onFileDelete: (fileId: string) => void;
}

const FileLibraryPanel = ({ files, onFileDelete }: FileLibraryPanelProps) => {
  const { t } = useI18n();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('content.pending'), color: 'bg-warning/10 text-warning', icon: 'ClockIcon' },
      approved: { label: t('content.approved'), color: 'bg-success/10 text-success', icon: 'CheckCircleIcon' },
      rejected: { label: t('content.rejected'), color: 'bg-destructive/10 text-destructive', icon: 'XCircleIcon' },
      revision_requested: { label: t('content.revisionRequested'), color: 'bg-secondary/10 text-secondary', icon: 'ArrowPathIcon' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getFileIcon = (type: string) => {
    const icons = {
      document: 'DocumentTextIcon',
      video: 'VideoCameraIcon',
      audio: 'MusicalNoteIcon'
    };
    return icons[type as keyof typeof icons] || 'DocumentIcon';
  };

  const filesByStatus = {
    pending: files.filter(f => f.status === 'pending').length,
    approved: files.filter(f => f.status === 'approved').length,
    rejected: files.filter(f => f.status === 'rejected').length
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-4 space-y-4 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-lg font-heading font-semibold text-foreground">{t('content.fileLibrary')}</h3>
        <Icon name="FolderIcon" size={24} className="text-primary" />
      </div>

      {/* Status Summary */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">{t('content.byStatus')}</h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 bg-warning/5 rounded-md">
            <div className="flex items-center space-x-2">
              <Icon name="ClockIcon" size={16} className="text-warning" />
              <span className="caption text-foreground">{t('content.pending')}</span>
            </div>
            <span className="font-data text-sm text-warning">{filesByStatus.pending}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-success/5 rounded-md">
            <div className="flex items-center space-x-2">
              <Icon name="CheckCircleIcon" size={16} className="text-success" />
              <span className="caption text-foreground">{t('content.approved')}</span>
            </div>
            <span className="font-data text-sm text-success">{filesByStatus.approved}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-destructive/5 rounded-md">
            <div className="flex items-center space-x-2">
              <Icon name="XCircleIcon" size={16} className="text-destructive" />
              <span className="caption text-foreground">{t('content.rejected')}</span>
            </div>
            <span className="font-data text-sm text-destructive">{filesByStatus.rejected}</span>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">{t('content.recentFiles')}</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FolderOpenIcon" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="caption text-muted-foreground">{t('content.noFiles')}</p>
            </div>
          ) : (
            files.map((file) => {
              const statusBadge = getStatusBadge(file.status);
              return (
                <div
                  key={file.id}
                  className="p-3 bg-muted/50 rounded-md hover:bg-muted transition-smooth space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <Icon name={getFileIcon(file.type) as any} size={20} className="text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="caption text-muted-foreground">{file.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onFileDelete(file.id)}
                      className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-smooth"
                      aria-label="Delete file"
                    >
                      <Icon name="TrashIcon" size={16} />
                    </button>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${statusBadge.color}`}>
                    <Icon name={statusBadge.icon as any} size={14} />
                    <span className="caption">{statusBadge.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FileLibraryPanel;