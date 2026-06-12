'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ContentList from './ContentList';
import PreviewPanel from './PreviewPanel';
import ReviewControls from './ReviewControls';

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
  const [isHydrated, setIsHydrated] = useState(false);
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

  const loadModerationData = async () => {
    setIsLoading(true);
    try {
      // Verify admin auth via JWT
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.status === 401) {
        router.push('/login');
        return;
      }

      // TODO: add /api/admin/moderation endpoint that returns
      //       { items: [...mat/link/test...], stats: { pending, approved, rejected, avgReviewTime } }
      //       with ?type=material|link|test&status=pending|approved|rejected filters.
      setStats({
        pending: 0,
        approved: 0,
        rejected: 0,
        avgReviewTime: '0h 0m'
      });
      setContentItems([]);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error loading moderation data:', error);
      setContentItems([]);
      setStats({ pending: 0, approved: 0, rejected: 0, avgReviewTime: '0h 0m' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (itemId: string, itemType: string, decision: 'approved' | 'rejected', notes?: string) => {
    try {
      // TODO: add /api/admin/moderation/[type]/[id] PATCH endpoint that updates
      //       moderation_status, reviewed_at, reviewed_by, rejection_reason.
      console.warn('Moderation review endpoint not implemented yet:', {
        itemId,
        itemType,
        decision,
        notes
      });
      alert("Bu funksiya tez orada qo'shiladi");
    } catch (error) {
      console.error('Error reviewing content:', error);
      alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
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
              <h1 className="text-3xl font-heading font-bold text-foreground">Kontent moderatsiyasi</h1>
              <p className="text-muted-foreground mt-1">O'qituvchilar yuklagan materiallarni ko'rib chiqish</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="font-medium hidden sm:inline">Orqaga</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">Kutilmoqda</p>
                <p className="text-3xl font-heading font-bold text-warning mt-2">{stats.pending}</p>
              </div>
              <Icon name="ClockIcon" size={40} className="text-warning" />
            </div>
          </div>
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">Tasdiqlangan</p>
                <p className="text-3xl font-heading font-bold text-success mt-2">{stats.approved}</p>
              </div>
              <Icon name="CheckCircleIcon" size={40} className="text-success" />
            </div>
          </div>
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">Rad etilgan</p>
                <p className="text-3xl font-heading font-bold text-destructive mt-2">{stats.rejected}</p>
              </div>
              <Icon name="XCircleIcon" size={40} className="text-destructive" />
            </div>
          </div>
          <div className="bg-card rounded-md shadow-warm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="caption text-muted-foreground">O'rtacha vaqt</p>
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
              <span className="text-sm font-medium text-foreground">Turi:</span>
              <div className="flex items-center space-x-2">
                {([
                  { value: 'all' as const, label: 'Barchasi' },
                  { value: 'material' as const, label: 'Materiallar' },
                  { value: 'link' as const, label: 'Havolalar' },
                  { value: 'test' as const, label: 'Testlar' }
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
              <span className="text-sm font-medium text-foreground">Status:</span>
              <div className="flex items-center space-x-2">
                {([
                  { value: 'all' as const, label: 'Barchasi' },
                  { value: 'pending' as const, label: 'Kutilmoqda' },
                  { value: 'approved' as const, label: 'Tasdiqlangan' },
                  { value: 'rejected' as const, label: 'Rad etilgan' }
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
                <p className="text-muted-foreground">Ko'rib chiqish uchun kontentni tanlang</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboardInteractive;
