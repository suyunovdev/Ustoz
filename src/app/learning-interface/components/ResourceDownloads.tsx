'use client';

import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface ResourceDownloadsProps {
  topicId: string;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  materialType: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function iconFor(fileType: string | null, materialType: string): string {
  const t = (fileType || '').toLowerCase();
  if (materialType === 'link' || materialType === 'external') return 'LinkIcon';
  if (t.includes('pdf')) return 'DocumentTextIcon';
  if (t.includes('zip') || t.includes('rar') || t.includes('archive')) return 'FolderIcon';
  if (t.includes('video')) return 'VideoCameraIcon';
  if (t.includes('image')) return 'PhotoIcon';
  if (t.includes('javascript') || t.includes('json') || t.includes('code')) return 'CodeBracketIcon';
  return 'DocumentIcon';
}

function typeLabel(fileType: string | null, fileName: string | null): string {
  if (fileName && fileName.includes('.')) {
    return fileName.split('.').pop()!.toUpperCase();
  }
  if (fileType) return fileType.split('/').pop()!.toUpperCase();
  return 'FILE';
}

const ResourceDownloads = ({ topicId }: ResourceDownloadsProps) => {
  const { t } = useI18n();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!topicId) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/topics/${topicId}/materials`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadable = materials.filter((m) => !!m.fileUrl);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-2">{t('learning.resources')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('learning.resourcesDescription')}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-card rounded-md shadow-warm">
          <Icon name="ExclamationTriangleIcon" size={40} className="text-destructive mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{t('common.errorOccurred')}</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-smooth"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : materials.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-md shadow-warm">
          <Icon name="FolderOpenIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('learning.noResources')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {materials.map((m) => {
              const label = typeLabel(m.fileType, m.fileName);
              const size = formatSize(m.fileSize);
              const content = (
                <>
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={iconFor(m.fileType, m.materialType) as any} size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{m.title}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        {size && <span className="text-xs text-muted-foreground">•</span>}
                        {size && <span className="text-xs text-muted-foreground">{size}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="ml-4 p-2 bg-primary text-primary-foreground rounded-md flex-shrink-0">
                    <Icon name={m.fileUrl ? 'ArrowDownTrayIcon' : 'EyeSlashIcon'} size={20} />
                  </span>
                </>
              );
              return m.fileUrl ? (
                <a
                  key={m.id}
                  href={m.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={m.fileName || undefined}
                  className="flex items-center justify-between p-4 bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth"
                >
                  {content}
                </a>
              ) : (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 bg-card rounded-md shadow-warm opacity-60"
                  title={t('learning.noFile')}
                >
                  {content}
                </div>
              );
            })}
          </div>

          {downloadable.length > 1 && (
            <button
              type="button"
              onClick={() => downloadable.forEach((m) => window.open(m.fileUrl!, '_blank', 'noopener'))}
              className="w-full px-4 py-3 border-2 border-dashed border-border rounded-md text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-smooth"
            >
              {t('learning.downloadAllResources')}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ResourceDownloads;
