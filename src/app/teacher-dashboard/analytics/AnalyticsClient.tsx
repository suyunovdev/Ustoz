'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import {
  useTeacherAnalytics,
  type DailyPointDTO,
} from '@/hooks/queries/useTeacherAnalytics';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';

function fmtUzs(s: string): string {
  const n = BigInt(s);
  if (n >= BigInt(1_000_000_000)) return `${(Number(n) / 1_000_000_000).toFixed(2)}B`;
  if (n >= BigInt(1_000_000)) return `${(Number(n) / 1_000_000).toFixed(2)}M`;
  if (n >= BigInt(1_000)) return `${(Number(n) / 1_000).toFixed(0)}K`;
  return n.toString();
}

const RANGES = [
  { value: 7, label: '7 kun' },
  { value: 30, label: '30 kun' },
  { value: 90, label: '90 kun' },
  { value: 180, label: '6 oy' },
] as const;

export default function AnalyticsClient() {
  const [days, setDays] = useState<7 | 30 | 90 | 180>(30);
  const { data, isLoading, error } = useTeacherAnalytics(days);
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];

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
          <h1 className="text-2xl font-heading font-semibold">Tahlil</h1>
          <p className="text-sm text-muted-foreground">
            Daromad, yozilishlar va engagement metrikalar
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                days === r.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading || !data ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-muted rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <ComparisonCard
              label="Daromad"
              value={fmtUzs(data.comparison.currentRevenue) + ' UZS'}
              prev={fmtUzs(data.comparison.previousRevenue)}
              delta={data.comparison.revenueDeltaPct}
              icon="CurrencyDollarIcon"
            />
            <ComparisonCard
              label="Yozilishlar"
              value={String(data.comparison.currentEnrollments)}
              prev={String(data.comparison.previousEnrollments)}
              delta={data.comparison.enrollmentsDeltaPct}
              icon="UserPlusIcon"
            />
            <EngagementCard
              label="Material ko'rishlar"
              value={data.engagement.totalMaterialViews}
              sub={`${data.engagement.totalWatchHours} soat`}
              icon="EyeIcon"
            />
            <EngagementCard
              label="Mavzular tugatildi"
              value={data.engagement.totalTopicCompletions}
              sub={`${data.engagement.weeklyActiveStudents} haftalik faol`}
              icon="CheckCircleIcon"
            />
          </div>

          <div className="bg-card border border-border rounded-md p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Kunlik daromad ({days} kun)</h2>
              <span className="text-xs text-muted-foreground">UZS</span>
            </div>
            <DailyChart points={data.dailyRevenue} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <SmallStat
              label="Bugun faol"
              value={data.engagement.dailyActiveStudents}
              icon="BoltIcon"
              color="bg-success/10 text-success"
            />
            <SmallStat
              label="Hafta davomida faol"
              value={data.engagement.weeklyActiveStudents}
              icon="UsersIcon"
              color="bg-primary/10 text-primary"
            />
            <SmallStat
              label="Oy davomida faol"
              value={data.engagement.monthlyActiveStudents}
              icon="ChartBarIcon"
              color="bg-warning/10 text-warning"
            />
          </div>

          <div className="mb-3">
            <h2 className="text-lg font-medium">Kurslar bo'yicha tahlil</h2>
            <p className="text-xs text-muted-foreground">
              Har kursning detali sahifasiga o'tib batafsil ma'lumot olishingiz mumkin
            </p>
          </div>
          {courses.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 bg-muted/30 rounded-md text-sm italic">
              Kurslaringiz yo'q
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses.map((c) => (
                <Link
                  key={c.id}
                  href={`/teacher-dashboard/analytics/courses/${c.id}`}
                  className="bg-card border border-border rounded-md p-4 hover:shadow-warm-md transition-smooth flex items-center gap-3"
                >
                  {c.coverImage ? (
                    <img
                      src={c.coverImage}
                      alt={c.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-primary/10 text-primary flex items-center justify-center">
                      <Icon name="BookOpenIcon" size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {c.enrollmentCount} yozilgan · ⭐ {c.rating || 0}
                    </p>
                  </div>
                  <Icon name="ArrowRightIcon" size={14} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComparisonCard({
  label,
  value,
  prev,
  delta,
  icon,
}: {
  label: string;
  value: string;
  prev: string;
  delta: number | null;
  icon: string;
}) {
  const isUp = delta !== null && delta > 0;
  const isDown = delta !== null && delta < 0;
  return (
    <div className="bg-card border border-border rounded-md p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon name={icon} size={20} className="text-primary" />
        {delta !== null && (
          <span
            className={`text-xs font-medium ${
              isUp ? 'text-success' : isDown ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {isUp ? '↑' : isDown ? '↓' : ''} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">Avval: {prev}</p>
    </div>
  );
}

function EngagementCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  icon: string;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-4">
      <Icon name={icon} size={20} className="text-primary mb-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value.toLocaleString('uz-UZ')}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function SmallStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${color}`}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DailyChart({ points }: { points: DailyPointDTO[] }) {
  const maxRevenue = useMemo(
    () => Math.max(...points.map((p) => Number(p.revenue)), 1),
    [points],
  );
  const maxEnroll = useMemo(
    () => Math.max(...points.map((p) => p.enrollments), 1),
    [points],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-0.5 h-32">
        {points.map((p) => {
          const revPct = (Number(p.revenue) / maxRevenue) * 100;
          const enrPct = (p.enrollments / maxEnroll) * 100;
          const hasData = Number(p.revenue) > 0 || p.enrollments > 0;
          return (
            <div
              key={p.date}
              className="flex-1 flex flex-col justify-end items-center gap-px relative group"
              title={`${p.date}\nDaromad: ${fmtUzs(p.revenue)}\nYozilish: ${p.enrollments}`}
            >
              <div
                className="w-full bg-primary/40 rounded-t-sm transition-all"
                style={{ height: `${Math.max(revPct, hasData ? 2 : 0)}%` }}
              />
              <div
                className="w-full bg-success/60 rounded-t-sm transition-all"
                style={{ height: `${Math.max(enrPct, hasData ? 1 : 0) * 0.3}%` }}
              />
              {hasData && (
                <div className="hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  {p.date}<br />💰 {fmtUzs(p.revenue)} · 👤 {p.enrollments}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-primary/40 rounded-sm" /> Daromad
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-success/60 rounded-sm" /> Yozilishlar
        </span>
        <span className="ml-auto">{points[0]?.date} → {points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}
