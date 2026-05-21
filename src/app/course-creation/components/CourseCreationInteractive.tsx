// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import CourseOutlinePanel from './CourseOutlinePanel';
import RichTextEditor from './RichTextEditor';
import CourseMetadataForm from './CourseMetadataForm';
import QuizBuilder from './QuizBuilder';
import PublishingControls from './PublishingControls';
import Icon from '@/components/ui/AppIcon';
import ContentUploadManager from './ContentUploadManager';
import { createClient } from '@/lib/supabase/client';

interface Topic {
  id: string;
  order: number;
  title: string;
  duration: string;
  hasQuiz: boolean;
  isExpanded: boolean;
  content: string;
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
  priceUSD: string;
  priceUZS: string;
  coverImage: string;
  language: string;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
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
    priceUSD: '',
    priceUZS: '',
    coverImage: '',
    language: '',
    targetAudience: '',
    subjectCategory: '',
    gradeLevel: '',
  });

  // Start with empty topics - no default fake topics
  const [topics, setTopics] = useState<Topic[]>([]);

  const [publishStatus, setPublishStatus] = useState<'draft' | 'preview' | 'submitted' | 'approved' | 'rejected'>('draft');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course creation tools...</p>
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
      title: `${topicNumber}-mavzu`,
      duration: '0 min',
      hasQuiz: false,
      isExpanded: false,
      content: '',
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

  const handleTopicReorder = (reorderedTopics: Topic[]) => {
    setTopics(reorderedTopics);
  };

  const handleContentChange = (content: string) => {
    if (!selectedTopicId) return;
    setTopics(prev => prev.map(t =>
      t.id === selectedTopicId ? { ...t, content } : t
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

  // Save course draft to Supabase
  const saveCourseToDatabase = async (status: 'draft' | 'submitted') => {
    const supabase = createClient();
    if (!supabase) return null;

    setIsSaving(true);
    setSaveError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveError('Iltimos, avval tizimga kiring');
        return null;
      }

      // Valid ENUM values for target_audience
      const validTargetAudiences = ['school_students', 'university_students', 'independent_learners'];
      // Valid ENUM values for subject_category
      const validSubjectCategories = [
        'mathematics', 'physics', 'chemistry', 'biology', 'geometry', 'algebra',
        'informatics', 'uzbek_language', 'english_language', 'russian_language',
        'history', 'geography', 'law', 'programming', 'web_development',
        'mobile_development', 'data_science', 'artificial_intelligence',
        'business_management', 'entrepreneurship', 'marketing', 'finance',
        'design', 'other'
      ];

      const targetAudience = validTargetAudiences.includes(metadata.targetAudience)
        ? metadata.targetAudience
        : 'school_students';

      const subjectCategory = validSubjectCategories.includes(metadata.subjectCategory)
        ? metadata.subjectCategory
        : 'other';

      const coursePayload = {
        teacher_id: user.id,
        title: metadata.title || 'Nomsiz kurs',
        description: metadata.description || '',
        category: metadata.category || 'general',
        target_audience: targetAudience,
        subject_category: subjectCategory,
        grade_level: metadata.gradeLevel ? parseInt(metadata.gradeLevel) : null,
        price_usd: parseFloat(metadata.priceUSD) || 0,
        price_uzs: parseInt(metadata.priceUZS) || 0,
        cover_image: metadata.coverImage || null,
        language: metadata.language || 'uz',
        is_published: status === 'submitted' ? true : false,
        updated_at: new Date().toISOString(),
      };

      let savedCourseId = courseDbId;

      if (courseDbId) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(coursePayload)
          .eq('id', courseDbId);
        if (error) throw error;
      } else {
        // Create new course
        const { data, error } = await supabase
          .from('courses')
          .insert(coursePayload)
          .select('id')
          .single();
        if (error) throw error;
        savedCourseId = data.id;
        setCourseDbId(data.id);
      }

      // Save topics
      if (savedCourseId && topics.length > 0) {
        for (const topic of topics) {
          const topicPayload = {
            course_id: savedCourseId,
            title: topic.title,
            order_index: topic.order,
            duration: topic.duration,
            content: topic.content,
            has_quiz: topic.hasQuiz,
            updated_at: new Date().toISOString(),
          };

          if (topic.dbId) {
            await supabase
              .from('course_topics')
              .update(topicPayload)
              .eq('id', topic.dbId);
          } else {
            const { data: topicData } = await supabase
              .from('course_topics')
              .insert(topicPayload)
              .select('id')
              .single();
            if (topicData) {
              setTopics(prev => prev.map(t =>
                t.id === topic.id ? { ...t, dbId: topicData.id } : t
              ));
            }
          }
        }
      }

      return savedCourseId;
    } catch (err: any) {
      setSaveError(err.message || 'Saqlashda xatolik yuz berdi');
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
    const id = await saveCourseToDatabase('submitted');
    if (id) {
      setPublishStatus('submitted');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

  const handleSectionChange = (sectionId: 'metadata' | 'content' | 'materials' | 'quiz' | 'publish') => {
    setActiveSection(sectionId);
    if (['content', 'materials', 'quiz'].includes(sectionId) && !selectedTopicId && topics.length > 0) {
      setSelectedTopicId(topics[0].id);
    }
  };

  const isValid = topics.length > 0 && topics.every(t => t.hasQuiz && t.questions.length >= 5);

  const sections = [
    { 
      id: 'metadata', 
      label: '1. Kurs Ma\'lumotlari', 
      icon: 'InformationCircleIcon',
      description: 'Kurs nomi, tavsif, narx va kategoriya',
      helpText: 'Kurs haqida umumiy ma\'lumotlarni kiriting'
    },
    { 
      id: 'content', 
      label: '2. Dars Matni', 
      icon: 'DocumentTextIcon',
      description: 'Matn, video darsliklar, tushuntirishlar',
      helpText: 'Har bir mavzu uchun o\'quv matnini yozing'
    },
    { 
      id: 'materials', 
      label: '3. Qo\'shimcha Fayllar', 
      icon: 'FolderIcon',
      description: 'PDF, Word, audio, video fayllar',
      helpText: 'O\'quvchilar yuklab olishi mumkin bo\'lgan materiallar'
    },
    { 
      id: 'quiz', 
      label: '4. Test Savollari', 
      icon: 'AcademicCapIcon',
      description: 'Bilimni tekshirish uchun savollar',
      helpText: 'Har bir mavzu uchun kamida 5 ta savol yarating'
    },
    { 
      id: 'publish', 
      label: '5. Nashr Qilish', 
      icon: 'PaperAirplaneIcon',
      description: 'Kursni ko\'rib chiqish va nashr qilish',
      helpText: 'Tayyor bo\'lgach kursni tasdiqlashga yuboring'
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

  const handleNext = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      handleSectionChange(nextSection.id as 'metadata' | 'content' | 'materials' | 'quiz' | 'publish');
    }
  };

  const canProceed = () => {
    switch (activeSection) {
      case 'metadata':
        // Only require title and description to proceed
        return !!(metadata.title && metadata.description);
      case 'content':
        // Allow proceeding if at least one topic exists (content can be added later)
        return topics.length > 0;
      case 'materials':
        // Materials are always optional
        return true;
      case 'quiz':
        // Allow proceeding even without quizzes — validation happens at publish
        return topics.length > 0;
      case 'publish':
        // For publish, require at minimum a title
        return !!(metadata.title);
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guide Modal */}
        {showGuideModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
            <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="AcademicCapIcon" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-semibold text-foreground">Kurs Yaratish Yo'riqnomasi</h3>
                    <p className="text-muted-foreground mt-1">5 bosqichda kurs yarating</p>
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
                          <strong>Nimani yuklash kerak:</strong> {section.helpText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-accent/10 rounded-md p-4 border border-accent/20">
                  <div className="flex items-start space-x-3">
                    <Icon name="LightBulbIcon" size={24} className="text-accent-foreground flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-accent-foreground mb-2">Muhim eslatma:</h4>
                      <ul className="space-y-1 text-sm text-accent-foreground">
                        <li>• <strong>Dars Matni</strong> - Bu o'quvchi o'qiydigan asosiy darslik</li>
                        <li>• <strong>Qo'shimcha Fayllar</strong> - PDF, Word, audio/video yuklab olish uchun</li>
                        <li>• <strong>Test Savollari</strong> - Bilimni tekshirish, ball olish uchun</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
              >
                Tushundim, boshlash
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-6 bg-card rounded-md shadow-warm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">Bosqich:</span>
              <span className="text-lg font-bold text-primary">{getCurrentStepNumber()} / 5</span>
            </div>
            <div className="flex items-center space-x-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Saqlanmoqda...</span>
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
                <span className="text-sm text-muted-foreground">Yo'riqnoma</span>
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
              <Icon name={sections.find(s => s.id === activeSection)?.icon as any} size={20} />
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
                    handleSectionChange(section.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 transition-smooth border-b border-border last:border-b-0 ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-1">
                    <Icon name={section.icon as any} size={20} />
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
                onTopicReorder={handleTopicReorder}
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mavzu tanlang:
                  </label>
                  <select
                    value={selectedTopicId || ''}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>Mavzuni tanlang</option>
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
                    <span className="text-sm font-medium">Yangi mavzu qo'shish</span>
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Section Tabs */}
            <div className="hidden lg:block space-y-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id as any)}
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
                      <Icon name={section.icon as any} size={20} />
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
                      <h4 className="font-semibold text-accent-foreground mb-1">1-bosqich: Kurs haqida ma'lumot</h4>
                      <p className="text-sm text-accent-foreground">
                        Kurs nomi, tavsif, narx va kategoriyasini kiriting. Bu ma'lumotlar o'quvchilarga ko'rsatiladi.
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
                    <p className="text-foreground font-medium mb-2">Hali mavzu qo'shilmagan</p>
                    <p className="text-sm text-muted-foreground mb-4">Chap paneldagi "Qo'shish" tugmasini bosib mavzu yarating</p>
                    <button
                      onClick={handleAddTopic}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
                    >
                      Birinchi mavzuni qo'shish
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
                          <h4 className="font-bold text-foreground text-lg mb-2">📝 Dars Matni</h4>
                          <p className="text-sm text-foreground">O'quvchilar o'qiydigan asosiy darslik matnini yozing.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-md shadow-warm p-4">
                      <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                        {selectedTopic.title}
                      </h3>
                      <p className="caption text-muted-foreground">
                        Mavzu uchun o'quv matnini yozing
                      </p>
                    </div>
                    <RichTextEditor
                      content={selectedTopic.content}
                      onContentChange={handleContentChange}
                    />
                  </>
                ) : (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="ArrowLeftIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Chap tarafdan mavzu tanlang</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'materials' && (
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="FolderIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">Hali mavzu qo'shilmagan</p>
                    <button onClick={handleAddTopic} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth">
                      Mavzu qo'shish
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
                          <h4 className="font-bold text-foreground text-lg mb-2">📁 Qo'shimcha Fayllar</h4>
                          <p className="text-sm text-foreground">O'quvchilar yuklab olishi mumkin bo'lgan materiallar.</p>
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
                    <p className="text-muted-foreground">Chap tarafdan mavzu tanlang</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'quiz' && (
              <div className="space-y-4">
                {topics.length === 0 ? (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">Hali mavzu qo'shilmagan</p>
                    <button onClick={handleAddTopic} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth">
                      Mavzu qo'shish
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
                          <h4 className="font-bold text-foreground text-lg mb-2">🎓 Test Savollari</h4>
                          <p className="text-sm text-foreground">Kamida 5 ta savol yarating. O'quvchilar 80% ball olsagina keyingi mavzuga o'ta oladilar.</p>
                        </div>
                      </div>
                    </div>
                    <QuizBuilder
                      questions={selectedTopic.questions}
                      onQuestionsChange={handleQuestionsChange}
                      topicTitle={selectedTopic.title}
                      teacherId={selectedTopic.dbId || selectedTopic.id}
                      testId={selectedTopic.dbId}
                    />
                  </>
                ) : (
                  <div className="bg-card rounded-md shadow-warm p-12 text-center">
                    <Icon name="ArrowLeftIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Chap tarafdan mavzu tanlang</p>
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
                      <h4 className="font-semibold text-accent-foreground mb-1">5-bosqich: Nashr qilish</h4>
                      <p className="text-sm text-accent-foreground">
                        Kursni ko'rib chiqing va tasdiqlashga yuboring. Admin 24-48 soat ichida ko'rib chiqadi.
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
                <h4 className="font-heading font-semibold text-foreground">Kurs Holati</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mavzular</span>
                    <span className="font-data font-medium text-foreground">{topics.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Testlar</span>
                    <span className="font-data font-medium text-foreground">
                      {topics.filter(t => t.hasQuiz).length}/{topics.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tayyor</span>
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
                  <span>Qoralama saqlash</span>
                </button>
              </div>

              {/* Current Step Guide */}
              <div className="bg-primary/10 rounded-md p-6 space-y-3 border border-primary/20">
                <div className="flex items-center space-x-2">
                  <Icon name="LightBulbIcon" size={20} className="text-primary" />
                  <h4 className="font-heading font-semibold text-primary">Joriy bosqich</h4>
                </div>
                <p className="text-sm text-foreground">
                  {sections.find(s => s.id === activeSection)?.helpText}
                </p>
              </div>

              {/* Tips Card */}
              <div className="bg-muted/50 rounded-md p-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Icon name="CheckCircleIcon" size={20} className="text-success" />
                  <h4 className="font-heading font-semibold text-foreground">Maslahatlar</h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Har bir mavzu uchun aniq va qisqa matn yozing</li>
                  <li>• Murakkab mavzularni video bilan tushuntiring</li>
                  <li>• Kamida 5 ta test savoli qo'shing</li>
                  <li>• Javoblarga batafsil izoh bering</li>
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
            <span className="font-medium">Oldingi</span>
          </button>

          <div className="text-sm text-muted-foreground">
            Bosqich {getCurrentStepNumber()} / {sections.length}
          </div>

          {getCurrentStepNumber() < sections.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium">Keyingi</span>
              <Icon name="ChevronRightIcon" size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-success text-white rounded-md hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="CheckIcon" size={20} />
              )}
              <span className="font-medium">Nashr qilish</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircleIcon" size={32} className="text-success" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              {publishStatus === 'draft' ? 'Qoralama saqlandi!' : 'Muvaffaqiyatli yuborildi!'}
            </h3>
            <p className="text-muted-foreground">
              {publishStatus === 'draft' ?'Kurs qoralama sifatida saqlandi. Istalgan vaqtda tahrirlashingiz mumkin.' :'Kurs ko\'rib chiqish uchun yuborildi. 24-48 soat ichida xabar beramiz.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCreationInteractive;