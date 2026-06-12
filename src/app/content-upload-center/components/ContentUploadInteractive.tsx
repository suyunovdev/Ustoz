'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import FileLibraryPanel from './FileLibraryPanel';
import UploadArea from './UploadArea';
import WatermarkSettings from './WatermarkSettings';
import ExternalLinkIntegration from './ExternalLinkIntegration';

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

      // TODO: add /api/teacher/materials endpoint
      // Fallback: read previously cached materials from localStorage so the UI isn't empty
      try {
        const cachedMaterials =
          typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem(`content_materials:${user.id}`) || '[]')
            : [];
        if (Array.isArray(cachedMaterials)) {
          setUploadedFiles(cachedMaterials as UploadedFile[]);
        }
      } catch (e) {
        console.warn('Failed to read cached materials from localStorage:', e);
        setUploadedFiles([]);
      }

      // TODO: add /api/teacher/external-links endpoint
      // Fallback: read cached external links from localStorage
      try {
        const cachedLinks =
          typeof window !== 'undefined'
            ? JSON.parse(localStorage.getItem(`external_links:${user.id}`) || '[]')
            : [];
        if (Array.isArray(cachedLinks)) {
          setExternalLinks(cachedLinks as ExternalLink[]);
        }
      } catch (e) {
        console.warn('Failed to read cached external links from localStorage:', e);
        setExternalLinks([]);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const persistMaterials = (files: UploadedFile[]) => {
    // TODO: add /api/teacher/materials endpoint and POST/DELETE here
    try {
      if (typeof window !== 'undefined' && teacherId) {
        localStorage.setItem(`content_materials:${teacherId}`, JSON.stringify(files));
      }
    } catch (e) {
      console.warn('Failed to persist materials to localStorage:', e);
    }
  };

  const persistLinks = (links: ExternalLink[]) => {
    // TODO: add /api/teacher/external-links endpoint and POST/DELETE here
    try {
      if (typeof window !== 'undefined' && teacherId) {
        localStorage.setItem(`external_links:${teacherId}`, JSON.stringify(links));
      }
    } catch (e) {
      console.warn('Failed to persist external links to localStorage:', e);
    }
  };

  const handleFileUpload = (files: UploadedFile[]) => {
    const next = [...uploadedFiles, ...files];
    setUploadedFiles(next);
    persistMaterials(next);
  };

  const handleFileDelete = async (fileId: string) => {
    // TODO: add DELETE /api/teacher/materials/[id] endpoint
    try {
      const next = uploadedFiles.filter(f => f.id !== fileId);
      setUploadedFiles(next);
      persistMaterials(next);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleWatermarkUpdate = (config: WatermarkConfig) => {
    setWatermarkConfig(config);
  };

  const handleLinkAdd = (link: ExternalLink) => {
    const next = [...externalLinks, link];
    setExternalLinks(next);
    persistLinks(next);
  };

  const handleLinkDelete = (linkId: string) => {
    const next = externalLinks.filter(l => l.id !== linkId);
    setExternalLinks(next);
    persistLinks(next);
  };

  const sections: { id: 'upload' | 'watermark' | 'links'; label: string; icon: string }[] = [
    { id: 'upload', label: 'Yuklash', icon: 'ArrowUpTrayIcon' },
    { id: 'watermark', label: 'Watermark', icon: 'ShieldCheckIcon' },
    { id: 'links', label: 'Tashqi havolalar', icon: 'LinkIcon' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Kontent yuklash markazi</h1>
              <p className="text-muted-foreground mt-1">Dars materiallarini yuklang va boshqaring</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="font-medium hidden sm:inline">Orqaga</span>
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