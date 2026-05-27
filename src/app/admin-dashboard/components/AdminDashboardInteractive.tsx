// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import Icon from '@/components/ui/AppIcon';

// Dynamic imports to reduce initial bundle size
const PlatformMetrics = dynamic(() => import('./PlatformMetrics'), {
  loading: () => <div className="animate-pulse bg-card rounded-md h-32" />
});
const UserManagementPanel = dynamic(() => import('./UserManagementPanel'), {
  loading: () => <div className="animate-pulse bg-card rounded-md h-96" />
});
const CourseOversightPanel = dynamic(() => import('./CourseOversightPanel'), {
  loading: () => <div className="animate-pulse bg-card rounded-md h-96" />
});
const ModerationQueuePanel = dynamic(() => import('./ModerationQueuePanel'), {
  loading: () => <div className="animate-pulse bg-card rounded-md h-96" />
});
const AnalyticsCharts = dynamic(() => import('./AnalyticsCharts'), {
  loading: () => <div className="animate-pulse bg-card rounded-md h-96" />
});
const SystemHealthPanel = dynamic(() => import('./SystemHealthPanel'), {
  loading: () => <div className="animate-pulse bg-card rounded-md h-96" />
});

interface PlatformStats {
  totalUsers: number;
  activeCourses: number;
  totalRevenue: number;
  systemHealth: number;
  userGrowth: number;
  courseGrowth: number;
  revenueGrowth: number;
}

const AdminDashboardInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeCourses: 0,
    totalRevenue: 0,
    systemHealth: 100,
    userGrowth: 0,
    courseGrowth: 0,
    revenueGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
    loadPlatformData();
  }, []);

  const loadPlatformData = async () => {
    setIsLoading(true);
    try {
      // Check auth first
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.status === 401) {
        router.push('/login');
        return;
      }

      // Load active courses count from the public courses API
      let activeCourses = 0;
      try {
        const coursesRes = await fetch('/api/courses?limit=50', { credentials: 'include' });
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          activeCourses = data?.pagination?.total ?? (data?.courses?.length || 0);
        }
      } catch (err) {
        console.warn('Failed to load courses count:', err);
      }

      // TODO: add /api/admin/stats endpoint for totalUsers / revenue / system metrics
      setStats({
        totalUsers: 0,
        activeCourses,
        totalRevenue: 0,
        systemHealth: 98,
        userGrowth: 0,
        courseGrowth: 0,
        revenueGrowth: 0
      });
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Umumiy ko\'rinish', icon: 'HomeIcon' },
    { id: 'users', label: 'Foydalanuvchilar', icon: 'UserGroupIcon' },
    { id: 'courses', label: 'Kurslar', icon: 'BookOpenIcon' },
    { id: 'moderation', label: 'Moderatsiya', icon: 'ShieldCheckIcon' },
    { id: 'analytics', label: 'Tahlil', icon: 'ChartBarIcon' },
    { id: 'system', label: 'Tizim', icon: 'CogIcon' }
  ];

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader userRole="teacher" currentPath="/admin-dashboard" />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Admin paneli
            </h1>
            <p className="text-muted-foreground">
              Platformani boshqaring va tizim holatini kuzating
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-card rounded-md shadow-warm p-2 mb-6">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-smooth whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-warm'
                        : 'text-foreground hover:bg-muted hover:-translate-y-0.5'
                    }`}
                  >
                    <Icon name={tab.icon as any} size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <PlatformMetrics stats={stats} isLoading={isLoading} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModerationQueuePanel />
                <SystemHealthPanel systemHealth={stats.systemHealth} />
              </div>
              <AnalyticsCharts />
            </div>
          )}

          {activeTab === 'users' && <UserManagementPanel />}
          {activeTab === 'courses' && <CourseOversightPanel />}
          {activeTab === 'moderation' && <ModerationQueuePanel expanded />}
          {activeTab === 'analytics' && <AnalyticsCharts expanded />}
          {activeTab === 'system' && <SystemHealthPanel systemHealth={stats.systemHealth} expanded />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardInteractive;
