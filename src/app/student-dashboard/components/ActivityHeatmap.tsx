'use client';

/**
 * Activity Heatmap (GitHub-style)
 * --------------------------------
 * Pure React + Tailwind, library yo'q.
 *
 * Layout:
 *   ─── columns: hafta (oxirgi hafta o'ngda)
 *   │
 *   rows: 7 ta (Dush yuqorida, Yak pastda)
 *
 * UTC sana, "yyyy-mm-dd" internal format.
 */

import { useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';

interface ActivityRow {
  date: string;
  topicsCompleted: number;
}

interface ActivityHeatmapProps {
  activities: ActivityRow[];
  /** Oxirgi N kun (default 90). Responsive override mavjud. */
  days?: number;
  className?: string;
}

interface DayCell {
  date: string;        // "yyyy-mm-dd" yoki "" (offset uchun)
  count: number;
  weekday: number;     // 0 Yak, 1 Dush ... 6 Shan
  monthIndex: number;  // 0–11 yoki -1 (offset)
  isOffset: boolean;
}

const UZ_MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const UZ_MONTH_FULL = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];
// Dush yuqorida → Yak pastda
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sat, Sun
const WEEKDAY_LABELS: Record<number, string> = { 1: 'Du', 3: 'Cho', 5: 'Ju', 0: 'Ya' };

function getColor(count: number): string {
  if (count === 0) return 'bg-muted dark:bg-muted';
  if (count === 1) return 'bg-green-200 dark:bg-green-900';
  if (count <= 3) return 'bg-green-400 dark:bg-green-700';
  if (count <= 5) return 'bg-green-600 dark:bg-green-500';
  return 'bg-green-800 dark:bg-green-400';
}

function utcToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatUzDate(iso: string): string {
  // "2026-05-27" → "27 may 2026"
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${UZ_MONTH_FULL[m - 1]} ${y}`;
}

/**
 * Bo'sh kunlarni to'ldirib, haftalik sutunlarga ajratadi.
 * Birinchi hafta qisman bo'lishi mumkin → yuqorida offset cell'lar (isOffset: true).
 */
function buildWeeks(activities: ActivityRow[], days: number): DayCell[][] {
  const activityMap = new Map(activities.map((a) => [a.date, a.topicsCompleted]));

  const today = utcToday();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  // Birinchi haftaning Dushanba'sigacha orqaga ket (Dush=1, Yak=0)
  const startWeekday = start.getUTCDay(); // 0 Yak, 1 Dush..6 Shan
  const offsetDays = startWeekday === 0 ? 6 : startWeekday - 1; // Yak bo'lsa 6, Dush bo'lsa 0
  const gridStart = new Date(start);
  gridStart.setUTCDate(gridStart.getUTCDate() - offsetDays);

  const weeks: DayCell[][] = [];
  const cursor = new Date(gridStart);

  while (cursor.getTime() <= today.getTime()) {
    const week: DayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(cursor);
      const isOffset = cellDate.getTime() < start.getTime() || cellDate.getTime() > today.getTime();
      const iso = toIsoDate(cellDate);
      week.push({
        date: isOffset ? '' : iso,
        count: isOffset ? 0 : activityMap.get(iso) ?? 0,
        weekday: cellDate.getUTCDay(),
        monthIndex: isOffset ? -1 : cellDate.getUTCMonth(),
        isOffset,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * Har sutun yuqorisida oy nomi (faqat birinchi sutun yoki oy o'zgarganda).
 */
function buildMonthLabels(weeks: DayCell[][]): Array<string | null> {
  const labels: Array<string | null> = [];
  let lastMonth = -1;
  for (const week of weeks) {
    // birinchi non-offset cell oyini ol
    const firstReal = week.find((c) => !c.isOffset);
    if (!firstReal) {
      labels.push(null);
      continue;
    }
    if (firstReal.monthIndex !== lastMonth) {
      labels.push(UZ_MONTHS[firstReal.monthIndex]);
      lastMonth = firstReal.monthIndex;
    } else {
      labels.push(null);
    }
  }
  return labels;
}

const ActivityHeatmap = ({ activities, days = 90, className = '' }: ActivityHeatmapProps) => {
  const { t } = useI18n();
  const weeks = useMemo(() => buildWeeks(activities, days), [activities, days]);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  const totalActiveDays = activities.filter((a) => a.topicsCompleted > 0).length;
  const totalTopics = activities.reduce((sum, a) => sum + a.topicsCompleted, 0);

  return (
    <div className={`bg-card rounded-md shadow-warm p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
            {t('student.yourActivity')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('student.last')} {days} {t('student.days')}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{t('student.less')}</span>
          <div className="w-3 h-3 rounded-sm bg-muted dark:bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-400" />
          <span>{t('student.more')}</span>
        </div>
      </div>

      {/* Grid: month labels + (weekday labels + week columns) */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels qator */}
          <div className="flex pl-7 mb-1">
            {monthLabels.map((label, idx) => (
              <div key={idx} className="w-3.5 text-[10px] text-muted-foreground" style={{ marginRight: 2 }}>
                {label || ''}
              </div>
            ))}
          </div>

          {/* Asosiy grid: chap weekday labels + sutunlar */}
          <div className="flex gap-1">
            {/* Chap: weekday labels (Du, Cho, Ju, Ya) */}
            <div className="flex flex-col gap-[2px] mr-1 pt-0.5">
              {WEEKDAY_ORDER.map((wd) => (
                <div
                  key={wd}
                  className="w-3 h-3 text-[10px] text-muted-foreground flex items-center"
                  style={{ width: 18 }}
                >
                  {WEEKDAY_LABELS[wd] || ''}
                </div>
              ))}
            </div>

            {/* Sutunlar: har hafta 7 ta cell, Dush yuqorida */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[2px]">
                {WEEKDAY_ORDER.map((wd) => {
                  const cell = week.find((c) => c.weekday === wd);
                  if (!cell || cell.isOffset) {
                    return <div key={wd} className="w-3 h-3 rounded-sm bg-transparent" />;
                  }
                  const title =
                    cell.count > 0
                      ? `${formatUzDate(cell.date)}: ${cell.count} ${t('student.topicsCompleted')}`
                      : `${formatUzDate(cell.date)}: ${t('student.noActivity')}`;
                  return (
                    <div
                      key={wd}
                      className={`w-3 h-3 rounded-sm ${getColor(cell.count)} hover:ring-2 hover:ring-primary/50 transition-shadow cursor-help`}
                      title={title}
                      aria-label={title}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mt-3 flex-wrap gap-2">
        <span>
          <span className="font-medium text-foreground">{totalActiveDays}</span> {t('student.activeDays')} ·{' '}
          <span className="font-medium text-foreground">{totalTopics}</span> {t('student.topics')}
        </span>
        <span>{t('student.last')} {days} {t('student.days')}</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
