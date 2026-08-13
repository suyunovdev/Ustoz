'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTopicMaterials,
  type MaterialDTO,
  type MaterialTypeDTO,
} from '@/hooks/queries/useTopicMaterials';
import {
  useAddMaterialMutation,
  useDeleteMaterialMutation,
  useMoveMaterialMutation,
  useReplaceMaterialMutation,
  type MaterialFormInput,
} from '@/hooks/mutations/useMaterialMutations';
import { useI18n } from '@/contexts/I18nContext';

interface SiblingTopic {
  id: string;
  title: string;
}

interface Props {
  topicId: string;
  expanded: boolean;
  /** Boshqa topic'lar (move uchun) */
  siblingTopics?: SiblingTopic[];
}

const TYPE_LABEL: Record<MaterialTypeDTO, { labelKey: string; icon: string; color: string }> = {
  video: { labelKey: 'teacher.materialTypeVideo', icon: 'VideoCameraIcon', color: 'text-primary' },
  document: { labelKey: 'teacher.materialTypeDocument', icon: 'DocumentTextIcon', color: 'text-warning' },
  audio: { labelKey: 'teacher.materialTypeAudio', icon: 'MusicalNoteIcon', color: 'text-secondary' },
  image: { labelKey: 'teacher.materialTypeImage', icon: 'PhotoIcon', color: 'text-success' },
  external_link: { labelKey: 'teacher.materialTypeLink', icon: 'LinkIcon', color: 'text-muted-foreground' },
};

const TopicMaterials = ({ topicId, expanded, siblingTopics = [] }: Props) => {
  const { t } = useI18n();
  const { data, isLoading, error, refetch } = useTopicMaterials(topicId, expanded);
  const addMut = useAddMaterialMutation(topicId);
  const deleteMut = useDeleteMaterialMutation(topicId);
  const moveMut = useMoveMaterialMutation();
  const replaceMut = useReplaceMaterialMutation(topicId);
  const [adderOpen, setAdderOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MaterialDTO | null>(null);
  const [pendingMove, setPendingMove] = useState<MaterialDTO | null>(null);
  const [pendingReplace, setPendingReplace] = useState<MaterialDTO | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  if (!expanded) return null;

  const materials = data?.materials ?? [];

  const handleAdd = (input: MaterialFormInput) => {
    addMut.mutate(input, {
      onSuccess: () => {
        toast.success(t('teacher.materialAdded'));
        setAdderOpen(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteMut.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(t('teacher.materialDeleted'));
        setPendingDelete(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleMove = (destinationTopicId: string) => {
    if (!pendingMove) return;
    moveMut.mutate(
      {
        sourceTopicId: topicId,
        materialId: pendingMove.id,
        destinationTopicId,
      },
      {
        onSuccess: () => {
          toast.success(t('teacher.materialMoved'));
          setPendingMove(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleReplace = (input: { newFileUrl: string; newFileName?: string }) => {
    if (!pendingReplace) return;
    replaceMut.mutate(
      { materialId: pendingReplace.id, ...input },
      {
        onSuccess: () => {
          toast.success(t('teacher.materialReplaced'));
          setPendingReplace(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleTranscribe = async (material: MaterialDTO) => {
    if (!material.fileUrl) return;
    setTranscribingId(material.id);
    try {
      const res = await fetch(
        `/api/teacher/topics/${topicId}/materials/${material.id}/transcribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ language: 'uz' }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || t('teacher.transcribeHttpError', { status: res.status }));
        return;
      }
      try {
        await navigator.clipboard.writeText(json.transcript || '');
        toast.success(t('teacher.transcribeCopied'));
      } catch {
        toast.success(t('teacher.transcribeReady'));
      }
    } finally {
      setTranscribingId(null);
    }
  };

  const handleExport = () => {
    window.open(`/api/teacher/topics/${topicId}/materials/export`, '_blank');
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">
          📎 {t('teacher.materialsLabel')} ({materials.length})
        </p>
        <div className="flex items-center gap-2">
          {materials.length > 0 && (
            <button
              onClick={handleExport}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              title={t('teacher.downloadZip')}
            >
              <Icon name="ArrowDownTrayIcon" size={12} />
              ZIP
            </button>
          )}
          <button
            onClick={() => setAdderOpen(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Icon name="PlusIcon" size={12} />
            {t('teacher.add')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-destructive/10 text-xs text-destructive rounded flex items-center justify-between">
          <span>{error.message}</span>
          <button onClick={() => refetch()} className="underline">
            {t('teacher.retryShort')}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-8 bg-muted rounded" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          {t('teacher.materialsEmpty')}
        </p>
      ) : (
        <ul className="space-y-1">
          {materials.map((m) => {
            const type = TYPE_LABEL[m.materialType];
            const canTranscribe = m.materialType === 'video' || m.materialType === 'audio';
            return (
              <li
                key={m.id}
                className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm"
              >
                <Icon name={type.icon} size={14} className={type.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-foreground truncate">{m.title}</p>
                    {m.viewCount > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-0.5"
                        title={t('teacher.viewCountTitle')}
                      >
                        <Icon name="EyeIcon" size={10} />
                        {m.viewCount}
                      </span>
                    )}
                    {m.currentVersion > 1 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning rounded"
                        title={t('teacher.versionTitle')}
                      >
                        v{m.currentVersion}
                      </span>
                    )}
                    {m.storageType === 'r2' && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary rounded"
                        title={t('teacher.r2StorageTitle')}
                      >
                        R2
                      </span>
                    )}
                  </div>
                  {m.fileUrl && (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary truncate block"
                    >
                      {m.fileUrl}
                    </a>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{t(type.labelKey)}</span>

                {canTranscribe && (
                  <button
                    onClick={() => handleTranscribe(m)}
                    disabled={transcribingId === m.id}
                    className="p-1 hover:bg-secondary/10 rounded transition-smooth disabled:opacity-50"
                    aria-label={t('teacher.transcribeAria')}
                    title={t('teacher.transcribeTitle')}
                  >
                    {transcribingId === m.id ? (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <Icon name="MicrophoneIcon" size={12} className="text-secondary" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setPendingReplace(m)}
                  className="p-1 hover:bg-warning/10 rounded transition-smooth"
                  aria-label={t('teacher.replace')}
                  title={t('teacher.newVersionTitle')}
                >
                  <Icon name="ArrowPathIcon" size={12} className="text-warning" />
                </button>

                {siblingTopics.length > 0 && (
                  <button
                    onClick={() => setPendingMove(m)}
                    className="p-1 hover:bg-primary/10 rounded transition-smooth"
                    aria-label={t('teacher.moveAria')}
                    title={t('teacher.moveToTopicTitle')}
                  >
                    <Icon name="ArrowsRightLeftIcon" size={12} className="text-primary" />
                  </button>
                )}

                <button
                  onClick={() => setPendingDelete(m)}
                  className="p-1 hover:bg-destructive/10 rounded transition-smooth"
                  aria-label={t('teacher.menuDelete')}
                >
                  <Icon name="TrashIcon" size={12} className="text-destructive" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adderOpen && (
        <MaterialAdderModal
          topicId={topicId}
          isLoading={addMut.isPending}
          onAdd={handleAdd}
          onClose={() => setAdderOpen(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          open={true}
          title={t('teacher.deleteMaterialTitle')}
          message={t('teacher.deleteMaterialMessage', { title: pendingDelete.title })}
          confirmLabel={t('teacher.menuDelete')}
          variant="danger"
          isLoading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => !deleteMut.isPending && setPendingDelete(null)}
        />
      )}

      {pendingMove && (
        <MoveTopicModal
          material={pendingMove}
          topics={siblingTopics}
          isLoading={moveMut.isPending}
          onMove={handleMove}
          onClose={() => !moveMut.isPending && setPendingMove(null)}
        />
      )}

      {pendingReplace && (
        <ReplaceMaterialModal
          material={pendingReplace}
          isLoading={replaceMut.isPending}
          onReplace={handleReplace}
          onClose={() => !replaceMut.isPending && setPendingReplace(null)}
        />
      )}
    </div>
  );
};

function MaterialAdderModal({
  topicId,
  isLoading,
  onAdd,
  onClose,
}: {
  topicId: string;
  isLoading: boolean;
  onAdd: (input: MaterialFormInput) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState<MaterialTypeDTO>('video');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedR2Key, setUploadedR2Key] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const presignRes = await fetch(
        `/api/teacher/topics/${topicId}/materials/presign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        },
      );
      const presignJson = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        if (presignJson.code === 'R2_NOT_CONFIGURED') {
          toast.error(t('teacher.r2NotConfigured'));
        } else {
          toast.error(presignJson.error || t('teacher.presignHttpError', { status: presignRes.status }));
        }
        return;
      }
      const putRes = await fetch(presignJson.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) {
        toast.error(t('teacher.r2UploadHttpError', { status: putRes.status }));
        return;
      }
      setFileUrl(presignJson.publicUrl);
      setUploadedR2Key(presignJson.r2Key);
      if (!title) setTitle(file.name);
      toast.success(t('teacher.fileUploadedR2'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      toast.error(t('teacher.createGroupNameMinLength'));
      return;
    }
    onAdd({
      title,
      description: description || null,
      fileUrl: fileUrl || null,
      materialType,
      ...(uploadedR2Key ? { storageType: 'r2' as const, r2Key: uploadedR2Key } : {}),
    } as MaterialFormInput);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && !uploading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {t('teacher.newMaterial')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
            aria-label={t('teacher.close')}
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('teacher.materialNameLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t('teacher.materialNamePlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('teacher.typeLabel')}</label>
            <div className="grid grid-cols-5 gap-2">
              {(['video', 'document', 'audio', 'image', 'external_link'] as MaterialTypeDTO[]).map(
                (mt) => {
                  const type = TYPE_LABEL[mt];
                  const selected = materialType === mt;
                  return (
                    <button
                      key={mt}
                      type="button"
                      onClick={() => setMaterialType(mt)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-smooth ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon name={type.icon} size={18} />
                      <span className="text-xs">{t(type.labelKey)}</span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('teacher.urlLabel')}
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => {
                setFileUrl(e.target.value);
                setUploadedR2Key(null);
              }}
              placeholder={
                materialType === 'video'
                  ? 'https://youtube.com/watch?v=...'
                  : materialType === 'document'
                  ? 'https://drive.google.com/file/...'
                  : 'https://...'
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <div className="flex items-center gap-2 mt-1">
              <label className="text-xs text-primary hover:underline cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading ? t('teacher.payoutSettingsLoading') : t('teacher.uploadFileR2')}
              </label>
              <span className="text-xs text-muted-foreground">
                {t('teacher.orExternalUrl')}
              </span>
              {uploadedR2Key && (
                <span className="text-xs text-success">{t('teacher.inR2')}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('teacher.descOptionalLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading || uploading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-smooth font-medium disabled:opacity-50 text-sm"
          >
            {t('teacher.broadcastCancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading || uploading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('teacher.add')}
          </button>
        </div>
      </form>
    </div>
  );
}

function MoveTopicModal({
  material,
  topics,
  isLoading,
  onMove,
  onClose,
}: {
  material: MaterialDTO;
  topics: SiblingTopic[];
  isLoading: boolean;
  onMove: (destId: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {t('teacher.moveToTopicTitle')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded" aria-label={t('teacher.close')}>
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          "<strong>{material.title}</strong>" {t('teacher.moveToTopicQuestion')}
        </p>
        <ul className="space-y-1 max-h-72 overflow-y-auto">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                onClick={() => onMove(topic.id)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-primary/10 text-sm disabled:opacity-50"
              >
                {topic.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReplaceMaterialModal({
  material,
  isLoading,
  onReplace,
  onClose,
}: {
  material: MaterialDTO;
  isLoading: boolean;
  onReplace: (input: { newFileUrl: string; newFileName?: string }) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileUrl) {
      toast.error(t('teacher.newUrlRequired'));
      return;
    }
    onReplace({ newFileUrl, newFileName: newFileName || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {t('teacher.replaceMaterialTitle')}
          </h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded" aria-label={t('teacher.close')}>
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t('teacher.oldVersionSaved', { version: material.currentVersion })}
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('teacher.newUrlLabel')}</label>
            <input
              type="url"
              value={newFileUrl}
              onChange={(e) => setNewFileUrl(e.target.value)}
              required
              placeholder="https://..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('teacher.fileNameLabel')}
            </label>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            {t('teacher.broadcastCancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-warning text-warning-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('teacher.replace')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TopicMaterials;
