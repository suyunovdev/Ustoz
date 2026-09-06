'use client';

/**
 * Kurs sotib olish so'rovlari — admin tasdiqlaydi/rad etadi (to'lov shlyuzisiz oqim).
 * PaymentsPanel yuqorisida ko'rsatiladi. Kutilayotgan so'rov bo'lmasa — yashirin.
 */
import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency } from '@/lib/i18n/format';

interface Req {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  priceUzs: string;
  paymentMethod: string | null;
  createdAt: string;
}

export default function CoursePurchaseRequestsPanel() {
  const { locale } = useI18n();
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/course-purchase-requests?status=pending', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setRows(data.requests ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/course-purchase-requests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Xatolik');
      toast.success(action === 'approve' ? 'So\'rov tasdiqlandi — talaba kursga yozildi' : 'So\'rov rad etildi');
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setBusyId(null);
    }
  };

  if (loading || rows.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="ShoppingCartIcon" size={18} className="text-primary" />
        <h3 className="font-heading font-semibold text-foreground">
          Kurs sotib olish so'rovlari
        </h3>
        <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          {rows.length}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{r.courseTitle}</p>
              <p className="text-sm text-muted-foreground truncate">
                {r.studentName} · {r.studentEmail}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(r.priceUzs), locale, 'UZS')}</p>
                <p className="text-xs text-muted-foreground">{r.paymentMethod === 'payme' ? 'Payme' : 'Click'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => review(r.id, 'approve')}
                  disabled={busyId === r.id}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Tasdiqlash
                </button>
                <button
                  type="button"
                  onClick={() => review(r.id, 'reject')}
                  disabled={busyId === r.id}
                  className="px-3 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  Rad etish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
