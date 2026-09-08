'use client';

import { useState, useEffect, useRef } from 'react';
import CourseOutlinePanel from './CourseOutlinePanel';
import RichTextEditor from './RichTextEditor';
import CourseMetadataForm from './CourseMetadataForm';
import QuizBuilder from './QuizBuilder';
import PublishingControls from './PublishingControls';
import Icon from '@/components/ui/AppIcon';
import { Skeleton, SkeletonForm } from '@/components/ui/Skeleton';
import ContentUploadManager from './ContentUploadManager';
import LessonVideoInput from './LessonVideoInput';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';

// Sehrgar qoralamasini brauzerda saqlash — sahifa yangilansa/yopilsa ish yo'qolmaydi.
const DRAFT_KEY = 'ustoz_course_draft_v1';

interface Topic {
  id: string;
  order: number;
  title: string;
  duration: string;
  hasQuiz: boolean;
  isExpanded: boolean;
  content: string;
  videoUrl: string;
  videoProvider?: 'bunny' | null; // 'bunny' = Bunny Stream (himoyalangan)
  streamUid?: string | null;       // Bunny Stream video GUID
  questions: QuizQuestion[];
  files: FileAttachment[];
  dbId?: string; // Supabase UUID
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface CourseMetadata {
  title: string;
  description: string;
  category: string;
  priceUZS: string;
  coverImage: string;
  language: string;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
  difficultyLevel: string;
}

interface TestQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  orderIndex: number;
}

const CourseCreationInteractive = () => {
  const { t } = useI18n();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'metadata' | 'content' | 'materials' | 'quiz' | 'publish'>('metadata');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [courseDbId, setCourseDbId] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<CourseMetadata>({
    title: '',
    description: '',
    category: '',
    priceUZS: '',
    coverImage: '',
    language: '',
    targetAudience: '',
    subjectCategory: '',
    gradeLevel: '',
    difficultyLevel: '',
  });

  // Start with empty topics - no default fake topics
  const [topics, setTopics] = useState<Topic[]>([]);

  const [publishStatus, setPublishStatus] = useState<'draft' | 'preview' | 'submitted' | 'approved' | 'rejected'>('draft');

  // Saqlanmagan o'zgarish bormi — beforeunload ogohlantirishi uchun.
  const dirtyRef = useRef(false);
  // Kurs moderatsiyaga yuborildi — avtosaqlash to'xtaydi, qoralama tozalanadi.
  const submittedRef = useRef(false);

  // Mount: hidratsiya + brauzerdagi qoralamani tiklash (bo'lsa).
  useEffect(() => {
    setIsHydrated(true);
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.metadata) setMetadata(d.metadata);
      if (Array.isArray(d.topics)) setTopics(d.topics);
      if (d.courseDbId) setCourseDbId(d.courseDbId);
      if (d.activeSection) setActiveSection(d.activeSection);
      if (d.selectedTopicId) setSelectedTopicId(d.selectedTopicId);
      if (d.publishStatus) setPublishStatus(d.publishStatus);
      // Mazmunli qoralama tiklandi — yo'riqnoma modalini yopib, xabar beramiz.
      if (d.metadata?.title || (Array.isArray(d.topics) && d.topics.length)) {
        setShowGuideModal(false);
        toast.info(t('courseCreation.draftRestored'));
      }
    } catch {
      /* buzilgan qoralama — e'tiborsiz */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avtosaqlash — o'zgarishdan 800ms keyin brauzerga yozamiz (har bosishda emas).
  useEffect(() => {
    if (!isHydrated || submittedRef.current) return;
    dirtyRef.current = true;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ metadata, topics, courseDbId, activeSection, selectedTopicId, publishStatus }),
        );
      } catch {
        /* kvota to'lgan bo'lishi mumkin — e'tiborsiz */
      }
    }, 800);
    return () => clearTimeout(id);
  }, [metadata, topics, courseDbId, activeSection, selectedTopicId, publishStatus, isHydrated]);

  // Sahifani yopish/yangilashda saqlanmagan o'zgarish bo'lsa ogohlantiramiz.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && !submittedRef.current && (metadata.title || topics.length > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [metadata.title, topics.length]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-md" />
            ))}
          </div>
          <SkeletonForm fields={5} />
        </div>
      </div>
    );
  }

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  const handleAddTopic = () => {
    const topicNumber = topics.length + 1;
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      order: topicNumber,
      title: t('courseCreation.defaultTopicTitle', { n: topicNumber }),
      duration: '0 min',
      hasQuiz: false,
      isExpanded: false,
      content: '',
      videoUrl: '',
      questions: [],
      files: []
    };
    setTopics(prev => [...prev, newTopic]);
    setSelectedTopicId(newTopic.id);
  };

  const handleTopicTitleChange = (topicId: string, newTitle: string) => {
    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, title: newTitle } : t
    ));
  };

  const handleDeleteTopic = (topicId: string) => {
    setTopics(prev => {
      const filtered = prev.filter(t => t.id !== topicId);
      return filtered.map((t, idx) => ({ ...t, order: idx + 1 }));
    });
    if (selectedTopicId === topicId) {
      setSelectedTopicId(null);
    }
  };

  const handleTopicReorder = (topics: Topic[]) => {
    setTopics(topics);
  };

  const handleContentChange = (content: string) => {
    if (!selectedTopicId) return;
    setTopics(prev => prev.map(t =>
      t.id === selectedTopicId ? { ...t, content } : t
    ));
  };


  // Mavzu davomiyligi (daqiqa) — bozorda jami vaqt shundan hisoblanadi (ilgari doim
  // "0 min" edi, natijada kurs "0 daqiqa" ko'rinardi).
  const handleDurationChange = (minutes: string) => {
    if (!selectedTopicId) return;
    const n = Math.max(0, parseInt(minutes) || 0);
    setTopics(prev => prev.map(t =>
      t.id === selectedTopicId ? { ...t, duration: `${n} min` } : t
    ));
  };

  const handleQuestionsChange = (questions: QuizQuestion[]) => {
    if (!selectedTopicId) return;
    setTopics(prev => prev.map(t =>
      t.id === selectedTopicId ? { ...t, questions, hasQuiz: questions.length >= 5 } : t
    ));
  };

  const handleFilesChange = (files: FileAttachment[]) => {
    if (!selectedTopicId) return;
    setTopics(prev => prev.map(t =>
      t.id === selectedTopicId ? { ...t, files } : t
    ));
  };

  // Save course draft via JWT API
  const saveCourseToDatabase = async (status: 'draft' | 'submitted') => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Tanlangan qiymatlar TO'G'RIDAN-TO'G'RI yuboriladi — server Prisma enum'ga
      // qarshi validatsiya qiladi (barcha ~90 fan / ~12 auditoriya). Ilgari client
      // qisqa (~24) whitelist bilan tanlovni 'other'/'school_students'ga jimgina
      // tushirib, ma'lumot yo'qotardi (masalan "Ashula" → "Boshqa").
      const targetAudience = metadata.targetAudience;
      const subjectCategory = metadata.subjectCategory;

      const topicsPayload = topics.map((t) => ({
        title: t.title,
        duration: t.duration,
        content: t.content,
        videoUrl: t.videoUrl?.trim() || null,
        videoProvider: t.videoProvider === 'bunny' ? 'bunny' : null,
        streamUid: t.videoProvider === 'bunny' ? (t.streamUid || null) : null,
        hasQuiz: t.hasQuiz,
        // Savollar kurs bilan bitta amalda saqlanadi (server test.service orqali
        // yozadi) — ilgari umuman yuborilmasdi va jimgina yo'qolardi.
        questions: t.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      }));

      const coursePayload: Record<string, string | number | boolean | null> = {
        title: metadata.title || t('courseCreation.untitledCourse'),
        description: metadata.description || '',
        category: metadata.category || 'general',
        targetAudience,
        subjectCategory,
        gradeLevel: metadata.gradeLevel ? parseInt(metadata.gradeLevel) : null,
        priceUzs: String(parseInt(metadata.priceUZS) || 0),
        coverImage: metadata.coverImage || null,
        language: metadata.language || 'uz',
        difficultyLevel: metadata.difficultyLevel || null,
        // Jami davomiylik — mavzu daqiqalari yig'indisi (bozor kartasi shuni ko'rsatadi)
        totalDuration: topics.reduce((sum, tp) => sum + (parseInt(tp.duration) || 0), 0),
        // Eslatma: `isPublished`ni o'qituvchi qo'ymaydi — kurs faqat admin
        // tasdig'idan keyin jonli bo'ladi (moderatsiya oqimi).
      };

      let savedCourseId = courseDbId;
      let warnings: string[] = [];

      if (courseDbId) {
        // PATCH existing course
        const res = await fetch(`/api/teacher/courses/${courseDbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...coursePayload, topics: topicsPayload }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Update failed (${res.status})`);
        }
        const data = await res.json().catch(() => ({}));
        warnings = Array.isArray(data?.warnings) ? data.warnings : [];
      } else {
        // POST new course
        const res = await fetch('/api/teacher/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...coursePayload, topics: topicsPayload }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Create failed (${res.status})`);
        }
        const data = await res.json();
        savedCourseId = data.course.id;
        setCourseDbId(savedCourseId);
        warnings = Array.isArray(data?.warnings) ? data.warnings : [];
        // Server yaratgan mavzu ID'larini (tartib bo'yicha) lokal mavzularga bog'laymiz —
        // keyingi PATCH va test-tahrirlash to'g'ri topicId bilan ishlashi uchun.
        const serverTopics: Array<{ id: string }> = Array.isArray(data.course?.topics)
          ? data.course.topics
          : [];
        if (serverTopics.length) {
          setTopics((prev) => prev.map((tp, i) => (serverTopics[i] ? { ...tp, dbId: serverTopics[i].id } : tp)));
        }
      }

      // Test bilan bog'liq ogohlantirishlar (masalan mavzuda 5 tadan kam savol)
      warnings.forEach((w) => toast.error(w));

      // Server bilan sinxron — saqlanmagan o'zgarish yo'q.
      dirtyRef.current = false;
      return savedCourseId;
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : t('courseCreation.saveError'));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const id = await saveCourseToDatabase('draft');
    if (id) {
      setPublishStatus('draft');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

  const handlePreview = () => {
    setPublishStatus('preview');
  };

  const handleSubmit = async () => {
    // 1) Kursni saqlash (draft holatida)
    const id = await saveCourseToDatabase('submitted');
    if (!id) return;
    // 2) Admin tekshiruviga yuborish
    setIsSaving(true);
    try {
      const res = await fetch(`/api/teacher/courses/${id}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || t('courseCreation.saveError'));
      }
      // Muvaffaqiyatli yuborildi — avtosaqlashni to'xtatib qoralamani tozalaymiz
      // (aks holda sahifa yopilishida "saqlanmagan" ogohlantirishi chiqardi).
      submittedRef.current = true;
      dirtyRef.current = false;
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setPublishStatus('submitted');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : t('courseCreation.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionChange = (sectionId: 'metadata' | 'content' | 'materials' | 'quiz' | 'publish') => {
    setActiveSection(sectionId);
    if (['content', 'materials', 'quiz'].includes(sectionId) && !selectedTopicId && topics.length > 0) {
      setSelectedTopicId(topics[0].id);
    }
  };

  const isValid = topics.length > 0 && topics.every(t => t.hasQuiz && t.questions.length >= 5);

  // Nashrga yuborish sharti — server (submit route) bilan bir xil. Ilgari faqat
  // `title` yetardi (checklist dekorativ edi). Endi tugma shu shartga bog'lanadi.
  const canPublish =
    !!metadata.title &&
    !!metadata.description &&
    !!metadata.coverImage &&
    topics.length > 0 &&
    topics.every((t) => t.content && t.content.trim().length > 0) &&
    topics.some((t) => t.questions.length >= 5);

  const sections = [
    { 
      id: 'metadata', 
      label: t('courseCreation.section1Label'), 
      icon: 'InformationCircleIcon',
      description: t('courseCreation.section1Desc'),
      helpText: t('courseCreation.section1Help')
    },
    { 
      id: 'content', 
      label: t('courseCreation.section2Label'), 
      icon: 'DocumentTextIcon',
      description: t('courseCreation.section2Desc'),
      helpText: t('courseCreation.section2Help')
    },
    { 
      id: 'materials', 
      label: t('courseCreation.section3Label'), 
      icon: 'FolderIcon',
      description: t('courseCreation.section3Desc'),
      helpText: t('courseCreation.section3Help')
    },
    { 
      id: 'quiz', 
      label: t('courseCreation.section4Label'), 
      icon: 'AcademicCapIcon',
      description: t('courseCreation.section4Desc'),
      helpText: t('courseCreation.section4Help')
    },
    { 
      id: 'publish', 
      label: t('courseCreation.section5Label'), 
      icon: 'PaperAirplaneIcon',
      description: t('courseCreation.section5Desc'),
      helpText: t('courseCreation.section5Help')
    }
  ];

  const getCurrentStepNumber = () => {
    const index = sections.findIndex(s => s.id === activeSection);
    return index + 1;
  };

  const handlePrevious = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      const previousSection = sections[currentIndex - 1];
      handleSectionChange(previousSection.id as 'metadata' | 'content' | 'materials' | 'quiz' | 'publish');
    }
  };

  // Joriy bosqichni tugatish uchun nima yetishmayotganini qaytaradi (yo'q bo'lsa null).
  // Ilgari "Keyingi" jimgina o'chib turardi — foydalanuvchi tugma buzilgan deb o'ylardi.
  const getStepError = (): string | null => {
    switch (activeSection) {
      case 'metadata':
        if (!metadata.title.trim()) return t('courseCreation.errTitleRequired');
        if (!metadata.description.trim()) return t('courseCreation.errDescRequired');
        return null;
      case 'content':
        if (topics.length === 0) return t('courseCreation.errNoTopics');
        return null;
      case 'quiz':
        if (topics.length === 0) return t('courseCreation.errNoTopics');
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const err = getStepError();
    if (err) {
      // Xatoni ko'rsatamiz (toast) — o'tkazib yubormaymiz.
      toast.error(err);
      return;
    }
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      handleSectionChange(nextSection.id as 'metadata' | 'content' | 'materials' | 'quiz' | 'publish');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guide Modal */}
        {showGuideModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="AcademicCapIcon" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-semibold text-foreground">{t('courseCreation.guideTitle')}</h3>
                    <p className="text-muted-foreground mt-1">{t('courseCreation.guideSubtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 hover:bg-muted rounded-md transition-smooth"
                >
                  <Icon name="XMarkIcon" size={24} className="text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-semibold text-foreground mb-1">{section.label}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-sm text-foreground">
                          <strong>{t('courseCreation.whatToUpload')}</strong> {section.helpText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-accent/10 rounded-md p-4 border border-accent/20">
                  <div className="flex items-start space-x-3">
                    <Icon name="LightBulbIcon" size={24} className="text-accent-foreground flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-accent-foreground mb-2">{t('courseCreation.importantNote')}</h4>
                      <ul className="space-y-1 text-sm text-accent-foreground">
                        <li>• {t('courseCreation.lessonTextNote')}</li>
                        <li>• {t('courseCreation.additionalFilesNote')}</li>
                        <li>• {t('courseCreation.testQuestionsNote')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
              >
                {t('courseCreation.guideStartBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-6 bg-card rounded-md shadow-warm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">{t('courseCreation.step')}:</span>
              <span className="text-lg font-bold text-primary">{getCurrentStepNumber()} / 5</span>
            </div>
            <div className="flex items-center space-x-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>{t('courseCreation.saving')}</span>
                </span>
              )}
              {saveError && (
                <span className="text-xs text-destructive">{saveError}</span>
              )}
              <button
                onClick={() => setShowGuideModal(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-smooth"
              >
                <Icon name="QuestionMarkCircleIcon" size={18} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('courseCreation.guide')}</span>
              </button>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(getCurrentStepNumber() / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Mobile Section Selector */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-md shadow-warm"
          >
            <div className="flex items-center space-x-3">
              <Icon name={sections.find(s => s.id === activeSection)?.icon || ''} size={20} />
              <span className="font-medium text-foreground">
                {sections.find(s => s.id === activeSection)?.label}
              </span>
            </div>
            <Icon name={isMobileMenuOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={20} />
          </button>

          {isMobileMenuOpen && (
            <div className="mt-2 bg-card rounded-md shadow-warm overflow-hidden">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    handleSectionChange(section.id as typeof activeSection);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 transition-smooth border-b border-border last:border-b-0 ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-1">
                    <Icon name={section.icon} size={20} />
                    <span className="font-medium">{section.label}</span>
                  </div>
                  <p className="text-xs opacity-90 ml-8">{section.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Course Outline */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24">
              <CourseOutlinePanel
                topics={topics}
                onTopicSelect={setSelectedTopicId}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onTopicReorder={handleTopicReorder as any}
                onAddTopic={handleAddTopic}
                onTopicTitleChange={handleTopicTitleChange}
                onDeleteTopic={handleDeleteTopic}
                selectedTopicId={selectedTopicId}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6 space-y-6">
            {/* Mobile Topic Selector */}
            {['content', 'materials', 'quiz'].includes(activeSection) && (
              <div className="lg:hidden">
                <div className="bg-card rounded-md shadow-warm p-4">
                  <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.selectTopic')}</label>
                  <select
                    value={selectedTopicId || ''}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>{t('courseCreation.selectTopicPlaceholder')}</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.order}. {topic.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddTopic}
                    className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
                  >
                    <Icon name="PlusIcon" size={18} />
                    <span className="text-sm font-medium">{t('courseCreation.addNewTopic')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Section Tabs */}
            <div className="hidden lg:block space-y-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id as typeof activeSection)}
                  className={`w-full text-left px-6 py-4 rounded-md transition-smooth border-2 ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-warm'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activeSection === section.id ? 'bg-primary-foreground/20' : 'bg-muted'
                    }`}>
                      <Icon name={section.icon} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-heading font-semibold mb-1">{section.label}</div>
                      <div className={`text-sm ${
                        activeSection === section.id ? 'opacity-90' : 'text-muted-foreground'
                      }`}>
                        {section.description}
                      </div>
                    </div>
                    {activeSection === section.id && (
                      <Icon name="ChevronRightIcon" size={20} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Content Sections */}
            {activeSection === 'metadata' && (
              <div className="space-y-4">
                <div className="bg-accent/10 rounded-md p-4 border border-accent/20">
                  <div className="flex items-start space-x-3">
                    <Icon name="InformationCircleIcon" size={24} className="text-accent-foreground flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-accent-foreground mb-1">{t('courseCreation.step1Info')}</h4>
                      <p className="text-sm text-accent-foreground">
                        {t('courseCreation.step1InfoDesc')}
                      </p>
                    </div>
                  </div>
                </div>
                <CourseMetadataForm
                  metadata={metadata}
                  onMetadataChange={setMetadata}
                />
              </div>
            )}

            {activeSection === 'content' && (
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">{t('courseCreation.noTopicsYet')}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t('courseCreation.addTopicHint')}</p>
                    <button
                      onClick={handleAddTopic}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
                    >
                      {t('courseCreation.addFirstTopic')}
                    </button>
                  </div>
                ) : selectedTopic ? (
                  <>
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-5 border-2 border-blue-500/30">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon name="DocumentTextIcon" size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-lg mb-2">{t('courseCreation.lessonText')}</h4>
                          <p className="text-sm text-foreground">{t('courseCreation.lessonTextDesc')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-md shadow-warm p-4">
                      <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                        {selectedTopic.title}
                      </h3>
                      <p className="caption text-muted-foreground">
                        {t('courseCreation.writeTopicText')}
                      </p>
                    </div>

                    {/* Dars videosi — yagona uploader (Himoyalangan Bunny | Tashqi havola) */}
                    <LessonVideoInput
                      topicTitle={selectedTopic.title}
                      videoUrl={selectedTopic.videoUrl}
                      videoProvider={selectedTopic.videoProvider ?? null}
                      streamUid={selectedTopic.streamUid ?? null}
                      onChange={(patch) =>
                        setTopics((prev) => prev.map((tp) => (tp.id === selectedTopicId ? { ...tp, ...patch } : tp)))
                      }
                    />

                    {/* Mavzu davomiyligi (daqiqa) — jami kurs vaqti shundan hisoblanadi */}
                    <div className="bg-card rounded-md shadow-warm p-4 space-y-2">
                      <label htmlFor="topic-duration" className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon name="ClockIcon" size={18} className="text-primary" />
                        {t('courseCreation.topicDurationLabel')}
                      </label>
                      <div className="relative w-40">
                        <input
                          id="topic-duration"
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="5"
                          value={parseInt(selectedTopic.duration) || 0}
                          onChange={(e) => handleDurationChange(e.target.value)}
                          className="w-full px-3 py-2 pr-16 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {t('courseCreation.minutesUnit')}
                        </span>
                      </div>
                    </div>

                    <RichTextEditor
                      content={selectedTopic.content}
                      onContentChange={handleContentChange}
                    />
                  </>
                ) : (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="ArrowLeftIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">{t('courseCreation.selectTopicLeft')}</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'materials' && (
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="FolderIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">{t('courseCreation.noTopicsYet')}</p>
                    <button onClick={handleAddTopic} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth">
                      {t('courseCreation.addTopic')}
                    </button>
                  </div>
                ) : selectedTopic ? (
                  <>
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg p-5 border-2 border-purple-500/30">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon name="FolderIcon" size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-lg mb-2">{t('courseCreation.additionalFiles')}</h4>
                          <p className="text-sm text-foreground">{t('courseCreation.additionalFilesDesc')}</p>
                        </div>
                      </div>
                    </div>
                    <ContentUploadManager
                      materialId={selectedTopic.id}
                      files={selectedTopic.files}
                      onFilesChange={handleFilesChange}
                    />
                  </>
                ) : (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="ArrowLeftIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('courseCreation.selectTopicLeft')}</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'quiz' && (
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">{t('courseCreation.noTopicsYet')}</p>
                    <button onClick={handleAddTopic} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth">
                      {t('courseCreation.addTopic')}
                    </button>
                  </div>
                ) : selectedTopic ? (
                  <>
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg p-5 border-2 border-green-500/30">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon name="AcademicCapIcon" size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-lg mb-2">{t('courseCreation.testQuestions')}</h4>
                          <p className="text-sm text-foreground">{t('courseCreation.testQuestionsDesc')}</p>
                        </div>
                      </div>
                    </div>
                    <QuizBuilder
                      questions={selectedTopic.questions}
                      onQuestionsChange={handleQuestionsChange}
                      topicTitle={selectedTopic.title}
                    />
                  </>
                ) : (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="ArrowLeftIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('courseCreation.selectTopicLeft')}</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'publish' && (
              <div className="space-y-4">
                <div className="bg-accent/10 rounded-md p-4 border border-accent/20">
                  <div className="flex items-start space-x-3">
                    <Icon name="PaperAirplaneIcon" size={24} className="text-accent-foreground flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-accent-foreground mb-1">{t('courseCreation.step5Info')}</h4>
                      <p className="text-sm text-accent-foreground">
                        {t('courseCreation.step5InfoDesc')}
                      </p>
                    </div>
                  </div>
                </div>
                <PublishingControls
                  status={publishStatus}
                  onSaveDraft={handleSaveDraft}
                  onPreview={handlePreview}
                  onSubmit={handleSubmit}
                  isValid={isValid}
                  canPublish={canPublish}
                  metadata={metadata}
                  topics={topics}
                  isSaving={isSaving}
                  saveError={saveError}
                />
              </div>
            )}
          </div>

          {/* Right Panel - Quick Actions */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Progress Card */}
              <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
                <h4 className="font-heading font-semibold text-foreground">{t('courseCreation.courseStatus')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('courseCreation.topics')}</span>
                    <span className="font-data font-medium text-foreground">{topics.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('courseCreation.tests')}</span>
                    <span className="font-data font-medium text-foreground">
                      {topics.filter(t => t.hasQuiz).length}/{topics.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('courseCreation.ready')}</span>
                    <span className="font-data font-medium text-foreground">
                      {topics.length > 0 ? Math.round((topics.filter(t => t.hasQuiz).length / topics.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
                {/* Quick save button */}
                <button
                  onClick={handleSaveDraft}
                  disabled={isSaving || !metadata.title}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth disabled:opacity-50 text-sm"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="DocumentIcon" size={16} />
                  )}
                  <span>{t('courseCreation.saveDraft')}</span>
                </button>
              </div>

              {/* Current Step Guide */}
              <div className="bg-primary/10 rounded-md p-6 space-y-3 border border-primary/20">
                <div className="flex items-center space-x-2">
                  <Icon name="LightBulbIcon" size={20} className="text-primary" />
                  <h4 className="font-heading font-semibold text-primary">{t('courseCreation.currentStep')}</h4>
                </div>
                <p className="text-sm text-foreground">
                  {sections.find(s => s.id === activeSection)?.helpText}
                </p>
              </div>

              {/* Tips Card */}
              <div className="bg-muted/50 rounded-md p-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircleIcon" size={20} className="text-success" />
                  <h4 className="font-heading font-semibold text-foreground">{t('courseCreation.tips')}</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {t('courseCreation.tip1')}</li>
                  <li>• {t('courseCreation.tip2')}</li>
                  <li>• {t('courseCreation.tip3')}</li>
                  <li>• {t('courseCreation.tip4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-border">
          <button
            onClick={handlePrevious}
            disabled={getCurrentStepNumber() === 1}
            className="flex items-center space-x-2 px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="ChevronLeftIcon" size={20} />
            <span className="font-medium">{t('courseCreation.previous')}</span>
          </button>

          <div className="text-sm text-muted-foreground">
            {t('courseCreation.step')} {getCurrentStepNumber()} / {sections.length}
          </div>

          {getCurrentStepNumber() < sections.length ? (
            <button
              onClick={handleNext}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium">{t('courseCreation.next')}</span>
              <Icon name="ChevronRightIcon" size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canPublish || isSaving}
              title={!canPublish ? t('courseCreation.publishBlockedHint') : undefined}
              className="flex items-center space-x-2 px-6 py-3 bg-success text-white rounded-md hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="CheckIcon" size={20} />
              )}
              <span className="font-medium">{t('courseCreation.publish')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircleIcon" size={32} className="text-success" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              {publishStatus === 'draft' ? t('courseCreation.draftSaved') : t('courseCreation.successSubmitted')}
            </h3>
            <p className="text-muted-foreground">
              {publishStatus === 'draft' ?t('courseCreation.draftSavedDesc') :t('courseCreation.successSubmittedDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCreationInteractive;