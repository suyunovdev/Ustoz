'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface ContentUploadManagerProps {
  materialId?: string;
  onFilesChange: (files: FileAttachment[]) => void;
  files: FileAttachment[];
}

const ContentUploadManager = ({ materialId, onFilesChange, files }: ContentUploadManagerProps) => {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [externalLink, setExternalLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const newFiles: FileAttachment[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        // TODO: production'da fayl yuklash API (multipart) qo'shilishi kerak (S3/MinIO).
        // Hozircha local object URL ishlatamiz — fayl brauzer sessiyasida ko'rinadi.
        const fileUrl = URL.createObjectURL(file);

        newFiles.push({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          url: fileUrl,
        });

        setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
      }

      onFilesChange([...files, ...newFiles]);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError('Fayl yuklanmadi. Qayta urinib ko\'ring.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(null), 1000);
      // Reset input
      e.target.value = '';
    }
  };

  const handleAddExternalLink = () => {
    if (!externalLink.trim()) return;

    const linkType = detectLinkType(externalLink);
    const newFile: FileAttachment = {
      id: `link-${Date.now()}`,
      name: getLinkDisplayName(externalLink, linkType),
      size: 'External',
      type: linkType,
      url: externalLink
    };

    onFilesChange([...files, newFile]);
    setExternalLink('');
    setShowLinkModal(false);
  };

  const detectLinkType = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('t.me') || url.includes('telegram')) return 'telegram';
    return 'external_link';
  };

  const getLinkDisplayName = (url: string, type: string): string => {
    if (type === 'youtube') return 'YouTube Video';
    if (type === 'telegram') return 'Telegram Channel';
    return 'External Link';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'DocumentTextIcon';
    if (type.includes('image')) return 'PhotoIcon';
    if (type.includes('video') || type === 'youtube') return 'VideoCameraIcon';
    if (type.includes('audio')) return 'MusicalNoteIcon';
    if (type === 'telegram') return 'ChatBubbleLeftRightIcon';
    if (type.includes('word') || type.includes('doc')) return 'DocumentIcon';
    return 'LinkIcon';
  };

  const deleteFile = (file: FileAttachment) => {
    // Local object URL'ni revoke qilamiz (xotira tozalash)
    if (file.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(file.url);
      } catch {
        // blob URL revoke xatosi — ignore
      }
    }
    onFilesChange(files.filter((f) => f.id !== file.id));
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">Dars Materiallari</h3>
          <p className="caption text-muted-foreground mt-1">O'quvchilar yuklab olishi mumkin bo'lgan fayllar</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.mp4,.mp3,.wav,.ppt,.pptx,.xls,.xlsx,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-smooth cursor-pointer ${
              uploading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            <Icon name="ArrowUpTrayIcon" size={20} />
            <span className="font-medium">{uploading ? 'Yuklanmoqda...' : 'Fayl yuklash'}</span>
          </label>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-smooth"
          >
            <Icon name="LinkIcon" size={20} />
            <span className="font-medium">Havola</span>
          </button>
        </div>
      </div>

      {/* File Type Examples */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="DocumentTextIcon" size={18} className="text-red-500" />
            <span className="text-xs font-semibold text-foreground">PDF</span>
          </div>
          <p className="text-xs text-muted-foreground">Darsliklar, kitoblar</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="DocumentIcon" size={18} className="text-blue-500" />
            <span className="text-xs font-semibold text-foreground">DOCX</span>
          </div>
          <p className="text-xs text-muted-foreground">Word hujjatlar</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="VideoCameraIcon" size={18} className="text-green-500" />
            <span className="text-xs font-semibold text-foreground">MP4</span>
          </div>
          <p className="text-xs text-muted-foreground">Video darslar</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-md p-3 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="MusicalNoteIcon" size={18} className="text-orange-500" />
            <span className="text-xs font-semibold text-foreground">MP3</span>
          </div>
          <p className="text-xs text-muted-foreground">Audio fayllar</p>
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center space-x-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <Icon name="ExclamationCircleIcon" size={20} className="text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{uploadError}</p>
          <button onClick={() => setUploadError(null)} className="ml-auto text-destructive hover:opacity-70">
            <Icon name="XMarkIcon" size={16} />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Yuklanmoqda...</span>
            <span className="font-data text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Watermark Info */}
      <div className="flex items-start space-x-3 p-4 bg-secondary/10 rounded-md border border-secondary/20">
        <Icon name="ShieldCheckIcon" size={24} className="text-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-1">Watermark himoyasi</h4>
          <p className="caption text-muted-foreground">
            Barcha yuklangan materiallar avtomatik ravishda watermark bilan himoyalanadi.
          </p>
        </div>
      </div>

      {/* File Limits Info */}
      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
        <Icon name="InformationCircleIcon" size={20} className="text-muted-foreground" />
        <span className="caption text-muted-foreground">
          Maksimal fayl hajmi: 100MB. Qo'llab-quvvatlanadigan formatlar: PDF, DOCX, MP4, MP3, WAV, PPT, XLS
        </span>
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-md">
            <Icon name="FolderIcon" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Hali materiallar yuklanmagan</p>
            <p className="text-sm text-muted-foreground">Yuqoridagi "Fayl yuklash" tugmasini bosing</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md border border-border">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Icon name={getFileIcon(file.type) as any} size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.size}</p>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {file.url && !file.url.startsWith('blob:') && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-primary transition-smooth"
                    title="Ko'rish"
                  >
                    <Icon name="EyeIcon" size={18} />
                  </a>
                )}
                <button
                  onClick={() => deleteFile(file)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-smooth"
                  title="O'chirish"
                >
                  <Icon name="TrashIcon" size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* External Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-xl border border-border p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">Havola qo'shish</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-muted rounded-md transition-smooth">
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">URL manzil</label>
                <input
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddExternalLink}
                  disabled={!externalLink.trim()}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50"
                >
                  Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentUploadManager;