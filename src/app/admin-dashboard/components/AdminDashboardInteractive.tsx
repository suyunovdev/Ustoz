'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AdminSidebar, { type AdminTabId } from './AdminSidebar';

// Yengil panellar — to'g'ridan-to'g'ri import (dynamic chunk overhead'isiz).
// Faqat ko'p og'ir kutubxonalar (Recharts) — AnalyticsCharts bo'lsa, uni
// dynamic qilishimiz mumkin. Hozircha bularning hammasi <10KB.
import PlatformMetrics from './PlatformMetrics';
import UserManagementPanel from './UserManagementPanel';
import TeacherApplicationsPanel from './TeacherApplicationsPanel';
import CourseOversightPanel from './CourseOversightPanel';
import ReviewsPanel from './ReviewsPanel';
import PaymentsPanel from './PaymentsPanel';
import CampaignsPanel from './CampaignsPanel';
import ModerationQueuePanel from './ModerationQueuePanel';
import SupportTicketsPanel from './SupportTicketsPanel';
import AuditLogPanel from './AuditLogPanel';
import SystemHealthPanel from './SystemHealthPanel';
import AnalyticsCharts from './AnalyticsCharts';

const VALID_TABS: ReadonlyArray<AdminTabId> = [
  'overview',
  'users',
  'teacher_applications',
  'courses',
  'reviews',
  'payments',
  'campaigns',
  'moderation',
  'tickets',
  'audit_log',
  'analytics',
  'system',
];

const TAB_TITLES: Record<AdminTabId, { title: string; subtitle: string }> = {
  overview: {
    title: "Umumiy ko'rinish",
    subtitle: 'Platformaning umumiy koʻrsatkichlari',
  },
  users: {
    title: 'Foydalanuvchilar',
    subtitle: 'Foydalanuvchilarni boshqarish va rollar',
  },
  teacher_applications: {
    title: "O'qituvchi arizalari",
    subtitle: "Yangi o'qituvchilarni ko'rib chiqish va tasdiqlash",
  },
  courses: {
    title: 'Kurslar',
    subtitle: 'Barcha kurslarni nazorat qilish',
  },
  reviews: {
    title: 'Sharhlar',
    subtitle: 'Talabalar sharhlari va spam moderatsiyasi',
  },
  payments: {
    title: "To'lovlar",
    subtitle: "Tranzaksiyalar va daromad boshqaruvi",
  },
  campaigns: {
    title: "Email yuborish",
    subtitle: "Broadcast email kampaniyalari",
  },
  moderation: {
    title: 'Moderatsiya',
    subtitle: 'Kontentni tasdiqlash va rad etish',
  },
  tickets: {
    title: "Yordam so'rovlari",
    subtitle: 'Foydalanuvchi support ticket\'lari',
  },
  audit_log: {
    title: 'Audit log',
    subtitle: 'Admin amallarining to\'liq tarixi (kim, qachon, nima qildi)',
  },
  analytics: {
    title: 'Tahlil',
    subtitle: 'Platforma tahlili va statistikasi',
  },
  system: {
    title: 'Tizim holati',
    subtitle: 'Server va xizmatlar monitoringi',
  },
};

const AdminDashboardInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get('tab');
  const initialTab: AdminTabId = VALID_TABS.includes(tabFromUrl as AdminTabId)
    ? (tabFromUrl as AdminTabId)
    : 'overview';

  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as AdminTabId)) {
      setActiveTab(tabFromUrl as AdminTabId);
    } else if (!tabFromUrl) {
      setActiveTab('overview');
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId: AdminTabId) => {
    setActiveTab(tabId);
    const url =
      tabId === 'overview' ? '/admin-dashboard' : `/admin-dashboard?tab=${tabId}`;
    router.replace(url, { scroll: false });
  };

  const headerInfo = TAB_TITLES[activeTab];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted transition-smooth"
          aria-label="Menyu"
        >
          <Icon name="Bars3Icon" size={24} />
        </button>
        <p className="font-heading font-semibold text-foreground">{headerInfo.title}</p>
        <div className="w-9" />
      </div>

      <main className="md:ml-60 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-1">
              {headerInfo.title}
            </h1>
            <p className="text-muted-foreground text-sm">{headerInfo.subtitle}</p>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <PlatformMetrics />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModerationQueuePanel />
                <SystemHealthPanel />
              </div>
              <AnalyticsCharts />
            </div>
          )}

          {activeTab === 'users' && <UserManagementPanel />}
          {activeTab === 'teacher_applications' && <TeacherApplicationsPanel />}
          {activeTab === 'courses' && <CourseOversightPanel />}
          {activeTab === 'reviews' && <ReviewsPanel />}
          {activeTab === 'payments' && <PaymentsPanel />}
          {activeTab === 'campaigns' && <CampaignsPanel />}
          {activeTab === 'moderation' && <ModerationQueuePanel expanded />}
          {activeTab === 'tickets' && <SupportTicketsPanel />}
          {activeTab === 'audit_log' && <AuditLogPanel />}
          {activeTab === 'analytics' && <AnalyticsCharts expanded />}
          {activeTab === 'system' && <SystemHealthPanel expanded />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardInteractive;
