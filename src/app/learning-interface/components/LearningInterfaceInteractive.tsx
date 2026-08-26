'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from './VideoPlayer';
import CourseNavigation from './CourseNavigation';
import NoteTaking from './NoteTaking';
import DiscussionPanel from './DiscussionPanel';
import ResourceDownloads from './ResourceDownloads';
import AiTutorPanel from './AiTutorPanel';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { sanitizeHtml } from '@/lib/sanitize-html';
import type { CourseProgressResponse } from '@/types/dashboard.types';
import { useCompleteTopicMutation } from '@/hooks/mutations/useCompleteTopicMutation';
import { useI18n } from '@/contexts/I18nContext';
import { Skeleton, SkeletonText, SkeletonList } from '@/components/ui/Skeleton';

interface Topic {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isCurrent: boolean;
  videoUrl: string;
  content: string;
  moduleTitle: string;
}

interface Section {
  id: string;
  title: string;
  topics: Topic[];
}

interface Note {
  id: string;
  timestamp: string;
  content: string;
  videoTime: number;
}

const LearningInterfaceInteractive = () => {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [activePanel, setActivePanel] = useState<'ai' | 'notes' | 'discussion' | 'resources'>('ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const completeMutation = useCompleteTopicMutation();
  const isMarkingComplete = completeMutation.isPending;

  useEffect(() => {
    setIsHydrated(true);
    if (!courseId) {
      router.push('/student-dashboard');
      return;
    }
    loadCourse(courseId);

    // Fire-and-forget: lastAccessedAt'ni yangilash (dashboard hero uchun)
    fetch(`/api/enrollments/${courseId}/touch`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }, [courseId]);

  const loadCourse = async (id: string) => {
    setIsLoading(true);
    try {
      // Check auth via JWT
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) {
        router.push('/login?redirect=/learning-interface?courseId=' + id);
        return;
      }
      const me = await meRes.json();
      setUserId(me.user.id);

      // Load course details (includes topics + isEnrolled check)
      const courseRes = await fetch(`/api/courses/${id}`, { credentials: 'include' });
      if (!courseRes.ok) {
        router.push('/course-marketplace');
        return;
      }
      const { course } = await courseRes.json();

      if (!course.isEnrolled) {
        router.push(`/course-details?courseId=${id}`);
        return;
      }

      setCourseTitle(course.title);

      // Real progress + completed topic IDs (Source of Truth)
      const progRes = await fetch(`/api/enrollments/${id}/progress`, {
        credentials: 'include',
      });
      let completedIds = new Set<string>();
      if (progRes.ok) {
        const prog: CourseProgressResponse = await progRes.json();
        setEnrollmentProgress(prog.progress || 0);
        completedIds = new Set(prog.completedTopicIds);
      }

      const topics = course.topics || [];
      if (topics.length === 0) {
        setSections([]);
        return;
      }

      const mappedTopics: Topic[] = topics.map((t: Record<string, string>) => ({
        id: t.id,
        title: t.title,
        duration: t.duration || '—',
        isCompleted: completedIds.has(t.id),
        isCurrent: false,
        videoUrl: t.videoUrl || '',
        content: t.content || '',
        moduleTitle: t.moduleTitle || '',
      }));

      // URL'dan topicId yoki birinchi tugatilmagan
      const urlTopicId = searchParams.get('topicId');
      let initial = urlTopicId
        ? mappedTopics.find((t) => t.id === urlTopicId)
        : mappedTopics.find((t) => !t.isCompleted) ?? mappedTopics[0];
      if (initial) {
        initial = { ...initial, isCurrent: true };
        mappedTopics.forEach((t) => {
          t.isCurrent = t.id === initial!.id;
        });
        setCurrentTopic(initial);
      }

      setSections([
        {
          id: 'section-main',
          title: course.title,
          topics: mappedTopics,
        },
      ]);
    } catch (err) {
      console.error('Kurs yuklanmadi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicComplete = (topicId: string) => {
    if (!userId || !courseId || isMarkingComplete) return;

    // Lokal optimistic UI (sections) — dashboard cache esa mutation ichida yangilanadi
    const previousSections = sections;
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        topics: s.topics.map((t) =>
          t.id === topicId ? { ...t, isCompleted: true } : t,
        ),
      })),
    );

    completeMutation.mutate(
      { topicId, courseId },
      {
        onSuccess: (data) => {
          setEnrollmentProgress(data.progress);
          if (data.wasAlreadyCompleted) {
            toast.info(t('learning.topicAlreadyCompleted'));
          } else if (data.shouldShowCertificateModal) {
            toast.success(t('learning.courseFinished'));
            setShowCertificateModal(true);
          } else {
            toast.success(`Mavzu tugatildi · ${data.progress}%`);
          }
        },
        onError: (err) => {
          setSections(previousSections);
          toast.error(err.message || t('learning.networkError'));
        },
      },
    );
  };

  const handleTopicSelect = (topic: Topic) => {
    setCurrentTopic(topic);
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        topics: s.topics.map((t) => ({ ...t, isCurrent: t.id === topic.id })),
      }))
    );
  };

  const handleAddNote = (content: string) => {
    const note: Note = {
      id: Date.now().toString(),
      timestamp: new Date(currentTime * 1000).toISOString().substr(11, 8),
      content,
      videoTime: currentTime,
    };
    setNotes((prev) => [...prev, note]);
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-4 min-w-0">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-6 w-2/3" />
            <SkeletonText lines={3} />
          </div>
          <div className="hidden lg:block w-80 space-y-3">
            <Skeleton className="h-5 w-32" />
            <SkeletonList count={5} />
          </div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center">
          <Icon name="VideoCameraSlashIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('learning.noLessonsYet')}</h2>
          <p className="text-muted-foreground mb-6">{t('learning.teacherWillUpload')}</p>
          <button
            onClick={() => router.push('/student-dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Dashboardga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Mavzular bo'ylab navigatsiya (oldingi / keyingi)
  const allTopics = sections.flatMap((s) => s.topics);
  const currentIndex = allTopics.findIndex((tp) => tp.id === currentTopic?.id);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic =
    currentIndex >= 0 && currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen bg-background">
      {/* Certificate modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-warm-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-warning rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="TrophyIcon" size={40} variant="solid" className="text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              {t('learning.congratulations')}
            </h2>
            <p className="text-muted-foreground mb-2">
              Siz <span className="font-semibold text-foreground">"{courseTitle}"</span> kursini muvaffaqiyatli tugatdingiz!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Sertifikatingiz tayyorlanmoqda — profilingizda paydo bo'ladi.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => router.push('/student-certificates')}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Icon name="AcademicCapIcon" size={18} />
                Sertifikatlarim
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors font-medium"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kurs konteksti bari (sidebar layout ichida — fixed EMAS) */}
      <div className="flex-shrink-0 bg-card border-b border-border h-12 flex items-center gap-3 px-4 sm:px-6">
        <h1 className="text-sm font-medium text-foreground truncate min-w-0 flex-1">{courseTitle}</h1>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${enrollmentProgress}%` }}
            />
          </div>
          <span className="text-xs font-data tabular-nums text-muted-foreground">
            {enrollmentProgress}%
          </span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={t('learning.curriculumTitle')}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
        >
          <Icon name="ListBulletIcon" size={20} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Asosiy kontent — skroll bo'ladigan ustun */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Dars sarlavhasi */}
            <div className="space-y-3">
              {currentTopic?.moduleTitle && (
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {currentTopic.moduleTitle}
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground text-balance">
                    {currentTopic?.title}
                  </h2>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
                    {currentIndex >= 0 && (
                      <span className="flex items-center gap-1">
                        <Icon name="ListBulletIcon" size={15} />
                        {t('learning.topicPosition', { current: currentIndex + 1, total: allTopics.length })}
                      </span>
                    )}
                    {currentTopic?.duration && currentTopic.duration !== '—' && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="flex items-center gap-1">
                          <Icon name="ClockIcon" size={15} />
                          {currentTopic.duration}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {currentTopic?.isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success text-sm font-medium">
                      <Icon name="CheckCircleIcon" size={18} variant="solid" />
                      {t('learning.completedShort')}
                    </span>
                  ) : (
                    <button
                      onClick={() => currentTopic && handleTopicComplete(currentTopic.id)}
                      disabled={isMarkingComplete}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-warm"
                    >
                      {isMarkingComplete ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('learning.saving')}
                        </>
                      ) : (
                        <>
                          <Icon name="CheckIcon" size={16} />
                          {t('learning.markComplete')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Video (agar bor bo'lsa) — toza yaxlit konteyner */}
            {currentTopic?.videoUrl && (
              <div className="rounded-xl overflow-hidden shadow-warm-lg bg-black">
                <VideoPlayer
                  videoUrl={currentTopic.videoUrl}
                  title={currentTopic.title}
                  currentTime={currentTime}
                  onTimeUpdate={setCurrentTime}
                  playbackSpeed={playbackSpeed}
                  onSpeedChange={setPlaybackSpeed}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
              </div>
            )}

            {/* Dars matni (kontent) yoki bo'sh holat */}
            {currentTopic?.content ? (
              <article
                className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-a:text-primary prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentTopic.content) }}
              />
            ) : !currentTopic?.videoUrl ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <Icon name="DocumentTextIcon" size={40} className="text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">{t('learning.materialComingSoonTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('learning.materialComingSoon')}</p>
              </div>
            ) : null}

            {/* Oldingi / keyingi mavzu */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
              {prevTopic ? (
                <button
                  onClick={() => handleTopicSelect(prevTopic)}
                  className="inline-flex items-center gap-2 min-w-0 text-left rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                >
                  <Icon name="ArrowLeftIcon" size={18} className="text-muted-foreground flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">{t('learning.prevTopic')}</span>
                    <span className="block text-sm font-medium text-foreground truncate max-w-[36vw] sm:max-w-[16rem]">{prevTopic.title}</span>
                  </span>
                </button>
              ) : (
                <span />
              )}
              {nextTopic ? (
                <button
                  onClick={() => handleTopicSelect(nextTopic)}
                  className="inline-flex items-center gap-2 min-w-0 text-right rounded-lg px-3 py-2 hover:bg-muted transition-colors ml-auto"
                >
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">{t('learning.nextTopic')}</span>
                    <span className="block text-sm font-medium text-foreground truncate max-w-[36vw] sm:max-w-[16rem]">{nextTopic.title}</span>
                  </span>
                  <Icon name="ArrowRightIcon" size={18} className="text-primary flex-shrink-0" />
                </button>
              ) : (
                <span />
              )}
            </div>

            {/* Tablar: AI yordamchi / Eslatmalar / Muhokama / Materiallar */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
                {(['ai', 'notes', 'discussion', 'resources'] as const).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setActivePanel(panel)}
                    className={`flex items-center gap-1.5 px-4 sm:px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-smooth whitespace-nowrap ${
                      activePanel === panel
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {panel === 'ai' && (
                      <>
                        <Icon name="SparklesIcon" size={16} variant={activePanel === 'ai' ? 'solid' : 'outline'} />
                        {t('aiTutor.title')}
                      </>
                    )}
                    {panel === 'notes' && t('learning.notes')}
                    {panel === 'discussion' && t('learning.discussion')}
                    {panel === 'resources' && t('learning.materials')}
                  </button>
                ))}
              </div>
              <div className="p-4 sm:p-5">
                {activePanel === 'ai' && (
                  <AiTutorPanel
                    topicTitle={currentTopic?.title || ''}
                    topicContent={currentTopic?.content || ''}
                    courseTitle={courseTitle}
                  />
                )}
                {activePanel === 'notes' && (
                  <NoteTaking notes={notes} onAddNote={handleAddNote} currentTime={currentTime} onSeek={setCurrentTime} />
                )}
                {activePanel === 'discussion' && <DiscussionPanel topicId={currentTopic?.id || ''} />}
                {activePanel === 'resources' && <ResourceDownloads topicId={currentTopic?.id || ''} />}
              </div>
            </div>
          </div>
        </div>

        {/* Kurikulum paneli — desktop'da yon ustun, mobilda slide-over */}
        {isSidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed top-0 bottom-0 right-0 z-50 w-80 max-w-[85vw] border-l border-border bg-card overflow-y-auto lg:static lg:z-auto lg:max-w-none lg:flex-shrink-0">
              <CourseNavigation
                sections={sections}
                currentTopicId={currentTopic?.id || ''}
                onTopicChange={(tp) => {
                  handleTopicSelect(tp);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                progress={enrollmentProgress}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
};

export default LearningInterfaceInteractive;
