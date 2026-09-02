'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorState from '@/components/common/ErrorState';
import { Skeleton, SkeletonForm } from '@/components/ui/Skeleton';
import GroupMetadataForm from './GroupMetadataForm';
import StudentSelectionPanel from './StudentSelectionPanel';
import GroupBalancingPanel from './GroupBalancingPanel';
import GroupReviewPanel from './GroupReviewPanel';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate as i18nFormatDate } from '@/lib/i18n/format';
import { toast } from '@/components/common/Toaster';

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
  meetingUrl: string;
  scheduleNote: string;
}

interface SavedGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  studentCount: number;
  maxMembers: number;
  meetingUrl: string;
  scheduleNote: string;
  createdAt: string;
}

const GroupCreationInteractive = () => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [activeStep, setActiveStep] = useState<'metadata' | 'selection' | 'balancing' | 'review'>('metadata');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SavedGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [metadata, setMetadata] = useState<GroupMetadata>({
    name: '',
    description: '',
    courseId: '',
    maxStudents: 30,
    balancingStrategy: 'performance',
    meetingUrl: '',
    scheduleNote: '',
  });

  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<{ id: string; title: string }[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
    loadGroups();
    loadStudents();
    loadCourses();
  }, []);

  // O'qituvchining real kurslari (guruh bog'lash uchun)
  const loadCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await fetch('/api/teacher/courses', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeacherCourses(
          (data.courses || []).map((c: any) => ({ id: c.id, title: c.title || '—' })),
        );
      }
    } catch {
      setTeacherCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  // O'qituvchi kurslariga yozilgan real talabalarni yuklaymiz
  const loadStudents = async () => {
    try {
      const res = await fetch('/api/teacher/students', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: Student[] = (data.students || []).map((s: any) => {
        const score = typeof s.avgProgress === 'number' ? s.avgProgress : 0;
        const performance: Student['performance'] =
          score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
        return {
          id: s.studentId || s.id,
          name: s.fullName || s.email || '—',
          email: s.email || '',
          avatar: s.avatarUrl || '/assets/images/no_image.png',
          performance,
          attendance: score,
          averageScore: score,
          enrolledCourses: [],
        };
      });
      setAvailableStudents(mapped);
    } catch {
      setAvailableStudents([]);
    }
  };

  const loadGroups = async () => {
    setLoadingGroups(true);
    setGroupsError(false);
    try {
      const res = await fetch('/api/teacher/groups', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSavedGroups(
          (data.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
            description: g.description || '',
            courseId: g.courseId || '',
            studentCount: g.memberCount || 0,
            maxMembers: g.maxMembers || 0,
            meetingUrl: g.meetingUrl || '',
            scheduleNote: g.scheduleNote || '',
            createdAt: g.createdAt,
          }))
        );
        setLoadingGroups(false);
        return;
      }
      throw new Error(`Xatolik (${res.status})`);
    } catch (err) {
      console.warn('Could not load groups from API:', err);
    }

    // Fallback: localStorage
    try {
      const stored = localStorage.getItem('ustoz_groups');
      if (stored) {
        setSavedGroups(JSON.parse(stored));
      } else {
        setGroupsError(true);
      }
    } catch {
      // localStorage parse xatosi — xato holatini ko'rsatamiz
      setGroupsError(true);
    }
    setLoadingGroups(false);
  };

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

  const steps = [
    { id: 'metadata', label: `1. ${t('groups.groupInfo')}`, icon: 'InformationCircleIcon', helpText: t('groups.step1Help') },
    { id: 'selection', label: `2. ${t('groups.selectStudents')}`, icon: 'UserGroupIcon', helpText: t('groups.step2Help') },
    { id: 'balancing', label: `3. ${t('groups.groupBalance')}`, icon: 'ScaleIcon', helpText: t('groups.step3Help') },
    { id: 'review', label: `4. ${t('groups.review')}`, icon: 'CheckCircleIcon', helpText: t('groups.step4Help') }
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

  // Server bilan bir xil metadata validatsiyasi (group.service.ts).
  const metadataValid = () => {
    const n = metadata.name.trim();
    if (n.length < 2 || n.length > 100) return false;
    if (!metadata.courseId) return false;
    if (metadata.description.length > 2000) return false;
    if (metadata.scheduleNote.trim().length > 200) return false;
    if (metadata.meetingUrl.trim()) {
      try { new URL(metadata.meetingUrl.trim()); } catch { return false; }
    }
    return true;
  };

  const handleCreateGroup = async () => {
    // Ikki marta bosishdan himoya + yakuniy validatsiya
    if (isCreating) return;
    if (!metadataValid()) {
      toast.error(t('groups.fixErrors'));
      setActiveStep('metadata');
      return;
    }
    setIsCreating(true);

    // 1) Guruhni yaratamiz
    let groupId: string | undefined;
    try {
      const meetingUrl = metadata.meetingUrl.trim();
      const scheduleNote = metadata.scheduleNote.trim();
      const res = await fetch('/api/teacher/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: metadata.name.trim(),
          description: metadata.description,
          courseId: metadata.courseId || null,
          maxMembers: metadata.maxStudents,
          ...(meetingUrl ? { meetingUrl } : {}),
          ...(scheduleNote ? { scheduleNote } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `${t('common.error')} (${res.status})`);
      }
      const data = await res.json();
      groupId = data.group?.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('groups.groupCreateFailed'));
      setIsCreating(false);
      return;
    }

    // 2) Tanlangan talabalarni guruhga qo'shamiz (alohida members endpoint)
    const studentIds = selectedStudents.map((s) => s.id).filter(Boolean);
    if (groupId && studentIds.length > 0) {
      try {
        const mRes = await fetch(`/api/teacher/groups/${groupId}/members/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ studentIds }),
        });
        if (!mRes.ok) {
          toast.error(t('groups.membersPartialFail'));
        }
      } catch {
        toast.error(t('groups.membersPartialFail'));
      }
    }

    // Ro'yxatni server'dan qayta yuklaymiz (real id bilan)
    await loadGroups();

    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      // Reset form and go back to list
      setMetadata({ name: '', description: '', courseId: '', maxStudents: 30, balancingStrategy: 'performance', meetingUrl: '', scheduleNote: '' });
      setSelectedStudents([]);
      setActiveStep('metadata');
      setView('list');
      setIsCreating(false);
    }, 2000);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 'metadata': return metadataValid();
      case 'selection': return selectedStudents.length > 0;
      case 'balancing': return true;
      case 'review': return true;
      default: return false;
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const prev = savedGroups;
    // Optimistik o'chirish
    setSavedGroups(savedGroups.filter(g => g.id !== groupId));
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${t('common.error')} (${res.status})`);
    } catch (err) {
      // Muvaffaqiyatsiz — ro'yxatni tiklaymiz
      setSavedGroups(prev);
      toast.error(err instanceof Error ? err.message : t('groups.groupDeleteFailed'));
    }
  };

  // O'chirishni ConfirmModal orqali tasdiqlaymiz
  const confirmDeleteGroup = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await handleDeleteGroup(deleteTarget.id);
    // Agar batafsil ko'rinishdagi guruh o'chirilsa — ro'yxatga qaytamiz
    setSelectedGroup((cur) => (cur && cur.id === deleteTarget.id ? null : cur));
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      return i18nFormatDate(dateStr, locale, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  // courseId -> kurs nomi (topilmasa bo'sh); xom UUID ko'rsatmaslik uchun
  const courseTitleFor = (courseId: string) =>
    teacherCourses.find((c) => c.id === courseId)?.title || '';

  // O'chirishni tasdiqlash modali — ham ro'yxat, ham batafsil ko'rinishda
  const deleteConfirmEl = (
    <ConfirmModal
      open={!!deleteTarget}
      title={t('groups.deleteGroup')}
      message={t('groups.deleteConfirm', { name: deleteTarget?.name ?? '' })}
      confirmLabel={t('groups.deleteGroup')}
      cancelLabel={t('common.cancel')}
      variant="danger"
      isLoading={isDeleting}
      onConfirm={confirmDeleteGroup}
      onCancel={() => setDeleteTarget(null)}
    />
  );

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === 'list') {
    // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
    if (selectedGroup) {
      return (
        <div className="min-h-screen bg-background pt-16">
          {deleteConfirmEl}
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
            <button
              onClick={() => setSelectedGroup(null)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth mb-6"
            >
              <Icon name="ArrowLeftIcon" size={18} />
              <span className="text-sm">{t('groups.backToList')}</span>
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
                    <span className="text-sm font-medium text-foreground">{t('groups.studentCount')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{selectedGroup.studentCount}</p>
                </div>
                <div className="bg-muted/30 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="UserPlusIcon" size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('groups.maxStudentsLabel')}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{selectedGroup.maxMembers || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="CalendarIcon" size={18} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">{t('groups.createdDate')}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatDate(selectedGroup.createdAt)}</p>
                </div>
                {selectedGroup.courseId && (
                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name="BookOpenIcon" size={18} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{t('groups.courseLabel')}</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground truncate">
                      {courseTitleFor(selectedGroup.courseId) || '—'}
                    </p>
                  </div>
                )}
                {selectedGroup.scheduleNote && (
                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name="ClockIcon" size={18} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">{t('groups.scheduleLabel')}</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{selectedGroup.scheduleNote}</p>
                  </div>
                )}
              </div>

              {selectedGroup.meetingUrl && (
                <a
                  href={selectedGroup.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-3 mb-6 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-smooth text-sm font-medium w-fit"
                >
                  <Icon name="VideoCameraIcon" size={18} />
                  <span>{t('groups.meetingLink')}</span>
                  <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                </a>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedGroup)}
                  className="flex items-center space-x-2 px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-smooth text-sm font-medium"
                >
                  <Icon name="TrashIcon" size={16} />
                  <span>{t('groups.deleteGroup')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background pt-16">
        {deleteConfirmEl}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-smooth mb-3"
              >
                <Icon name="ArrowLeftIcon" size={18} />
                <span className="text-sm">{t('common.back')}</span>
              </button>
              <h1 className="text-3xl font-heading font-bold text-foreground">{t('groups.groups')}</h1>
              <p className="text-muted-foreground mt-1">{t('groups.manageGroups')}</p>
            </div>
            <button
              onClick={() => { setView('create'); setShowGuideModal(true); }}
              className="flex items-center space-x-2 px-5 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium shadow-warm"
            >
              <Icon name="PlusCircleIcon" size={20} />
              <span>{t('groups.createNewGroup')}</span>
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
          ) : groupsError && savedGroups.length === 0 ? (
            <ErrorState message={t('groups.loadError')} onRetry={loadGroups} />
          ) : savedGroups.length === 0 ? (
            <div className="bg-card rounded-md border-2 border-dashed border-border p-16 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="UserGroupIcon" size={40} className="text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">{t('groups.noGroupsYet')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('groups.noGroupsDescFull')}</p>
              <button
                onClick={() => { setView('create'); setShowGuideModal(true); }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
              >
                {t('groups.createFirstGroup')}
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
                      onClick={() => setDeleteTarget(group)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-smooth rounded-md hover:bg-destructive/10"
                      title={t('groups.deleteGroup')}
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
                      <span>{group.studentCount} {t('groups.studentsLabel')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Icon name="CalendarIcon" size={16} />
                      <span>{formatDate(group.createdAt)}</span>
                    </div>
                    {group.scheduleNote && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Icon name="ClockIcon" size={16} />
                        <span className="line-clamp-1">{group.scheduleNote}</span>
                      </div>
                    )}
                    {group.meetingUrl && (
                      <div className="flex items-center space-x-2 text-sm text-primary">
                        <Icon name="VideoCameraIcon" size={16} />
                        <span>{t('groups.meetingLink')}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-smooth font-medium"
                    >
                      {t('groups.viewDetails')}
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
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon name="UserGroupIcon" size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-semibold text-foreground">{t('groups.guideTitle')}</h3>
                    <p className="text-muted-foreground mt-1">{t('groups.guideSubtitle')}</p>
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
                {t('groups.understood')}
              </button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-card rounded-md shadow-warm-xl border border-border p-8 max-w-md text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircleIcon" size={40} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">{t('groups.groupCreated')}</h3>
              <p className="text-muted-foreground">{t('groups.redirecting')}</p>
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
            <span>{t('groups.backToList')}</span>
          </button>
          <h1 className="text-3xl font-heading font-bold text-foreground">{t('groups.createNewGroupTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('groups.createDesc')}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 bg-card rounded-md shadow-warm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-muted-foreground">{t('groups.step')}</span>
              <span className="text-lg font-bold text-primary">{getCurrentStepNumber()} / 4</span>
            </div>
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-smooth"
            >
              <Icon name="QuestionMarkCircleIcon" size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('groups.guide')}</span>
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
            <GroupMetadataForm metadata={metadata} onMetadataChange={setMetadata} courses={teacherCourses} coursesLoading={coursesLoading} />
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
            <GroupReviewPanel metadata={metadata} selectedStudents={selectedStudents} courses={teacherCourses} />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={handlePrevious}
              disabled={getCurrentStepNumber() === 1}
              className="flex items-center space-x-2 px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span>{t('common.back')}</span>
            </button>

            {getCurrentStepNumber() < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('common.next')}</span>
                <Icon name="ArrowRightIcon" size={20} />
              </button>
            ) : (
              <button
                onClick={handleCreateGroup}
                disabled={isCreating || !metadataValid()}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                    <span>{t('groups.creating')}</span>
                  </>
                ) : (
                  <>
                    <Icon name="CheckIcon" size={20} />
                    <span>{t('groups.saveGroup')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCreationInteractive;