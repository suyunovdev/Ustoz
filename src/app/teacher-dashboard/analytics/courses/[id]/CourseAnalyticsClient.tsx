'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useCourseAnalytics } from '@/hooks/queries/useTeacherAnalytics';
import { useI18n } from '@/contexts/I18nContext';

function fmtUzs(s: string): string {
  const n = BigInt(s);
  return n.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

interface Props {
  courseId: string;
}

export default function CourseAnalyticsClient({ courseId }: Props) {
  const { t } = useI18n();
  const { data, isLoading, error } = useCourseAnalytics(courseId);

  if (isLoading || !data) return <div className="p-8">{t('common.loading')}</div>;
  if (error)
    return <div className="p-8 text-destructive">{(error as Error).message}</div>;

  const { course, topicFunnel, topStudents, strugglingStudents, testStats, assignmentStats } =
    data;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link
        href="/teacher-dashboard/analytics"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        {t('teacher.analytics')}
      </Link>

      <h1 className="text-2xl font-heading font-semibold mb-1">{course.courseTitle}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('teacher.courseFullStats')}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label={t('teacher.totalEnrolled')}
          value={course.totalEnrollments}
          sub={`${course.activeEnrollments} ${t('teacher.active')}`}
          icon="UsersIcon"
          color="text-primary"
        />
        <KpiCard
          label={t('teacher.completed')}
          value={course.completedEnrollments}
          sub={`${course.completionRate}% completion rate`}
          icon="CheckCircleIcon"
          color="text-success"
        />
        <KpiCard
          label={t('teacher.avgProgress')}
          value={`${course.avgProgress}%`}
          sub={t('teacher.allStudents')}
          icon="ChartBarIcon"
          color="text-warning"
        />
        <KpiCard
          label={t('teacher.revenue')}
          value={fmtUzs(course.totalRevenueUzs) + ' UZS'}
          sub={`${t('teacher.refunded')}: ${fmtUzs(course.totalRefundsUzs)}`}
          icon="CurrencyDollarIcon"
          color="text-success"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <MiniStat
          label={t('teacher.reviews')}
          value={`${course.reviewCount} (⭐ ${course.avgRating})`}
        />
        <MiniStat label={t('teacher.tests')} value={`${testStats.length} ${t('teacher.testCount')}`} />
        <MiniStat label={t('teacher.assignments')} value={`${assignmentStats.length} ${t('teacher.assignmentCount')}`} />
      </div>

      {topicFunnel.length > 0 && (
        <Section title={t('teacher.topicsFunnel')} subtitle={t('teacher.topicsFunnelDesc')}>
          <div className="space-y-2">
            {topicFunnel.map((t) => (
              <div key={t.topicId} className="bg-card border border-border rounded-md p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-medium truncate">
                    {t.orderIndex}. {t.topicTitle}
                  </p>
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="text-muted-foreground">{t.completions} ta</span>
                    <span
                      className={`font-medium ${
                        t.completionRate >= 70
                          ? 'text-success'
                          : t.completionRate >= 40
                          ? 'text-warning'
                          : 'text-destructive'
                      }`}
                    >
                      {t.completionRate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      t.completionRate >= 70
                        ? 'bg-success'
                        : t.completionRate >= 40
                        ? 'bg-warning'
                        : 'bg-destructive'
                    }`}
                    style={{ width: `${t.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {testStats.length > 0 && (
        <Section title={t('teacher.testStats')} subtitle={t('teacher.testStatsDesc')}>
          <div className="space-y-2">
            {testStats.map((t) => (
              <Link
                key={t.testId}
                href={`/teacher-dashboard/tests/${t.testId}`}
                className="block bg-card border border-border rounded-md p-3 hover:shadow-warm-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.testTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.totalAttempts} {t('teacher.attempts')} · {t.passedAttempts} {t('teacher.passed')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <div className="text-right">
                      <p className="text-muted-foreground">Pass rate</p>
                      <p
                        className={`font-bold ${
                          t.passRate >= 70 ? 'text-success' : 'text-warning'
                        }`}
                      >
                        {t.passRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Avg score</p>
                      <p className="font-bold text-foreground">{t.avgScore}%</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {assignmentStats.length > 0 && (
        <Section title={t('teacher.assignmentStats')} subtitle={t('teacher.assignmentStatsDesc')}>
          <div className="space-y-2">
            {assignmentStats.map((a) => (
              <Link
                key={a.assignmentId}
                href={`/teacher-dashboard/assignments/${a.assignmentId}`}
                className="block bg-card border border-border rounded-md p-3 hover:shadow-warm-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.submissionCount} {t('teacher.submitted')} · {a.gradedCount} {t('teacher.graded')}
                      {a.lateCount > 0 && ` · ${a.lateCount} ${t('teacher.late')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <div className="text-right">
                      <p className="text-muted-foreground">Grade rate</p>
                      <p
                        className={`font-bold ${
                          a.gradeRate >= 70 ? 'text-success' : 'text-warning'
                        }`}
                      >
                        {a.gradeRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Avg grade</p>
                      <p className="font-bold text-foreground">{a.avgGrade}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title={t('teacher.topStudents')} subtitle={t('teacher.topStudentsDesc')}>
          {topStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t('common.noData')}</p>
          ) : (
            <ul className="space-y-2">
              {topStudents.map((s, i) => (
                <li
                  key={s.studentId}
                  className="bg-card border border-border rounded-md p-2 flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-muted-foreground w-5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/teacher-dashboard/students/${s.studentId}`}
                      className="text-sm font-medium hover:text-primary truncate block"
                    >
                      {s.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  <span className="text-sm font-bold text-success shrink-0">
                    {s.progress}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title={t('teacher.needHelp')}
          subtitle={t('teacher.needHelpDesc')}
        >
          {strugglingStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t('teacher.noOneNeedsHelp')}</p>
          ) : (
            <ul className="space-y-2">
              {strugglingStudents.map((s) => (
                <li
                  key={s.studentId}
                  className="bg-card border border-warning/20 rounded-md p-2 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/teacher-dashboard/students/${s.studentId}`}
                      className="text-sm font-medium hover:text-primary truncate block"
                    >
                      {s.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Progress {s.progress}%
                      {s.daysSinceActivity !== null && ` · ${s.daysSinceActivity} ${t('teacher.daysInactive')}`}
                      {s.daysSinceActivity === null && ` · ${t('teacher.neverLoggedIn')}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-4">
      <Icon name={icon} size={20} className={`${color} mb-2`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-md p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-medium text-foreground">{value}</p>
    </div>
  );
}
