'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { toast } from '@/components/common/Toaster';
import { useTeacherStudents } from '@/hooks/queries/useTeacherStudents';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';
import { useBroadcastToCourseMutation } from '@/hooks/mutations/useTeacherStudentMutations';
import { useI18n } from '@/contexts/I18nContext';

function formatUzs(uzs: string): string {
  const n = BigInt(uzs);
  if (n === BigInt(0)) return '0';
  if (n >= BigInt(1_000_000)) return `${(Number(n) / 1_000_000).toFixed(1)}M`;
  if (n >= BigInt(1_000)) return `${(Number(n) / 1_000).toFixed(0)}K`;
  return n.toString();
}

function timeAgo(d: string | null, t: (key: string) => string): string {
  if (!d) return t('teacher.studentsNever');
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return t('teacher.studentsToday');
  if (days === 1) return t('teacher.studentsYesterday');
  if (days < 7) return `${days} ${t('teacher.studentsDaysAgo')}`;
  if (days < 30) return `${Math.floor(days / 7)} ${t('teacher.studentsWeeksAgo')}`;
  if (days < 365) return `${Math.floor(days / 30)} ${t('teacher.studentsMonthsAgo')}`;
  return `${Math.floor(days / 365)} ${t('teacher.studentsYearsAgo')}`;
}

export default function StudentsListClient() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const { data, isLoading, error } = useTeacherStudents({
    courseId: courseFilter || undefined,
    search: search.trim() || undefined,
    activeOnly,
  });
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];

  const students = data?.students ?? [];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/teacher-dashboard"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-foreground">{t('teacher.studentsTitle')}</h1>
          <p className="text-sm text-muted-foreground">{students.length} {t('teacher.studentsCount')}</p>
        </div>
        {courses.length > 0 && (
          <button
            onClick={() => setBroadcastOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
          >
            <Icon name="MegaphoneIcon" size={16} />
            Broadcast
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="MagnifyingGlassIcon"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('teacher.studentsSearchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-background"
        >
          <option value="">{t('teacher.studentsAllCourses')}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          {t('teacher.studentsActiveOnly')}
        </label>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded-md" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon name="UserGroupIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('teacher.studentsNoResults')}</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {students.map((s) => (
            <Link
              key={s.studentId}
              href={`/teacher-dashboard/students/${s.studentId}`}
              className="bg-card border border-border rounded-md p-4 hover:shadow-warm-md transition-smooth flex items-center gap-4"
            >
              {s.avatarUrl ? (
                <AppImage
                  src={s.avatarUrl}
                  alt={s.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {s.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground truncate">{s.fullName}</p>
                  {s.completedCourses > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded-full">
                      ✓ {s.completedCourses}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
              </div>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                <div className="text-right">
                  <p className="text-muted-foreground">{t('teacher.studentsCoursesLabel')}</p>
                  <p className="font-medium text-foreground">
                    {s.activeEnrollments}/{s.enrolledCourses}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{t('teacher.studentsProgressLabel')}</p>
                  <p className="font-medium text-foreground">{s.avgProgress}%</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{t('teacher.studentsPaymentLabel')}</p>
                  <p className="font-medium text-foreground">{formatUzs(s.totalPayments)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">{t('teacher.studentsActivityLabel')}</p>
                  <p className="font-medium text-foreground">{timeAgo(s.lastActivityAt, t)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {broadcastOpen && (
        <BroadcastModal courses={courses} onClose={() => setBroadcastOpen(false)} />
      )}
    </div>
  );
}

function BroadcastModal({
  courses,
  onClose,
}: {
  courses: Array<{ id: string; title: string }>;
  onClose: () => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const mut = useBroadcastToCourseMutation();

  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return toast.error(t('teacher.broadcastSelectCourse'));
    if (title.trim().length < 2) return toast.error(t('teacher.broadcastTitleMinLength'));
    if (message.trim().length < 2) return toast.error(t('teacher.broadcastMessageMinLength'));
    mut.mutate(
      {
        courseId,
        title: title.trim(),
        message: message.trim(),
        activeOnly,
      },
      {
        onSuccess: ({ sent }) => {
          toast.success(`${sent} ${t('teacher.broadcastSentSuccess')}`);
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !mut.isPending && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
            <Icon name="MegaphoneIcon" size={18} />
            {t('teacher.broadcastTitle')}
          </h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.broadcastCourseLabel')}</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              <option value="">{t('teacher.broadcastCourseSelect')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.broadcastTitleLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t('teacher.broadcastTitlePlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('teacher.broadcastMessageLabel')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder={t('teacher.broadcastMessagePlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            {t('teacher.broadcastActiveOnly')}
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={mut.isPending}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            {t('teacher.broadcastCancel')}
          </button>
          <button
            type="submit"
            disabled={mut.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {t('teacher.broadcastSend')}
          </button>
        </div>
      </form>
    </div>
  );
}
