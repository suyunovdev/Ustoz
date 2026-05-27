// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

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
  position: string;
}

interface UploadAreaProps {
  onFileUpload: (files: UploadedFile[]) => void;
  watermarkConfig: WatermarkConfig;
  teacherId: string;
}

const UploadArea = ({ onFileUpload, watermarkConfig, teacherId }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileType = (file: File): 'document' | 'video' | 'audio' => {
    if (file.type.includes('pdf') || file.type.includes('word') || file.type.includes('document')) {
      return 'document';
    }
    if (file.type.includes('video')) {
      return 'video';
    }
    if (file.type.includes('audio')) {
      return 'audio';
    }
    return 'document';
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newUploadedFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const fileId = `file-${Date.now()}-${Math.random()}`;
      setUploadingFiles(prev => [...prev, fileId]);
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        const fileType = getFileType(file);

        // TODO: implement S3/MinIO upload
        // Local-only preview URL — does NOT persist across page reloads.
        const publicUrl = URL.createObjectURL(file);

        // Simulate upload progress so the UI feels responsive.
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        // TODO: add POST /api/teacher/materials endpoint and persist via JWT-authenticated fetch
        const newFile: UploadedFile = {
          id: fileId,
          name: file.name,
          type: fileType,
          size: formatFileSize(file.size),
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'pending',
          watermarkEnabled: watermarkConfig.enabled && fileType === 'video',
          url: publicUrl
        };

        newUploadedFiles.push(newFile);
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setUploadingFiles(prevFiles => prevFiles.filter(id => id !== fileId));
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    if (newUploadedFiles.length > 0) {
      onFileUpload(newUploadedFiles);
    }
  }, [teacherId, watermarkConfig, onFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-semibold text-foreground">Fayl yuklash</h3>
          <div className="flex items-center space-x-2">
            <Icon name="InformationCircleIcon" size={20} className="text-muted-foreground" />
            <span className="caption text-muted-foreground">Max: 500MB</span>
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-md p-12 text-center transition-smooth ${
            isDragging
              ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
        >
          <Icon name="CloudArrowUpIcon" size={64} className="text-primary mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">Fayllarni bu yerga tashlang</h4>
          <p className="text-muted-foreground mb-4">yoki</p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.mp4,.mp3,.wav,.avi,.mov"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload-input"
          />
          <label
            htmlFor="file-upload-input"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth cursor-pointer"
          >
            <Icon name="FolderOpenIcon" size={20} />
            <span className="font-medium">Fayllarni tanlang</span>
          </label>
        </div>

        {/* Supported Formats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-md">
            <Icon name="DocumentTextIcon" size={24} className="text-primary" />
            <div>
              <p className="font-medium text-foreground">Hujjatlar</p>
              <p className="caption text-muted-foreground">PDF, Word</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-md">
            <Icon name="VideoCameraIcon" size={24} className="text-primary" />
            <div>
              <p className="font-medium text-foreground">Video</p>
              <p className="caption text-muted-foreground">MP4, AVI, MOV</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-md">
            <Icon name="MusicalNoteIcon" size={24} className="text-primary" />
            <div>
              <p className="font-medium text-foreground">Audio</p>
              <p className="caption text-muted-foreground">MP3, WAV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">Yuklanmoqda...</h3>
          {uploadingFiles.map((fileId) => (
            <div key={fileId} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Fayl yuklanmoqda</span>
                <span className="font-data text-sm text-muted-foreground">{Math.round(uploadProgress[fileId] || 0)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress[fileId] || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Watermark Status */}
      {watermarkConfig.enabled && (
        <div className="flex items-center space-x-3 p-4 bg-success/10 rounded-md">
          <Icon name="ShieldCheckIcon" size={24} className="text-success" />
          <div>
            <p className="font-medium text-success">Watermark himoyasi yoqilgan</p>
            <p className="caption text-muted-foreground">Video fayllar avtomatik himoyalanadi</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;