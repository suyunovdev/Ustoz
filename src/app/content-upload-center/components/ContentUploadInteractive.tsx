'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Skeleton, SkeletonForm } from '@/components/ui/Skeleton';
import FileLibraryPanel from './FileLibraryPanel';
import UploadArea from './UploadArea';
import WatermarkSettings from './WatermarkSettings';
import ExternalLinkIntegration from './ExternalLinkIntegration';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';

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

interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface ExternalLink {
  id: string;
  type: 'telegram' | 'youtube' | 'other';
  url: string;
  title: string;
  description: string;
  addedDate: string;
  status?: string;
}

const ContentUploadInteractive = () => {
  const { t } = useI18n();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<'upload' | 'watermark' | 'links'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    enabled: true,
    text: 'Ustoz Platform © 2026',
    opacity: 50,
    position: 'bottom-right'
  });
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [teacherId, setTeacherId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Fetch current user via JWT-based session endpoint
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        window.location.href = '/login';
        return;
      }
      const payload = await res.json();
      const user = payload?.user;
      if (!user) {
        window.location.href = '/login';
        return;
      }

      setTeacherId(user.id);

      // Materiallar va tashqi havolalarni server'dan yuklaymiz
      const [matRes, linkRes] = await Promise.all([
        fetch('/api/teacher/materials', { credentials: 'include' }),
        fetch('/api/teacher/external-links', { credentials: 'include' }),
      ]);
      if (matRes.ok) {
        const data = await matRes.json();
        setUploadedFiles(Array.isArray(data.materials) ? data.materials : []);
      }
      if (linkRes.ok) {
        const data = await linkRes.json();
        setExternalLinks(Array.isArray(data.links) ? data.links : []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <SkeletonForm fields={4} />
        </div>
      </div>
    );
  }

  const handleFileUpload = async (files: UploadedFile[]) => {
    // Har bir yuklangan faylni server'ga (content_materials) yozamiz
    const saved: UploadedFile[] = [];
    for (const f of files) {
      try {
        const res = await fetch('/api/teacher/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: f.name, type: f.type, url: f.url, size: f.size }),
        });
        if (!res.ok) throw new Error(`(${res.status})`);
        const data = await res.json();
        if (data.material) saved.push(data.material as UploadedFile);
      } catch (err) {
        toast.error(t('content.saveFileError', { name: f.name }));
      }
    }
    if (saved.length) setUploadedFiles((prev) => [...saved, ...prev]);
  };

  const handleFileDelete = async (fileId: string) => {
    const prev = uploadedFiles;
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId)); // optimistik
    try {
      const res = await fetch(`/api/teacher/materials/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`(${res.status})`);
    } catch (error) {
      setUploadedFiles(prev);
      toast.error(t('content.deleteMaterialError'));
    }
  };

  const handleWatermarkUpdate = (config: WatermarkConfig) => {
    setWatermarkConfig(config);
  };

  const handleLinkAdd = async (link: ExternalLink) => {
    try {
      const res = await fetch('/api/teacher/external-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: link.type,
          url: link.url,
          title: link.title,
          description: link.description,
        }),
      });
      if (!res.ok) throw new Error(`(${res.status})`);
      const data = await res.json();
      if (data.link) setExternalLinks((prev) => [data.link as ExternalLink, ...prev]);
    } catch (err) {
      toast.error(t('content.addLinkError'));
    }
  };

  const handleLinkDelete = async (linkId: string) => {
    const prev = externalLinks;
    setExternalLinks(externalLinks.filter((l) => l.id !== linkId)); // optimistik
    try {
      const res = await fetch(`/api/teacher/external-links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`(${res.status})`);
    } catch (error) {
      setExternalLinks(prev);
      toast.error(t('content.deleteLinkError'));
    }
  };

  const sections: { id: 'upload' | 'watermark' | 'links'; label: string; icon: string }[] = [
    { id: 'upload', label: t('content.uploadTab'), icon: 'ArrowUpTrayIcon' },
    { id: 'watermark', label: t('content.watermarkTab'), icon: 'ShieldCheckIcon' },
    { id: 'links', label: t('content.externalLinksTab'), icon: 'LinkIcon' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">{t('content.uploadCenterTitle')}</h1>
              <p className="text-muted-foreground mt-1">{t('content.uploadCenterDesc')}</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="font-medium hidden sm:inline">{t('content.back')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Library Panel - Left Sidebar */}
          <div className="lg:col-span-1">
            <FileLibraryPanel 
              files={uploadedFiles}
              onFileDelete={handleFileDelete}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Section Navigation */}
            <div className="bg-card rounded-md shadow-warm p-2">
              <div className="flex items-center space-x-2 overflow-x-auto">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-smooth whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-warm'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon name={section.icon} size={20} />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Sections */}
            {activeSection === 'upload' && (
              <UploadArea 
                onFileUpload={handleFileUpload}
                watermarkConfig={watermarkConfig}
                teacherId={teacherId}
              />
            )}

            {activeSection === 'watermark' && (
              <WatermarkSettings 
                config={watermarkConfig}
                onConfigUpdate={handleWatermarkUpdate}
              />
            )}

            {activeSection === 'links' && (
              <ExternalLinkIntegration 
                links={externalLinks}
                onLinkAdd={handleLinkAdd}
                onLinkDelete={handleLinkDelete}
                teacherId={teacherId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentUploadInteractive;