/**
 * Skeleton — professional loading placeholder'lar tizimi.
 *
 * Bazaviy `<Skeleton>` shimmer (brend-rangli yorug'lik o'tishi) beradi;
 * qolgan eksportlar real UI tuzilmasiga mos kompozitsiyalardir (stat karta,
 * kurs karta, jadval, ro'yxat, dashboard va h.k.). Matn ishlatilmaydi —
 * shuning uchun i18n ham kerak emas, server va client'da bir xil ishlaydi.
 */
import * as React from 'react';

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Bazaviy skeleton bloki — o'lcham/radius className orqali beriladi. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-md', className)} aria-hidden="true" />;
}

/** Bir necha matn qatori — oxirgisi qisqaroq (tabiiy ko'rinish). */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cx('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cx('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Dumaloq avatar/ikonka o'rni. */
export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cx('rounded-full', className ?? 'w-10 h-10')} />;
}

/** Statistika kartasi (ikonka + katta raqam + label). */
export function SkeletonStatCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5" aria-hidden="true">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-24" />
        <SkeletonAvatar className="w-8 h-8 rounded-md" />
      </div>
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

/** Kurs/marketplace kartasi (rasm + sarlavha + matn + tugma). */
export function SkeletonCourseCard() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" aria-hidden="true">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <SkeletonText lines={2} />
        <div className="flex items-center gap-3 pt-2">
          <SkeletonAvatar className="w-7 h-7" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Ro'yxat qatori (avatar + 2 qator + trailing). */
export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg" aria-hidden="true">
      <SkeletonAvatar className="w-11 h-11" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

/** Jadval (sarlavha + qatorlar). */
export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" aria-hidden="true">
      <div className="flex gap-4 p-4 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cx('h-4 flex-1', c === 0 && 'max-w-[40%]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Karta to'ri (marketplace, kurslar ro'yxati). */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCourseCard key={i} />
      ))}
    </div>
  );
}

/** Ro'yxat sahifasi (qatorlar). */
export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}

/** Dashboard skeleti — sarlavha + stat kartalar + kontent. */
export function SkeletonDashboard({ stats = 4 }: { stats?: number }) {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: stats }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <SkeletonText lines={5} />
        </div>
      </div>
    </div>
  );
}

/** Detal sahifasi (sarlavha + meta + kontent). */
export function SkeletonDetail() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-56 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex items-center gap-3">
          <SkeletonAvatar className="w-9 h-9" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <SkeletonText lines={5} />
      <SkeletonText lines={4} />
    </div>
  );
}

/** Forma skeleti (maydonlar + tugma). */
export function SkeletonForm({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-5 max-w-xl" aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-11 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-11 w-36 rounded-md" />
    </div>
  );
}

/** Umumiy sahifa skeleti — LoadingFallback default'i uchun. */
export function SkeletonPage() {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8" aria-hidden="true">
      <SkeletonDashboard />
    </div>
  );
}

export default Skeleton;
