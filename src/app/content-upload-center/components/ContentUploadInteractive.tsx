// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

  useEffect(() => {
    setIsHydrated(true);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      setTeacherId(user.id);

      // Load uploaded files
      const { data: materials } = await supabase
        .from('content_materials')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (materials) {
        const files: UploadedFile[] = materials.map(m => ({
          id: m.id,
          name: m.file_name,
          type: m.content_type,
          size: formatFileSize(m.file_size),
          uploadDate: new Date(m.created_at).toISOString().split('T')[0],
          status: m.moderation_status,
          watermarkEnabled: m.watermark_enabled,
          url: m.file_url
        }));
        setUploadedFiles(files);
      }

      // Load external links
      const { data: links } = await supabase
        .from('external_links')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (links) {
        const externalLinksData: ExternalLink[] = links.map(l => ({
          id: l.id,
          type: l.link_type,
          url: l.url,
          title: l.title,
          description: l.description,
          addedDate: new Date(l.created_at).toISOString().split('T')[0],
          status: l.moderation_status
        }));
        setExternalLinks(externalLinksData);
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

  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('content_materials')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleWatermarkUpdate = (config: WatermarkConfig) => {
    setWatermarkConfig(config);
  };

  const handleLinkAdd = (link: ExternalLink) => {
    setExternalLinks([...externalLinks, link]);
  };

  const handleLinkDelete = (linkId: string) => {
    setExternalLinks(externalLinks.filter(l => l.id !== linkId));
  };

  const sections = [
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
                      onClick={() => setActiveSection(section.id as any)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-smooth whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-warm'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon name={section.icon as any} size={20} />
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