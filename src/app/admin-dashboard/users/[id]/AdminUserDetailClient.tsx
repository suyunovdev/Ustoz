'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import Icon from '@/components/ui/AppIcon';
import Avatar from '@/components/ui/Avatar';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDate as fmtDate } from '@/lib/i18n/format';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useAdminUserDetail } from '@/hooks/queries/useAdminUserDetail';
import { useUserActionMutation } from '@/hooks/mutations/useUserActionMutation';

type Role = 'student' | 'teacher' | 'admin';

interface Pending {
  type: 'suspend' | 'activate' | 'change_role';
  newRole?: Role;
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="bg-card rounded-md shadow-warm p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon name={icon} size={16} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-heading font-bold text-foreground">{value}</div>
      {sub != null && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function statusBadgeClass(s: string): string {
  return s === 'approved'
    ? 'bg-success/10 text-success'
    : s === 'submitted' || s === 'under_review'
      ? 'bg-warning/10 text-warning'
      : s === 'rejected'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-muted text-muted-foreground';
}

export default function AdminUserDetailClient({ userId }: { userId: string }) {
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useAdminUserDetail(userId);
  const actionMut = useUserActionMutation();
  const [pending, setPending] = useState<Pending | null>(null);

  const uzs = (v: string | number) => formatCurrency(Number(v) || 0, locale, 'UZS');
  const date = (iso: string | null) => (iso ? fmtDate(iso, locale, {}) : '—');

  const roleLabel: Record<Role, string> = {
    admin: t('admin.roleAdmin'),
    teacher: t('admin.roleTeacher'),
    student: t('admin.roleStudent'),
  };
  const roleColor: Record<Role, string> = {
    admin: 'bg-destructive/10 text-destructive',
    teacher: 'bg-primary/10 text-primary',
    student: 'bg-success/10 text-success',
  };

  const runAction = () => {
    if (!pending || !data) return;
    const vars =
      pending.type === 'change_role'
        ? { userId, action: 'change_role' as const, newRole: pending.newRole! }
        : { userId, action: pending.type };
    actionMut.mutate(vars, {
      onSuccess: () => {
        toast.success(t('adminUserDetail.actionDone'));
        qc.invalidateQueries({ queryKey: queryKeys.adminUser(userId) });
        setPending(null);
        refetch();
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : t('adminUserDetail.actionFailed')),
    });
  };

  const confirmProps = (): { title: string; message: string; variant: 'danger' | 'default' } => {
    if (pending?.type === 'suspend')
      return { title: t('adminUserDetail.confirmSuspendTitle'), message: t('adminUserDetail.confirmSuspendMsg'), variant: 'danger' };
    if (pending?.type === 'activate')
      return { title: t('adminUserDetail.confirmActivateTitle'), message: t('adminUserDetail.confirmActivateMsg'), variant: 'default' };
    return {
      title: t('adminUserDetail.confirmRoleTitle'),
      message: `${t('adminUserDetail.confirmRoleMsg')} ${pending?.newRole ? roleLabel[pending.newRole] : ''}`,
      variant: 'danger',
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link
          href="/admin-dashboard?tab=users"
          className="text-sm text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-1 mb-6"
        >
          <Icon name="ChevronLeftIcon" size={16} />
          {t('adminUserDetail.back')}
        </Link>

        {error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm flex items-center justify-between">
            <span>{error instanceof Error ? error.message : t('adminUserDetail.loadFailed')}</span>
            <button onClick={() => refetch()} className="underline text-xs">{t('adminUserDetail.retry')}</button>
          </div>
        ) : isLoading || !data ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-24 bg-card rounded-md" />)}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-card rounded-md shadow-warm p-6 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <Avatar src={data.user.avatarUrl ?? ''} name={data.user.fullName} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-heading font-bold text-foreground truncate">{data.user.fullName}</h1>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor[data.user.role]}`}>
                      {roleLabel[data.user.role]}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${data.user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {data.user.isActive ? t('adminUserDetail.statusActive') : t('adminUserDetail.statusBlocked')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{data.user.email}</p>
                  {data.user.phone && <p className="text-sm text-muted-foreground">📞 {data.user.phone}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('adminUserDetail.joined')}: {date(data.user.createdAt)} · {t('adminUserDetail.lastLogin')}: {date(data.user.lastLoginAt)}
                  </p>
                  {data.user.bio && <p className="text-sm text-foreground mt-2">{data.user.bio}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                {data.user.isActive ? (
                  <button
                    onClick={() => setPending({ type: 'suspend' })}
                    className="px-3 py-1.5 text-sm rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth"
                  >
                    {t('adminUserDetail.suspend')}
                  </button>
                ) : (
                  <button
                    onClick={() => setPending({ type: 'activate' })}
                    className="px-3 py-1.5 text-sm rounded-md border border-success/30 text-success hover:bg-success/10 transition-smooth"
                  >
                    {t('adminUserDetail.activate')}
                  </button>
                )}
                <span className="text-sm text-muted-foreground ml-2">{t('adminUserDetail.changeRole')}:</span>
                {(['student', 'teacher', 'admin'] as Role[]).map((r) => (
                  <button
                    key={r}
                    disabled={data.user.role === r}
                    onClick={() => setPending({ type: 'change_role', newRole: r })}
                    className="px-3 py-1.5 text-sm rounded-md border border-border text-foreground hover:bg-muted transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {roleLabel[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* TEACHER */}
            {data.teacher && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="BookOpenIcon" label={t('adminUserDetail.tCourses')} value={data.teacher.stats.totalCourses}
                    sub={`${data.teacher.stats.publishedCourses} ${t('adminUserDetail.published')}`} />
                  <StatCard icon="UserGroupIcon" label={t('adminUserDetail.tStudents')} value={data.teacher.stats.totalEnrollments} />
                  <StatCard icon="StarIcon" label={t('adminUserDetail.tRating')} value={data.teacher.stats.avgRating.toFixed(1)} />
                  <StatCard icon="BanknotesIcon" label={t('adminUserDetail.available')} value={uzs(data.teacher.balance.availableUzs)} />
                </div>

                {/* Finance */}
                <div className="bg-card rounded-md shadow-warm p-6">
                  <h3 className="font-heading font-semibold text-foreground mb-3">{t('adminUserDetail.finance')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <Row label={t('adminUserDetail.gross')} value={uzs(data.teacher.balance.grossRevenueUzs)} />
                    <Row label={`${t('adminUserDetail.platformFee')} (${data.teacher.balance.platformFeePct}%)`} value={uzs(data.teacher.balance.platformFeeUzs)} />
                    <Row label={t('adminUserDetail.net')} value={uzs(data.teacher.balance.netRevenueUzs)} strong />
                    <Row label={t('adminUserDetail.withdrawn')} value={uzs(data.teacher.balance.withdrawnUzs)} />
                    <Row label={t('adminUserDetail.pending')} value={uzs(data.teacher.balance.pendingWithdrawalUzs)} />
                    <Row label={t('adminUserDetail.available')} value={uzs(data.teacher.balance.availableUzs)} strong />
                  </div>
                  <div className="mt-3 pt-3 border-t border-border text-sm">
                    {data.teacher.payout.hasPayout ? (
                      <div className="space-y-1 text-muted-foreground">
                        {data.teacher.payout.bankName && <Row label={t('adminUserDetail.payoutBank')} value={data.teacher.payout.bankName} />}
                        {data.teacher.payout.recipientName && <Row label={t('adminUserDetail.payoutRecipient')} value={data.teacher.payout.recipientName} />}
                        {data.teacher.payout.cardNumber && <Row label={t('adminUserDetail.payoutCard')} value={data.teacher.payout.cardNumber} />}
                        {data.teacher.payout.accountNumber && <Row label={t('adminUserDetail.payoutAccount')} value={data.teacher.payout.accountNumber} />}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{t('adminUserDetail.noPayout')}</p>
                    )}
                  </div>
                </div>

                {/* Application */}
                {data.teacher.application && (
                  <div className="bg-card rounded-md shadow-warm p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{t('adminUserDetail.application')}:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(data.teacher.application.status)}`}>
                        {data.teacher.application.status}
                      </span>
                      <span className="text-muted-foreground">· {data.teacher.application.expertise}</span>
                    </div>
                    {data.teacher.application.feedback && (
                      <p className="text-muted-foreground mt-1">{data.teacher.application.feedback}</p>
                    )}
                  </div>
                )}

                {/* Courses */}
                <div className="bg-card rounded-md shadow-warm p-6">
                  <h3 className="font-heading font-semibold text-foreground mb-3">{t('adminUserDetail.coursesList')}</h3>
                  {data.teacher.courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('adminUserDetail.noCourses')}</p>
                  ) : (
                    <div className="space-y-2">
                      {data.teacher.courses.map((c) => (
                        <Link
                          key={c.id}
                          href={`/courses/${c.id}`}
                          className="flex items-center justify-between gap-3 p-3 border border-border rounded-md hover:bg-muted/40 transition-smooth"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{c.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <span>👥 {c.enrollmentCount}</span>
                              <span>⭐ {c.rating.toFixed(1)} ({c.reviewCount})</span>
                              <span>📚 {c.topicCount}</span>
                              <span>💰 {uzs(c.revenueUzs)}</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadgeClass(c.moderationStatus)}`}>
                            {t(`teacher.status_${c.moderationStatus}`)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STUDENT */}
            {data.student && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon="AcademicCapIcon" label={t('adminUserDetail.sEnrollments')} value={data.student.enrollments.length} />
                  <StatCard icon="CheckBadgeIcon" label={t('adminUserDetail.sCertificates')} value={data.student.stats?.totalCertificates ?? 0} />
                  <StatCard icon="ClipboardDocumentCheckIcon" label={t('adminUserDetail.sTests')} value={`${data.student.stats?.passedTestAttempts ?? 0}/${data.student.stats?.totalTestAttempts ?? 0}`}
                    sub={data.student.stats?.avgTestScore != null ? `${t('adminUserDetail.sAvgScore')}: ${data.student.stats.avgTestScore}%` : undefined} />
                  <StatCard icon="BanknotesIcon" label={t('adminUserDetail.sTotalPaid')} value={uzs(data.student.stats?.totalPaymentsUzs ?? '0')} />
                </div>

                <div className="bg-card rounded-md shadow-warm p-6">
                  <h3 className="font-heading font-semibold text-foreground mb-3">{t('adminUserDetail.enrollmentsList')}</h3>
                  {data.student.enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('adminUserDetail.noEnrollments')}</p>
                  ) : (
                    <div className="space-y-3">
                      {data.student.enrollments.map((e) => (
                        <Link key={e.enrollmentId} href={`/courses/${e.courseId}`} className="block p-3 border border-border rounded-md hover:bg-muted/40 transition-smooth">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <p className="font-medium text-foreground truncate">{e.courseTitle}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${e.completedAt ? 'bg-success/10 text-success' : e.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {e.completedAt ? t('adminUserDetail.completed') : e.isActive ? t('adminUserDetail.active') : t('adminUserDetail.inactive')}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, e.progress))}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>{t('adminUserDetail.progress')}: {e.progress}%</span>
                            <span>{t('adminUserDetail.enrolledAt')}: {date(e.enrolledAt)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {pending && data && (
        <ConfirmModal
          open={true}
          title={confirmProps().title}
          message={confirmProps().message}
          confirmLabel={t('common.confirm')}
          variant={confirmProps().variant}
          isLoading={actionMut.isPending}
          onConfirm={runAction}
          onCancel={() => !actionMut.isPending && setPending(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'font-semibold text-foreground' : 'text-foreground'}>{value}</span>
    </div>
  );
}
