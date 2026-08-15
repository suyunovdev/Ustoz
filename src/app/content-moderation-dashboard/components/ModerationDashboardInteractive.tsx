'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';
import ContentList from './ContentList';
import PreviewPanel from './PreviewPanel';
import ReviewControls from './ReviewControls';
import CourseModerationPanel from './CourseModerationPanel';

interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  avgReviewTime: string;
}

interface ContentItem {
  id: string;
  type: 'material' | 'link' | 'test';
  title: string;
  teacherName: string;
  submittedAt: string;
  status: string;
  contentType?: string;
  url?: string;
  fileSize?: number;
}

const ModerationDashboardInteractive = () => {
  const router = useRouter();
  const { t } = useI18n();
  const [isHydrated, setIsHydrated] = useState(false);
  const [tab, setTab] = useState<'courses' | 'materials'>('courses');
  const [stats, setStats] = useState<ModerationStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    avgReviewTime: '0h'
  });
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'material' | 'link' | 'test'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
    loadModerationData();
  }, [filterType, filterStatus]);

  const formatReviewTime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  };

  const loadModerationData = async () => {
    setIsLoading(true);
    try {
      // Verify admin auth via JWT
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.status === 401) {
        router.push('/login');
        return;
      }

      const qs = new URLSearchParams();
      qs.set('status', 'all'); // status'ni client tomonda filtrlaymiz (pending = submitted + under_review)
      if (filterType === 'link') qs.set('contentType', 'external_link');
      qs.set('limit', '100');

      const res = await fetch(`/api/admin/moderation?${qs.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Moderation ma'lumotlarini olishda xatolik (${res.status})`);
      const data = await res.json();

      const allItems: ContentItem[] = (data.items || []).map((row: any) => ({
        id: row.id,
        type: row.material?.contentType === 'external_link' ? 'link' : 'material',
        title: row.material?.title || '—',
        teacherName: row.material?.teacher?.fullName || '—',
        submittedAt: row.submittedAt || row.createdAt || '',
        status: row.status,
        contentType: row.material?.contentType,
        url: row.material?.fileUrl || row.material?.externalLink || undefined,
      }));

      // Status filtri: pending = submitted | under_review
      const statusMatch = (s: string) => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'pending') return s === 'submitted' || s === 'under_review';
        return s === filterStatus;
      };
      const typeMatch = (item: ContentItem) => {
        if (filterType === 'all') return true;
        if (filterType === 'test') return false; // moderation queue'da test turi yo'q
        return item.type === filterType;
      };

      const filtered = allItems.filter((i) => statusMatch(i.status) && typeMatch(i));

      setContentItems(filtered);
      setStats({
        pending: (data.stats?.submitted || 0) + (data.stats?.under_review || 0),
        approved: data.stats?.approved || 0,
        rejected: data.stats?.rejected || 0,
        avgReviewTime: formatReviewTime(data.stats?.avgReviewMinutes || 0),
      });
      setSelectedItem(null);
    } catch (error) {
      // Moderation data loading failed — reset to empty state
      setContentItems([]);
      setStats({ pending: 0, approved: 0, rejected: 0, avgReviewTime: '0h 0m' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (
    itemId: string,
    _itemType: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ) => {
    const action = decision === 'approved' ? 'approve' : 'reject';
    if (action === 'reject' && !notes?.trim()) {
      toast.error(t('moderation.rejectReasonRequired'));
      return;
    }
    try {
      const res = await fetch(`/api/admin/moderation/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, feedback: notes?.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || t('moderation.genericError', { status: res.status }));
      }
      toast.success(decision === 'approved' ? t('moderation.approvedToast') : t('moderation.rejectedToast'));
      await loadModerationData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('moderation.reviewError'));
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">{t('moderation.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('moderation.description')}</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="font-medium hidden sm:inline">{t('moderation.back')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab switch: Kurslar | Materiallar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          <button
            onClick={() => setTab('courses')}
            className={`px-4 py-2 rounded text-sm font-medium transition-smooth ${tab === 'courses' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('moderation.coursesTab')}
          </button>
          <button
            onClick={() => setTab('materials')}
            className={`px-4 py-2 rounded text-sm font-medium transition-smooth ${tab === 'materials' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('moderation.materialsTab')}
          </button>
        </div>
      </div>

      {tab === 'courses' && <CourseModerationPanel />}

      {tab === 'materials' && (
      <>
      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">{t('moderation.pending')}</p>
                <p className="text-3xl font-heading font-bold text-warning mt-2">{stats.pending}</p>
              </div>
              <Icon name="ClockIcon" size={40} className="text-warning" />
            </div>
          </div>
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">{t('moderation.approved')}</p>
                <p className="text-3xl font-heading font-bold text-success mt-2">{stats.approved}</p>
              </div>
              <Icon name="CheckCircleIcon" size={40} className="text-success" />
            </div>
          </div>
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">{t('moderation.rejected')}</p>
                <p className="text-3xl font-heading font-bold text-destructive mt-2">{stats.rejected}</p>
              </div>
              <Icon name="XCircleIcon" size={40} className="text-destructive" />
            </div>
          </div>
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">{t('moderation.avgTime')}</p>
                <p className="text-3xl font-heading font-bold text-primary mt-2">{stats.avgReviewTime}</p>
              </div>
              <Icon name="ChartBarIcon" size={40} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-card rounded-md shadow-warm p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">{t('moderation.typeLabel')}</span>
              <div className="flex items-center space-x-2">
                {([
                  { value: 'all' as const, label: t('moderation.all') },
                  { value: 'material' as const, label: t('moderation.materials') },
                  { value: 'link' as const, label: t('moderation.links') },
                  { value: 'test' as const, label: t('moderation.tests') }
                ]).map((type) => (
                  <button
                    key={`type-${type.value}`}
                    onClick={() => setFilterType(type.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
                      filterType === type.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">{t('moderation.statusLabel')}</span>
              <div className="flex items-center space-x-2">
                {([
                  { value: 'all' as const, label: t('moderation.all') },
                  { value: 'pending' as const, label: t('moderation.pending') },
                  { value: 'approved' as const, label: t('moderation.approved') },
                  { value: 'rejected' as const, label: t('moderation.rejected') }
                ]).map((status) => (
                  <button
                    key={`status-${status.value}`}
                    onClick={() => setFilterStatus(status.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-smooth ${
                      filterStatus === status.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content List */}
          <div className="lg:col-span-1">
            <ContentList
              items={contentItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              isLoading={isLoading}
            />
          </div>

          {/* Preview and Review */}
          <div className="lg:col-span-2 space-y-6">
            {selectedItem ? (
              <>
                <PreviewPanel item={selectedItem} />
                <ReviewControls
                  item={selectedItem}
                  onReview={handleReview}
                />
              </>
            ) : (
              <div className="bg-card rounded-md shadow-warm p-12 text-center">
                <Icon name="DocumentMagnifyingGlassIcon" size={64} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('moderation.selectContent')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default ModerationDashboardInteractive;
