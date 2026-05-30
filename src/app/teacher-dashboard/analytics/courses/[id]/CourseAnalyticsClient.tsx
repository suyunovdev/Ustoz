'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useCourseAnalytics } from '@/hooks/queries/useTeacherAnalytics';

function fmtUzs(s: string): string {
  const n = BigInt(s);
  return n.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

interface Props {
  courseId: string;
}

export default function CourseAnalyticsClient({ courseId }: Props) {
  const { data, isLoading, error } = useCourseAnalytics(courseId);

  if (isLoading || !data) return <div className="p-8">Yuklanmoqda…</div>;
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
        Tahlil
      </Link>

      <h1 className="text-2xl font-heading font-semibold mb-1">{course.courseTitle}</h1>
      <p className="text-sm text-muted-foreground mb-6">Kurs bo'yicha to'liq statistika</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Jami yozilgan"
          value={course.totalEnrollments}
          sub={`${course.activeEnrollments} faol`}
          icon="UsersIcon"
          color="text-primary"
        />
        <KpiCard
          label="Tugatgan"
          value={course.completedEnrollments}
          sub={`${course.completionRate}% completion rate`}
          icon="CheckCircleIcon"
          color="text-success"
        />
        <KpiCard
          label="O'rtacha progress"
          value={`${course.avgProgress}%`}
          sub="Hamma talabalar"
          icon="ChartBarIcon"
          color="text-warning"
        />
        <KpiCard
          label="Daromad"
          value={fmtUzs(course.totalRevenueUzs) + ' UZS'}
          sub={`Qaytarilgan: ${fmtUzs(course.totalRefundsUzs)}`}
          icon="CurrencyDollarIcon"
          color="text-success"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <MiniStat
          label="Sharhlar"
          value={`${course.reviewCount} (⭐ ${course.avgRating})`}
        />
        <MiniStat label="Testlar" value={`${testStats.length} ta test`} />
        <MiniStat label="Vazifalar" value={`${assignmentStats.length} ta vazifa`} />
      </div>

      {topicFunnel.length > 0 && (
        <Section title="Mavzular funnel" subtitle="Har topic'ni nechi talaba tugatgan">
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
        <Section title="Testlar statistikasi" subtitle="Pass rate va o'rtacha bal">
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
                      {t.totalAttempts} urinish · {t.passedAttempts} o'tgan
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
        <Section title="Vazifalar statistikasi" subtitle="Grading va kechikkan">
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
                      {a.submissionCount} topshirilgan · {a.gradedCount} baholangan
                      {a.lateCount > 0 && ` · ${a.lateCount} kechikkan`}
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
        <Section title="🏆 Eng faol talabalar" subtitle="Top 10 by progress">
          {topStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Yo'q</p>
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
          title="⚠ Yordam kerak"
          subtitle="Past progress yoki 14+ kun faollik yo'q"
        >
          {strugglingStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Hech kim yo'q ✓</p>
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
                      {s.daysSinceActivity !== null && ` · ${s.daysSinceActivity} kun ko'rinmagan`}
                      {s.daysSinceActivity === null && ' · hech qachon kirmagan'}
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
