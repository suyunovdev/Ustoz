'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import GroupMetadataForm from './GroupMetadataForm';
import StudentSelectionPanel from './StudentSelectionPanel';
import GroupBalancingPanel from './GroupBalancingPanel';
import GroupReviewPanel from './GroupReviewPanel';
import { createClient } from '@/lib/supabase/client';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  performance: 'high' | 'medium' | 'low';
  attendance: number;
  averageScore: number;
  enrolledCourses: string[];
}

interface GroupMetadata {
  name: string;
  description: string;
  courseId: string;
  maxStudents: number;
  balancingStrategy: 'performance' | 'random' | 'manual';
}

interface SavedGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  studentCount: number;
  createdAt: string;
  balancingStrategy: string;
}

const GroupCreationInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [activeStep, setActiveStep] = useState<'metadata' | 'selection' | 'balancing' | 'review'>('metadata');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<SavedGroup | null>(null);

  const [metadata, setMetadata] = useState<GroupMetadata>({
    name: '',
    description: '',
    courseId: '',
    maxStudents: 30,
    balancingStrategy: 'performance'
  });

  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [availableStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alisher Karimov',
      email: 'alisher@example.com',
      avatar: '/assets/images/no_image.png',
      performance: 'high',
      attendance: 95,
      averageScore: 88,
      enrolledCourses: ['Matematika', 'Fizika']
    },
    {
      id: '2',
      name: 'Dilnoza Rahimova',
      email: 'dilnoza@example.com',
      avatar: '/assets/images/no_image.png',
      performance: 'high',
      attendance: 92,
      averageScore: 85,
      enrolledCourses: ['Matematika', 'Kimyo']
    },
    {
      id: '3',
      name: 'Sardor Tursunov',
      email: 'sardor@example.com',
      avatar: '/assets/images/no_image.png',
      performance: 'medium',
      attendance: 78,
      averageScore: 72,
      enrolledCourses: ['Matematika']
    },
    {
      id: '4',
      name: 'Madina Yusupova',
      email: 'madina@example.com',
      avatar: '/assets/images/no_image.png',
      performance: 'medium',
      attendance: 85,
      averageScore: 75,
      enrolledCourses: ['Fizika', 'Kimyo']
    },
    {
      id: '5',
      name: 'Bobur Aliyev',
      email: 'bobur@example.com',
      avatar: '/assets/images/no_image.png',
      performance: 'low',
      attendance: 65,
      averageScore: 58,
      enrolledCourses: ['Matematika']
    },
    {
      id: '6',
      name: 'Zarina Nazarova',
      email: 'zarina@example.com',
      avatar: '/assets/images/no_image.png',
      performance: 'low',
      attendance: 70,
      averageScore: 62,
      enrolledCourses: ['Fizika']
    }
  ]);

  useEffect(() => {
    setIsHydrated(true);
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Try to load from Supabase
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSavedGroups(data.map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description || '',
            courseId: g.course_id || '',
            studentCount: g.student_count || 0,
            createdAt: g.created_at,
            balancingStrategy: g.balancing_strategy || 'performance'
          })));
          setLoadingGroups(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load groups from DB:', err);
    }

    // Load from localStorage as fallback
    try {
      const stored = localStorage.getItem('ustoz_groups');
      if (stored) {
        setSavedGroups(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
    setLoadingGroups(false);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Guruh ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'metadata', label: "1. Guruh Ma\'lumotlari", icon: 'InformationCircleIcon', helpText: "Guruh haqida umumiy ma\'lumotlarni kiriting" },
    { id: 'selection', label: "2. O\'quvchilarni Tanlash", icon: 'UserGroupIcon', helpText: "Qidiruv va filtrlar yordamida o\'quvchilarni tanlang" },
    { id: 'balancing', label: '3. Guruh Balansi', icon: 'ScaleIcon', helpText: "Guruhni natija va darajaga ko\'ra muvozanatlang" },
    { id: 'review', label: "4. Ko\'rib Chiqish", icon: 'CheckCircleIcon', helpText: "Guruh ma\'lumotlarini tekshiring va saqlang" }
  ];

  const getCurrentStepNumber = () => steps.findIndex(s => s.id === activeStep) + 1;

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1].id as any);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].id as any);
    }
  };

  const handleCreateGroup = async () => {
    const newGroup: SavedGroup = {
      id: `group-${Date.now()}`,
      name: metadata.name,
      description: metadata.description,
      courseId: metadata.courseId,
      studentCount: selectedStudents.length,
      createdAt: new Date().toISOString(),
      balancingStrategy: metadata.balancingStrategy
    };

    // Try to save to Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('groups').insert({
          teacher_id: user.id,
          name: metadata.name,
          description: metadata.description,
          course_id: metadata.courseId || null,
          student_count: selectedStudents.length,
          balancing_strategy: metadata.balancingStrategy,
        });
      }
    } catch (err) {
      console.warn('Could not save group to DB:', err);
    }

    // Always save to localStorage as fallback
    const updatedGroups = [newGroup, ...savedGroups];
    setSavedGroups(updatedGroups);
    try {
      localStorage.setItem('ustoz_groups', JSON.stringify(updatedGroups));
    } catch (e) { /* ignore */ }

    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      // Reset form and go back to list
      setMetadata({ name: '', description: '', courseId: '', maxStudents: 30, balancingStrategy: 'performance' });
      setSelectedStudents([]);
      setActiveStep('metadata');
      setView('list');
    }, 2000);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 'metadata': return !!(metadata.name && metadata.courseId);
      case 'selection': return selectedStudents.length > 0;
      case 'balancing': return true;
      case 'review': return true;
      default: return false;
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const updated = savedGroups.filter(g => g.id !== groupId);
    setSavedGroups(updated);
    try {
      localStorage.setItem('ustoz_groups', JSON.stringify(updated));
    } catch (e) { /* ignore */ }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === 'list') {
    // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
    if (selectedGroup) {
      return (
        <div className="min-h-screen bg-background pt-16">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
            <button
              onClick={() => setSelectedGroup(null)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth mb-6"
            >
              <Icon name="ArrowLeftIcon" size={18} />
              <span className="text-sm">Guruhlar ro'yxatiga qaytish</span>
            </button>

            <div className="bg-card rounded-md shadow-warm border border-border p-8">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="UserGroupIcon" size={32} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-heading font-bold text-foreground">{selectedGroup.name}</h1>
                  {selectedGroup.description && (
                    <p className="text-muted-foreground mt-1">{selectedGroup.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="UsersIcon" size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">O'quvchilar soni</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{selectedGroup.studentCount}</p>
                </div>
                <div className="bg-muted/30 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="ScaleIcon" size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">Balans strategiyasi</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedGroup.balancingStrategy === 'performance' ? "Natija bo'yicha" :
                     selectedGroup.balancingStrategy === 'random' ? 'Tasodifiy' : "Qo'lda"}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="CalendarIcon" size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">Yaratilgan sana</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatDate(selectedGroup.createdAt)}</p>
                </div>
                {selectedGroup.courseId && (
                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name="BookOpenIcon" size={18} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">Kurs ID</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground truncate">{selectedGroup.courseId}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    handleDeleteGroup(selectedGroup.id);
                    setSelectedGroup(null);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-smooth text-sm font-medium"
                >
                  <Icon name="TrashIcon" size={16} />
                  <span>Guruhni o'chirish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth mb-3"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span className="text-sm">Orqaga</span>
              </button>
              <h1 className="text-3xl font-heading font-bold text-foreground">Guruhlar</h1>
              <p className="text-muted-foreground mt-1">O'quvchilar guruhlarini boshqaring</p>
            </div>
            <button
              onClick={() => { setView('create'); setShowGuideModal(true); }}
              className="flex items-center space-x-2 px-5 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium shadow-warm"
            >
              <Icon name="PlusCircleIcon" size={20} />
              <span>Yangi guruh yaratish</span>
            </button>
          </div>

          {/* Groups List */}
          {loadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-md border border-border p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-muted rounded mb-2 w-full"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : savedGroups.length === 0 ? (
            <div className="bg-card rounded-md border-2 border-dashed border-border p-16 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="UserGroupIcon" size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">Hali guruhlar yo'q</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Birinchi guruhingizni yarating. O'quvchilarni guruhlarga ajratib, ularning o'qish jarayonini samarali boshqaring.
              </p>
              <button
                onClick={() => { setView('create'); setShowGuideModal(true); }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
              >
                Birinchi guruhni yaratish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedGroups.map(group => (
                <div key={group.id} className="bg-card rounded-md shadow-warm border border-border p-6 hover:shadow-warm-lg transition-smooth">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon name="UserGroupIcon" size={24} className="text-primary" />
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-smooth rounded-md hover:bg-destructive/10"
                      title="O'chirish"
                    >
                      <Icon name="TrashIcon" size={16} />
                    </button>
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2 line-clamp-1">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Icon name="UsersIcon" size={16} />
                      <span>{group.studentCount} ta o'quvchi</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Icon name="CalendarIcon" size={16} />
                      <span>{formatDate(group.createdAt)}</span>
                    </div>
                    {group.balancingStrategy && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="ScaleIcon" size={16} />
                        <span>
                          {group.balancingStrategy === 'performance' ? "Natija bo'yicha" :
                           group.balancingStrategy === 'random' ? 'Tasodifiy' : "Qo'lda"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-smooth font-medium"
                    >
                      Batafsil ko'rish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CREATE VIEW ─────────────────────────────────────────────────────────────
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
                    <Icon name="UserGroupIcon" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-semibold text-foreground">Guruh Yaratish Yo'riqnomasi</h3>
                    <p className="text-muted-foreground mt-1">4 bosqichda guruh yarating</p>
                  </div>
                </div>
                <button onClick={() => setShowGuideModal(false)} className="p-2 hover:bg-muted rounded-md transition-smooth">
                  <Icon name="XMarkIcon" size={24} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-semibold text-foreground mb-1">{step.label}</h4>
                      <p className="text-sm text-muted-foreground">{step.helpText}</p>
                    </div>
                  </div>
                ))}
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

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
            <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 max-w-md text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircleIcon" size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">Guruh muvaffaqiyatli yaratildi!</h3>
              <p className="text-muted-foreground">Guruhlar ro'yxatiga qaytilmoqda...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setView('list')}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth mb-4"
          >
            <Icon name="ArrowLeftIcon" size={20} />
            <span>Guruhlar ro'yxatiga qaytish</span>
          </button>
          <h1 className="text-3xl font-heading font-bold text-foreground">Yangi Guruh Yaratish</h1>
          <p className="text-muted-foreground mt-2">O'quvchilarni guruhlarga ajrating va monitoring qiling</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 bg-card rounded-md shadow-warm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">Bosqich:</span>
              <span className="text-lg font-bold text-primary">{getCurrentStepNumber()} / 4</span>
            </div>
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-smooth"
            >
              <Icon name="QuestionMarkCircleIcon" size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Yo'riqnoma</span>
            </button>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(getCurrentStepNumber() / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Navigation Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = step.id === activeStep;
            const isCompleted = stepNumber < getCurrentStepNumber();
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id as any)}
                className={`text-left p-4 rounded-md transition-smooth border-2 ${
                  isActive ? 'bg-primary text-primary-foreground border-primary shadow-warm'
                  : isCompleted ? 'bg-green-500/10 text-foreground border-green-500/30' :'bg-card text-foreground border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isActive ? 'bg-primary-foreground/20' : isCompleted ? 'bg-green-500 text-white' : 'bg-muted'
                  }`}>
                    {isCompleted ? <Icon name="CheckIcon" size={14} /> : stepNumber}
                  </div>
                  <span className="font-semibold text-sm">{step.label.replace(/^\d+\.\s*/, '')}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-md shadow-warm p-6">
          {activeStep === 'metadata' && (
            <GroupMetadataForm metadata={metadata} onMetadataChange={setMetadata} />
          )}
          {activeStep === 'selection' && (
            <StudentSelectionPanel
              availableStudents={availableStudents}
              selectedStudents={selectedStudents}
              onSelectionChange={setSelectedStudents}
              maxStudents={metadata.maxStudents}
            />
          )}
          {activeStep === 'balancing' && (
            <GroupBalancingPanel
              selectedStudents={selectedStudents}
              balancingStrategy={metadata.balancingStrategy}
              onStrategyChange={(strategy) => setMetadata({ ...metadata, balancingStrategy: strategy })}
            />
          )}
          {activeStep === 'review' && (
            <GroupReviewPanel metadata={metadata} selectedStudents={selectedStudents} />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={handlePrevious}
              disabled={getCurrentStepNumber() === 1}
              className="flex items-center space-x-2 px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span>Orqaga</span>
            </button>

            {getCurrentStepNumber() < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Keyingisi</span>
                <Icon name="ArrowRightIcon" size={20} />
              </button>
            ) : (
              <button
                onClick={handleCreateGroup}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-smooth"
              >
                <Icon name="CheckIcon" size={20} />
                <span>Guruhni Saqlash</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCreationInteractive;