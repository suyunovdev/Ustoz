// @ts-nocheck
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

  useEffect(() => {
    setIsHydrated(true);
    if (!courseId) {
      router.push('/student-dashboard');
      return;
    }
    loadCourse(courseId);
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

      // Get current progress
      const progRes = await fetch(`/api/progress?courseId=${id}`, { credentials: 'include' });
      if (progRes.ok) {
        const prog = await progRes.json();
        setEnrollmentProgress(prog.progress || 0);
      }

      const topics = course.topics || [];
      if (topics.length === 0) {
        setSections([]);
        return;
      }

      // Completed topics derived from progress percentage (proportional)
      const progressPct = Number(course.progress || 0);
      const completedCountApprox = Math.round((topics.length * progressPct) / 100);

      const mappedTopics: Topic[] = topics.map((t: any, i: number) => ({
        id: t.id,
        title: t.title,
        duration: t.duration || '—',
        isCompleted: i < completedCountApprox,
        isCurrent: i === completedCountApprox,
        videoUrl: t.content || '',
      }));

      setSections([
        {
          id: 'section-main',
          title: course.title,
          topics: mappedTopics,
        },
      ]);

      const firstCurrent = mappedTopics.find((t) => t.isCurrent) || mappedTopics[0];
      if (firstCurrent) setCurrentTopic(firstCurrent);
    } catch (err) {
      console.error('Kurs yuklanmadi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicComplete = async (topicId: string) => {
    if (!userId || !courseId) return;
    try {
      // Calculate new progress based on completed topics in local state
      const allTopics = sections.flatMap((s) => s.topics);
      const completedCount =
        allTopics.filter((t) => t.isCompleted || t.id === topicId).length;
      const newProgress = Math.round((completedCount / allTopics.length) * 100);

      // Update progress via JWT API
      await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId, progress: newProgress }),
      });

      // Update local state
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          topics: s.topics.map((t) => (t.id === topicId ? { ...t, isCompleted: true } : t)),
        }))
      );
      setEnrollmentProgress(newProgress);
    } catch (err) {
      console.error('Mavzu tugallanmadi:', err);
    }
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
                onTimeUpdate={setCurrentTime}
                playbackSpeed={playbackSpeed}
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
                  className="flex items-center gap-2 px-4 py-1.5 bg-success text-white rounded-md text-sm hover:bg-success/90 transition-colors"
                >
                  <Icon name="CheckIcon" size={16} />
                  Tugallandi
                </button>
              )}
              {currentTopic?.isCompleted && (
                <span className="flex items-center gap-1 text-success text-sm">
                  <Icon name="CheckCircleIcon" size={16} variant="solid" />
                  Bajarildi
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
              <InteractiveTranscript transcript={[]} currentTime={currentTime} onSeek={setCurrentTime} />
            )}
            {activePanel === 'notes' && (
              <NoteTaking notes={notes} onAddNote={handleAddNote} currentTime={currentTime} />
            )}
            {activePanel === 'discussion' && (
              <DiscussionPanel topicId={currentTopic?.id || ''} userId={userId || ''} />
            )}
            {activePanel === 'resources' && (
              <ResourceDownloads resources={[]} />
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
              onTopicSelect={handleTopicSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningInterfaceInteractive;
