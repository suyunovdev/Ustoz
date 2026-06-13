'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from './VideoPlayer';
import CourseNavigation from './CourseNavigation';
import InteractiveTranscript from './InteractiveTranscript';
import NoteTaking from './NoteTaking';
import ProgressTracker from './ProgressTracker';
import DiscussionPanel from './DiscussionPanel';
import ResourceDownloads from './ResourceDownloads';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import type { CourseProgressResponse } from '@/types/dashboard.types';
import { useCompleteTopicMutation } from '@/hooks/mutations/useCompleteTopicMutation';

interface Topic {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isCurrent: boolean;
  videoUrl: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [activePanel, setActivePanel] = useState<'transcript' | 'notes' | 'discussion' | 'resources'>('transcript');
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
        videoUrl: t.content || '',
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
            toast.info('Bu mavzu allaqachon tugatilgan');
          } else if (data.shouldShowCertificateModal) {
            toast.success('Kurs tugatildi! Progress: 100%');
            setShowCertificateModal(true);
          } else {
            toast.success(`Mavzu tugatildi · ${data.progress}%`);
          }
        },
        onError: (err) => {
          setSections(previousSections);
          toast.error(err.message || "Tarmoq xatosi. Qayta urinib ko'ring.");
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
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <Icon name="VideoCameraSlashIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Darslar hali qo'shilmagan</h2>
          <p className="text-muted-foreground mb-6">O'qituvchi tez orada darslarni yuklaydi</p>
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

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Certificate modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-warm-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-warning rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="TrophyIcon" size={40} variant="solid" className="text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              Tabriklaymiz! 🎉
            </h2>
            <p className="text-muted-foreground mb-2">
              Siz <span className="font-semibold text-foreground">"{courseTitle}"</span> kursini muvaffaqiyatli tugatdingiz!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Sertifikatingiz tayyorlanmoqda — profilingizda paydo bo'ladi.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => router.push('/certificates')}
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

      {/* Top bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-card border-b border-border h-12 flex items-center px-4 gap-4">
        <button onClick={() => router.push('/student-dashboard')} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="ArrowLeftIcon" size={20} />
        </button>
        <h1 className="text-sm font-medium text-foreground flex-1 truncate">{courseTitle}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="ChartBarIcon" size={16} />
          <span>{enrollmentProgress}% bajarildi</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name={isSidebarOpen ? 'ChevronRightIcon' : 'ChevronLeftIcon'} size={20} />
        </button>
      </div>

      <div className="pt-12 flex h-[calc(100vh-7rem)]">
        {/* Main content */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
          {/* Video area */}
          <div className="bg-black flex-shrink-0" style={{ aspectRatio: '16/9', maxHeight: '60vh' }}>
            {currentTopic?.videoUrl ? (
              <VideoPlayer
                videoUrl={currentTopic.videoUrl}
                title={currentTopic.title}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
                playbackSpeed={playbackSpeed}
                onSpeedChange={setPlaybackSpeed}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Icon name="PlayCircleIcon" size={64} className="text-white/30 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">
                    {currentTopic ? `"${currentTopic.title}" — video yuklanmagan` : 'Mavzu tanlang'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Topic info */}
          <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground truncate">{currentTopic?.title}</h2>
            <div className="flex items-center gap-3">
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="text-sm bg-background border border-border rounded px-2 py-1"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
              {currentTopic && !currentTopic.isCompleted && (
                <button
                  onClick={() => handleTopicComplete(currentTopic.id)}
                  disabled={isMarkingComplete}
                  className="flex items-center gap-2 px-4 py-1.5 bg-success text-white rounded-md text-sm hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMarkingComplete ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Icon name="CheckIcon" size={16} />
                      Mavzuni tugatdim
                    </>
                  )}
                </button>
              )}
              {currentTopic?.isCompleted && (
                <span className="flex items-center gap-1 text-success text-sm font-medium">
                  <Icon name="CheckCircleIcon" size={16} variant="solid" />
                  Tugatildi
                </span>
              )}
            </div>
          </div>

          {/* Panels */}
          <div className="flex border-b border-border bg-card">
            {(['transcript', 'notes', 'discussion', 'resources'] as const).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`px-4 py-2.5 text-sm font-medium transition-smooth border-b-2 ${
                  activePanel === panel
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {panel === 'transcript' && 'Transkript'}
                {panel === 'notes' && 'Eslatmalar'}
                {panel === 'discussion' && 'Muhokama'}
                {panel === 'resources' && 'Materiallar'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'transcript' && (
              <InteractiveTranscript segments={[]} currentTime={currentTime} onSeek={setCurrentTime} />
            )}
            {activePanel === 'notes' && (
              <NoteTaking notes={notes} onAddNote={handleAddNote} currentTime={currentTime} onSeek={setCurrentTime} />
            )}
            {activePanel === 'discussion' && (
              <DiscussionPanel topicId={currentTopic?.id || ''} />
            )}
            {activePanel === 'resources' && (
              <ResourceDownloads topicId={currentTopic?.id || ''} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-foreground text-sm">O'quv dasturi</h3>
            </div>
            <CourseNavigation
              sections={sections}
              currentTopicId={currentTopic?.id || ''}
              onTopicChange={handleTopicSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningInterfaceInteractive;
