'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface FileManagerProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
}

const FileManager = ({ files, onFilesChange }: FileManagerProps) => {
  const { t } = useI18n();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return null;
        }
        return prev + 10;
      });
    }, 200);

    // Upload files via /api/upload
    for (const file of Array.from(uploadedFiles)) {
      let fileUrl: string;
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
        if (res.ok) {
          const data = await res.json();
          fileUrl = data.url;
        } else {
          fileUrl = URL.createObjectURL(file);
        }
      } catch {
        fileUrl = URL.createObjectURL(file);
      }
      const newFile: FileAttachment = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        url: fileUrl,
      };
      onFilesChange([...files, newFile]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'DocumentTextIcon';
    if (type.includes('image')) return 'PhotoIcon';
    if (type.includes('video')) return 'VideoCameraIcon';
    return 'DocumentIcon';
  };

  const deleteFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-heading font-semibold text-foreground">{t('courseCreation.fileAttachments')}</h3>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth cursor-pointer"
        >
          <Icon name="ArrowUpTrayIcon" size={20} />
          <span className="font-medium">{t('courseCreation.uploadFiles')}</span>
        </label>
      </div>

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{t('courseCreation.uploadingProgress')}</span>
            <span className="font-data text-muted-foreground">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* File Limits Info */}
      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
        <Icon name="InformationCircleIcon" size={20} className="text-muted-foreground" />
        <span className="caption text-muted-foreground">
          {t('courseCreation.fileLimitsShort')}
        </span>
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-md">
            <Icon name="FolderIcon" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('courseCreation.noFilesYet')}</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-md hover:bg-muted transition-smooth"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Icon name={getFileIcon(file.type) as any} size={24} className="text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="caption text-muted-foreground">{file.size}</p>
                </div>
              </div>
              <button
                onClick={() => deleteFile(file.id)}
                className="p-2 rounded-md text-destructive hover:bg-destructive/10 transition-smooth"
                aria-label="Delete file"
              >
                <Icon name="TrashIcon" size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileManager;