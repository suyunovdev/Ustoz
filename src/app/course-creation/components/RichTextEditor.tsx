'use client';

import { useState, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({
  content,
  onContentChange,
  placeholder = 'Start writing your content here...'
}: RichTextEditorProps) => {
  const { t } = useI18n();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML);
    }
  };

  const sanitizeVideoId = (id: string | undefined): string => {
    if (!id) return '';
    return id.replace(/[^a-zA-Z0-9_-]/g, '');
  };

  const insertVideo = () => {
    if (!videoUrl.trim()) return;

    let embedUrl = '';

    // Faqat YouTube va Vimeo URL'lar qabul qilinadi — boshqa URL'lar rad etiladi
    if (videoUrl.includes('youtube.com/watch')) {
      const videoId = sanitizeVideoId(videoUrl.split('v=')[1]?.split('&')[0]);
      if (!videoId) return;
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = sanitizeVideoId(videoUrl.split('youtu.be/')[1]?.split('?')[0]);
      if (!videoId) return;
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('vimeo.com/')) {
      const videoId = sanitizeVideoId(videoUrl.split('vimeo.com/')[1]?.split('?')[0]);
      if (!videoId) return;
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else {
      return; // Noma'lum URL — rad etish
    }

    // DOM API orqali xavfsiz element yaratish (innerHTML/insertHTML ishlatmaslik)
    if (editorRef.current) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video-wrapper';
      wrapper.style.cssText = 'position:relative;padding-bottom:56.25%;height:0;margin:16px 0;';
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      wrapper.appendChild(iframe);

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(wrapper);
      } else {
        editorRef.current.appendChild(wrapper);
      }
      onContentChange(editorRef.current.innerHTML);
    }

    setVideoUrl('');
    setShowVideoModal(false);
  };

  const toolbarButtons = [
    { command: 'bold', icon: 'BoldIcon', label: 'Bold' },
    { command: 'italic', icon: 'ItalicIcon', label: 'Italic' },
    { command: 'underline', icon: 'UnderlineIcon', label: 'Underline' },
    { command: 'insertUnorderedList', icon: 'ListBulletIcon', label: 'Bullet List' },
    { command: 'insertOrderedList', icon: 'NumberedListIcon', label: 'Numbered List' },
  ];

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
      {/* Persistent Help Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-md">
        <div className="flex items-start space-x-3">
          <Icon name="InformationCircleIcon" size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">{t('courseCreation.textOnlyHint')}</p>
            <p className="text-xs text-muted-foreground">{t('courseCreation.textOnlyHintDesc')}</p>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-heading font-semibold text-foreground">{t('courseCreation.lessonTextTitle')}</h3>

      <div className="bg-card rounded-md shadow-warm border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center space-x-1 p-2 border-b border-border bg-muted/50">
          {toolbarButtons.map((button) => (
            <button
              key={button.command}
              onClick={() => formatText(button.command)}
              className="p-2 rounded-md text-foreground hover:bg-muted transition-smooth"
              aria-label={button.label}
              type="button"
            >
              <Icon name={button.icon as any} size={20} />
            </button>
          ))}
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <button
            onClick={() => setShowVideoModal(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-smooth"
            aria-label="Insert video"
            type="button"
          >
            <Icon name="VideoCameraIcon" size={20} />
            <span className="font-medium hidden sm:inline">Video</span>
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
          className="min-h-[400px] p-4 text-foreground focus:outline-none"
          dangerouslySetInnerHTML={{ __html: content }}
          data-placeholder={placeholder}
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        />

        {/* Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
            <div className="bg-card rounded-md shadow-warm-xl border border-border w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-heading font-semibold">{t('courseCreation.insertVideo')}</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-2 rounded-md hover:bg-muted transition-smooth"
                  aria-label="Close modal"
                  type="button"
                >
                  <Icon name="XMarkIcon" size={24} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.videoUrlLabel')}</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={insertVideo}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
                    type="button"
                  >{t('courseCreation.insertVideoBtn')}</button>
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth font-medium"
                    type="button"
                  >{t('common.cancel')}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;