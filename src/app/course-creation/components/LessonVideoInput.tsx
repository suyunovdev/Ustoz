'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as tus from 'tus-js-client';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';
import { parseVideoSource, isEmbedKind } from '@/lib/video';

interface Props {
  topicTitle: string;
  videoUrl: string;
  videoProvider?: 'bunny' | null;
  streamUid?: string | null;
  onChange: (patch: { videoUrl?: string; videoProvider?: 'bunny' | null; streamUid?: string | null }) => void;
}

type Mode = 'bunny' | 'link';
type BunnyStatus = 'idle' | 'processing' | 'ready' | 'error';

const ACCEPT = 'video/mp4,video/webm,video/quicktime';

const LessonVideoInput = ({ topicTitle, videoUrl, videoProvider, streamUid, onChange }: Props) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(videoProvider === 'bunny' ? 'bunny' : videoUrl ? 'link' : 'bunny');

  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploadRef = useRef<tus.Upload | null>(null);

  const [status, setStatus] = useState<BunnyStatus>('idle');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const clearPoll = () => { if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; } };

  const startPoll = useCallback((guid: string) => {
    clearPoll();
    setStatus('processing');
    const tick = async () => {
      try {
        const r = await fetch(`/api/teacher/bunny/status?guid=${encodeURIComponent(guid)}`, { credentials: 'include' });
        if (r.ok) {
          const s = await r.json();
          if (s.ready) { setStatus('ready'); return; }
          if (s.failed) { setStatus('error'); return; }
        }
      } catch { /* qayta urinamiz */ }
      pollRef.current = setTimeout(tick, 5000);
    };
    tick();
  }, []);

  // Mavjud (tahrirlanayotgan) Bunny video — holatini bir marta tekshiramiz.
  useEffect(() => {
    if (mode === 'bunny' && streamUid && status === 'idle') startPoll(streamUid);
    return clearPoll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUid]);

  const startUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) { setErr(t('courseCreation.videoInvalidType')); return; }
    setErr(null);
    setPct(0);
    setStatus('idle');
    setPreviewUrl(null);
    try {
      const initRes = await fetch('/api/upload/bunny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: topicTitle || file.name }),
      });
      if (!initRes.ok) {
        const j = await initRes.json().catch(() => ({}));
        throw new Error(initRes.status === 503 ? t('courseCreation.videoServiceOff') : (j?.error || t('courseCreation.videoUploadFailed')));
      }
      const params = await initRes.json();
      const upload = new tus.Upload(file, {
        endpoint: params.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: params.authorizationSignature,
          AuthorizationExpire: String(params.authorizationExpire),
          VideoId: params.videoGuid,
          LibraryId: String(params.libraryId),
        },
        metadata: { filetype: file.type, title: file.name },
        onError: () => { uploadRef.current = null; setErr(t('courseCreation.videoUploadFailed')); setPct(null); },
        onProgress: (uploaded, total) => { if (total) setPct(Math.round((uploaded / total) * 100)); },
        onSuccess: () => {
          uploadRef.current = null;
          setPct(100);
          onChange({ videoProvider: 'bunny', streamUid: params.videoGuid, videoUrl: '' });
          toast.success(t('courseCreation.videoUploaded'));
          setTimeout(() => setPct(null), 1200);
          startPoll(params.videoGuid);
        },
      });
      uploadRef.current = upload;
      upload.start();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('courseCreation.videoUploadFailed'));
      setPct(null);
    }
  }, [topicTitle, onChange, startPoll, t]);

  const cancelUpload = () => {
    uploadRef.current?.abort();
    uploadRef.current = null;
    setPct(null);
  };

  const removeVideo = () => {
    clearPoll();
    uploadRef.current?.abort();
    uploadRef.current = null;
    setStatus('idle');
    setPreviewUrl(null);
    setPct(null);
    onChange({ videoProvider: null, streamUid: null });
  };

  const loadBunnyPreview = async () => {
    if (!streamUid) return;
    setPreviewLoading(true);
    try {
      const r = await fetch('/api/teacher/bunny/preview-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoGuid: streamUid }),
      });
      if (!r.ok) throw new Error();
      const j = await r.json();
      setPreviewUrl(j.embedUrl);
    } catch {
      toast.error(t('courseCreation.videoUploadFailed'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) startUpload(f);
  };

  const linkSource = parseVideoSource(videoUrl);
  const [showLinkPreview, setShowLinkPreview] = useState(false);

  const hasBunny = mode === 'bunny' && !!streamUid;

  const StatusPill = () => {
    if (status === 'ready') return <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Icon name="CheckCircleIcon" size={14} variant="solid" />{t('courseCreation.videoReady')}</span>;
    if (status === 'error') return <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><Icon name="ExclamationTriangleIcon" size={14} />{t('courseCreation.videoStatusError')}</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-warning"><span className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin" />{t('courseCreation.videoProcessing')}</span>;
  };

  return (
    <div className="bg-card rounded-lg shadow-warm border border-border overflow-hidden">
      {/* Sarlavha + segment */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="VideoCameraIcon" size={18} className="text-primary" />
          <h4 className="text-sm font-semibold text-foreground">{t('courseCreation.videoSectionTitle')}</h4>
        </div>
        <div className="inline-flex p-1 bg-muted rounded-lg">
          {(['bunny', 'link'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-smooth flex items-center gap-1.5 ${
                mode === m ? 'bg-card text-foreground shadow-warm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={m === 'bunny' ? 'ShieldCheckIcon' : 'LinkIcon'} size={14} className={m === 'bunny' && mode === m ? 'text-success' : ''} />
              {m === 'bunny' ? t('courseCreation.videoTabProtected') : t('courseCreation.videoTabLink')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* ─── Himoyalangan (Bunny) ─── */}
        {mode === 'bunny' && (
          <>
            <p className="text-xs text-muted-foreground">{t('courseCreation.protectedVideoHelp')}</p>

            {hasBunny ? (
              <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon name="CheckBadgeIcon" size={18} variant="solid" className="text-success" />
                    {t('courseCreation.videoAttached')}
                  </span>
                  <StatusPill />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={loadBunnyPreview} disabled={previewLoading || status === 'processing'}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50">
                    <Icon name="PlayCircleIcon" size={15} />
                    {status === 'processing' ? t('courseCreation.videoProcessing') : t('courseCreation.videoPreviewBtn')}
                  </button>
                  <button type="button" onClick={removeVideo} className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline">
                    <Icon name="TrashIcon" size={14} />
                    {t('courseCreation.videoRemove')}
                  </button>
                </div>
                {previewUrl && (
                  <div className="relative aspect-video rounded-md overflow-hidden bg-black">
                    <iframe src={previewUrl} className="absolute inset-0 w-full h-full" allow="encrypted-media; fullscreen" allowFullScreen />
                  </div>
                )}
              </div>
            ) : pct !== null ? (
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('courseCreation.videoUploading')} {pct}%</span>
                  <button type="button" onClick={cancelUpload} className="text-destructive hover:underline font-medium">{t('courseCreation.videoCancel')}</button>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ) : (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-smooth ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon name="CloudArrowUpIcon" size={32} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t('courseCreation.videoDropHint')}</span>
                <span className="text-xs text-muted-foreground">MP4, WebM, MOV</span>
                <input type="file" accept={ACCEPT} className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) startUpload(f); e.target.value = ''; }} />
              </label>
            )}
            {err && <p className="text-xs text-destructive">{err}</p>}
          </>
        )}

        {/* ─── Tashqi havola ─── */}
        {mode === 'link' && (
          <>
            <input
              type="url"
              inputMode="url"
              value={videoUrl}
              onChange={(e) => onChange({ videoUrl: e.target.value, videoProvider: null, streamUid: null })}
              placeholder={t('courseCreation.videoUrlPlaceholder')}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {linkSource.kind !== 'none' && (
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-xs ${linkSource.kind === 'unknown' ? 'text-warning' : 'text-success'}`}>
                  <Icon name={linkSource.kind === 'unknown' ? 'ExclamationTriangleIcon' : 'CheckCircleIcon'} size={14} />
                  {linkSource.kind === 'unknown' ? t('courseCreation.videoUnknown') : linkSource.kind.toUpperCase()}
                </span>
                {linkSource.kind !== 'unknown' && (
                  <button type="button" onClick={() => setShowLinkPreview((s) => !s)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                    <Icon name="PlayCircleIcon" size={15} />{t('courseCreation.videoPreviewBtn')}
                  </button>
                )}
              </div>
            )}
            {showLinkPreview && linkSource.kind !== 'unknown' && (
              <div className="relative aspect-video rounded-md overflow-hidden bg-black">
                {isEmbedKind(linkSource.kind) && linkSource.embedUrl ? (
                  <iframe src={linkSource.embedUrl} className="absolute inset-0 w-full h-full" allow="encrypted-media; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                ) : linkSource.fileUrl ? (
                  <video src={linkSource.fileUrl} controls className="absolute inset-0 w-full h-full" />
                ) : null}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('courseCreation.videoUrlHelp')}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LessonVideoInput;
