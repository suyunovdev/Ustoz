'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import { useCourseTopics, type CourseTopicDTO } from '@/hooks/queries/useCourseTopics';
import {
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  useReorderTopicsMutation,
  type TopicFormInput,
} from '@/hooks/mutations/useCourseTopicMutations';
import TopicMaterials from './TopicMaterials';

interface Props {
  courseId: string;
}

interface ModuleGroup {
  moduleTitle: string | null; // null = "Modulsiz"
  topics: CourseTopicDTO[];
}

function groupByModule(topics: CourseTopicDTO[]): ModuleGroup[] {
  // moduleTitle bo'yicha guruhlash, lekin orderIndex saqlanadi
  const groups = new Map<string, ModuleGroup>();
  for (const t of topics) {
    const key = t.moduleTitle ?? '__no_module__';
    if (!groups.has(key)) {
      groups.set(key, { moduleTitle: t.moduleTitle, topics: [] });
    }
    groups.get(key)!.topics.push(t);
  }
  // Original tartibga (birinchi mavjudlikka) ko'ra qaytaramiz
  return Array.from(groups.values());
}

const CourseDetailInteractive = ({ courseId }: Props) => {
  const { data, isLoading, error, refetch } = useCourseTopics(courseId);
  const createMut = useCreateTopicMutation(courseId);
  const updateMut = useUpdateTopicMutation(courseId);
  const deleteMut = useDeleteTopicMutation(courseId);
  const reorderMut = useReorderTopicsMutation(courseId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CourseTopicDTO | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CourseTopicDTO | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const topics = data?.topics ?? [];
  const groups = useMemo(() => groupByModule(topics), [topics]);
  const existingModules = useMemo(() => {
    const set = new Set<string>();
    for (const t of topics) {
      if (t.moduleTitle) set.add(t.moduleTitle);
    }
    return Array.from(set);
  }, [topics]);

  const handleCreateNew = () => {
    setEditingTopic(null);
    setEditorOpen(true);
  };

  const handleEdit = (topic: CourseTopicDTO) => {
    setEditingTopic(topic);
    setEditorOpen(true);
  };

  const handleSave = (input: TopicFormInput) => {
    if (editingTopic) {
      updateMut.mutate(
        { topicId: editingTopic.id, input },
        {
          onSuccess: () => {
            toast.success('Mavzu yangilandi');
            setEditorOpen(false);
            setEditingTopic(null);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createMut.mutate(input, {
        onSuccess: () => {
          toast.success("Mavzu qo'shildi");
          setEditorOpen(false);
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteMut.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Mavzu o'chirildi");
        setPendingDelete(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = Array.from(topics);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    reorderMut.mutate(reordered.map((t) => t.id), {
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/teacher-dashboard?tab=courses"
            className="text-sm text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-1"
          >
            <Icon name="ChevronLeftIcon" size={16} />
            Kurslarim'ga qaytish
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-1">
              Mavzular
            </h1>
            <p className="text-muted-foreground text-sm">
              Mavzular va sub-bo'limlar. Drag & drop bilan tartiblang.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkOpen(true)}
              className="px-3 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-smooth flex items-center gap-2 text-sm font-medium"
            >
              <Icon name="ArrowUpTrayIcon" size={16} />
              Bulk import
            </button>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth flex items-center gap-2 font-medium text-sm"
            >
              <Icon name="PlusIcon" size={18} />
              Yangi mavzu
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm flex items-center justify-between">
            <span>{error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              Qayta urinish
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-card rounded-md" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-card rounded-md shadow-warm p-12 text-center">
            <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Hozircha mavzular yo'q</h3>
            <p className="text-muted-foreground mb-6">
              Birinchi mavzuni qo'shib, kursingizni qurishni boshlang
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
              >
                Birinchi mavzu
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="px-6 py-3 border border-border text-foreground rounded-md hover:bg-muted transition-smooth font-medium"
              >
                Bulk import
              </button>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="topics">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {groups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-2">
                      {/* Module header */}
                      {group.moduleTitle && (
                        <h3 className="text-sm font-heading font-semibold text-muted-foreground mt-4 mb-1 px-2">
                          📂 {group.moduleTitle}
                        </h3>
                      )}
                      {group.topics.map((topic) => (
                        <Draggable
                          key={topic.id}
                          draggableId={topic.id}
                          index={topics.indexOf(topic)}
                        >
                          {(dProvided, dSnapshot) => (
                            <div
                              ref={dProvided.innerRef}
                              {...dProvided.draggableProps}
                              className={`bg-card rounded-md shadow-warm p-4 hover:shadow-warm-md transition-smooth ${
                                dSnapshot.isDragging ? 'ring-2 ring-primary shadow-warm-lg' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  {...dProvided.dragHandleProps}
                                  className="shrink-0 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                  aria-label="Tartiblash"
                                >
                                  <Icon name="Bars3Icon" size={18} />
                                </div>
                                <div className="text-xs text-muted-foreground w-6 text-center shrink-0 pt-1">
                                  {topic.orderIndex}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className="font-heading font-semibold text-foreground truncate">
                                      {topic.title}
                                    </h4>
                                    {topic.isFreePreview && (
                                      <span className="px-2 py-0.5 text-xs bg-success/10 text-success rounded-full">
                                        Bepul
                                      </span>
                                    )}
                                    {topic.isLocked && (
                                      <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded-full flex items-center gap-1">
                                        <Icon name="LockClosedIcon" size={10} />
                                        Qulflangan
                                      </span>
                                    )}
                                    {topic.hasQuiz && (
                                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                        Quiz
                                      </span>
                                    )}
                                  </div>
                                  {topic.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                      {topic.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>⏱️ {topic.duration}</span>
                                    {topic.videoUrl && <span>🎬 Video bor</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() =>
                                      setExpandedTopic(
                                        expandedTopic === topic.id ? null : topic.id,
                                      )
                                    }
                                    className="p-2 hover:bg-muted rounded transition-smooth"
                                    aria-label="Materiallar"
                                    title="Materiallar"
                                  >
                                    <Icon
                                      name={
                                        expandedTopic === topic.id
                                          ? 'ChevronUpIcon'
                                          : 'PaperClipIcon'
                                      }
                                      size={16}
                                      className="text-muted-foreground"
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(topic)}
                                    className="p-2 hover:bg-muted rounded transition-smooth"
                                    aria-label="Tahrirlash"
                                    title="Tahrirlash"
                                  >
                                    <Icon name="PencilIcon" size={16} className="text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => setPendingDelete(topic)}
                                    className="p-2 hover:bg-destructive/10 rounded transition-smooth"
                                    aria-label="O'chirish"
                                    title="O'chirish"
                                  >
                                    <Icon name="TrashIcon" size={16} className="text-destructive" />
                                  </button>
                                </div>
                              </div>
                              <TopicMaterials
                                topicId={topic.id}
                                expanded={expandedTopic === topic.id}
                                siblingTopics={topics
                                  .filter((t) => t.id !== topic.id)
                                  .map((t) => ({ id: t.id, title: t.title }))}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {editorOpen && (
        <TopicEditorModal
          topic={editingTopic}
          isLoading={createMut.isPending || updateMut.isPending}
          existingModules={existingModules}
          onSave={handleSave}
          onClose={() => {
            setEditorOpen(false);
            setEditingTopic(null);
          }}
        />
      )}

      {bulkOpen && (
        <BulkImportModal
          courseId={courseId}
          onClose={() => setBulkOpen(false)}
          onSuccess={() => {
            setBulkOpen(false);
            refetch();
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          open={true}
          title="Mavzuni o'chirish"
          message={`"${pendingDelete.title}" mavzusi butunlay o'chiriladi. Tegishli materiallar ham yo'qoladi.`}
          confirmLabel="O'chirish"
          variant="danger"
          isLoading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => !deleteMut.isPending && setPendingDelete(null)}
        />
      )}
    </div>
  );
};

// ─── Topic editor ─────────────────────────────────────────────────────────

function TopicEditorModal({
  topic,
  isLoading,
  existingModules,
  onSave,
  onClose,
}: {
  topic: CourseTopicDTO | null;
  isLoading: boolean;
  existingModules: string[];
  onSave: (input: TopicFormInput) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(topic?.title ?? '');
  const [description, setDescription] = useState(topic?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(topic?.videoUrl ?? '');
  const [duration, setDuration] = useState(topic?.duration ?? '0 min');
  const [content, setContent] = useState(topic?.content ?? '');
  const [moduleTitle, setModuleTitle] = useState(topic?.moduleTitle ?? '');
  const [hasQuiz, setHasQuiz] = useState(topic?.hasQuiz ?? false);
  const [isFreePreview, setIsFreePreview] = useState(topic?.isFreePreview ?? false);
  const [isLocked, setIsLocked] = useState(topic?.isLocked ?? false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiSuggest = async () => {
    if (title.trim().length < 2) {
      toast.error('Avval mavzu nomini kiriting');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/teacher/ai/topic-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === 'AI_NOT_CONFIGURED') {
          toast.error("AI hozircha sozlanmagan — admin'ga murojaat qiling");
        } else {
          toast.error(json.error || 'AI xatosi');
        }
        return;
      }
      setDescription(json.description);
      toast.success("AI tavsif yaratdi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      toast.error('Mavzu nomi kamida 2 belgi');
      return;
    }
    onSave({
      title,
      description: description || null,
      videoUrl: videoUrl || null,
      duration,
      content,
      moduleTitle: moduleTitle || null,
      hasQuiz,
      isFreePreview,
      isLocked,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-2xl w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {topic ? 'Mavzuni tahrirlash' : 'Yangi mavzu'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
            aria-label="Yopish"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mavzu nomi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Masalan: React Hooks asoslari"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Module selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Sub-bo'lim (module) — ixtiyoriy
            </label>
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              list="existing-modules"
              placeholder="Masalan: 1-bo'lim: Asoslar"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            {existingModules.length > 0 && (
              <datalist id="existing-modules">
                {existingModules.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            )}
          </div>

          {/* Description + AI button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">Tavsif</label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="text-xs px-2 py-1 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-smooth flex items-center gap-1 disabled:opacity-50"
              >
                {aiLoading ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="SparklesIcon" size={12} />
                )}
                AI tavsiya
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mavzuda nimalar o'rganiladi (qisqacha)"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Davomiyligi
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="15 min"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mavzu kontenti (matn)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Mavzuga oid matn, kod misollari, va h.k."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-y text-sm font-mono"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                className="w-4 h-4"
              />
              <span>🎁 Bepul preview (yozilmagan talabalar ham ko'rishi mumkin)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-4 h-4"
              />
              <span>🔒 Qulflangan (oldingisi tugagandan keyin ochiladi)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hasQuiz}
                onChange={(e) => setHasQuiz(e.target.checked)}
                className="w-4 h-4"
              />
              <span>📝 Mavzu testi mavjud</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-smooth font-medium disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {topic ? 'Saqlash' : "Qo'shish"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Bulk import modal ───────────────────────────────────────────────────

function BulkImportModal({
  courseId,
  onClose,
  onSuccess,
}: {
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);

  // Format: Title | Description | Duration | VideoURL | ModuleTitle
  // Har qator — bitta mavzu. | bilan ajratiladi.
  const parsed = useMemo(() => {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((line, idx) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        index: idx + 1,
        title: parts[0] ?? '',
        description: parts[1] || undefined,
        duration: parts[2] || undefined,
        videoUrl: parts[3] || undefined,
        moduleTitle: parts[4] || undefined,
      };
    });
  }, [raw]);

  const validCount = parsed.filter((p) => p.title.length >= 2).length;

  const handleImport = async () => {
    if (validCount === 0) {
      toast.error("Hech qanday yaroqli mavzu yo'q");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}/topics/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topics: parsed.filter((p) => p.title.length >= 2),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Bulk import xatosi');
        return;
      }
      toast.success(`${json.createdCount} ta mavzu qo'shildi${json.errorCount > 0 ? ` (${json.errorCount} xato)` : ''}`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-card rounded-md shadow-warm-lg max-w-3xl w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Bulk import — ko'p mavzu bir vaqtda
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
          <p className="mb-1">
            <strong>Format:</strong> har qatorda bitta mavzu. Ustunlar <code className="bg-card px-1 rounded">|</code> bilan ajratiladi:
          </p>
          <code className="block bg-card p-2 rounded">
            Title | Description | Duration | VideoURL | ModuleTitle
          </code>
          <p className="mt-2">Faqat Title majburiy, qolganlari ixtiyoriy. Excel'dan nusxa olib joylashtirish mumkin.</p>
        </div>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={12}
          placeholder={"React asoslari | React nima va u nima uchun kerak | 15 min | https://... | 1-bo'lim\nState va Props | Komponentlar orasida ma'lumot uzatish | 20 min | | 1-bo'lim"}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
        />

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {parsed.length} ta qator, <span className="text-success font-medium">{validCount} yaroqli</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-smooth font-medium disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleImport}
              disabled={loading || validCount === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {validCount} ta mavzu qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailInteractive;
