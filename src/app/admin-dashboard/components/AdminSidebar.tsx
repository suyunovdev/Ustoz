'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ThemeToggle from '@/components/common/ThemeToggle';
import BrandMark from '@/components/common/BrandMark';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

export type AdminTabId =
  | 'overview'
  | 'users'
  | 'teacher_applications'
  | 'courses'
  | 'reviews'
  | 'payments'
  | 'withdrawals'
  | 'subscriptions'
  | 'live_sessions'
  | 'campaigns'
  | 'moderation'
  | 'tickets'
  | 'audit_log'
  | 'analytics'
  | 'system'
  | 'settings';

interface NavItem {
  id: AdminTabId;
  labelKey: string;
  icon: string;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

// CRM uslubi — bo'limlar mazmuniga qarab guruhlangan (tekis 16 tugma o'rniga).
const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: 'admin.groupOverview',
    items: [
      { id: 'overview', labelKey: 'admin.navOverview', icon: 'HomeIcon' },
      { id: 'analytics', labelKey: 'admin.navAnalytics', icon: 'ChartBarIcon' },
    ],
  },
  {
    titleKey: 'admin.groupUsers',
    items: [
      { id: 'users', labelKey: 'admin.navUsers', icon: 'UserGroupIcon' },
      { id: 'teacher_applications', labelKey: 'admin.navTeacherApps', icon: 'AcademicCapIcon' },
    ],
  },
  {
    titleKey: 'admin.groupContent',
    items: [
      { id: 'courses', labelKey: 'admin.navCourses', icon: 'BookOpenIcon' },
      { id: 'moderation', labelKey: 'admin.navModeration', icon: 'ShieldCheckIcon' },
      { id: 'reviews', labelKey: 'admin.navReviews', icon: 'ChatBubbleLeftRightIcon' },
      { id: 'live_sessions', labelKey: 'admin.navLiveSessions', icon: 'VideoCameraIcon' },
    ],
  },
  {
    titleKey: 'admin.groupFinance',
    items: [
      { id: 'payments', labelKey: 'admin.navPayments', icon: 'CreditCardIcon' },
      { id: 'withdrawals', labelKey: 'admin.navWithdrawals', icon: 'BanknotesIcon' },
      { id: 'subscriptions', labelKey: 'admin.navSubscriptions', icon: 'SparklesIcon' },
    ],
  },
  {
    titleKey: 'admin.groupComms',
    items: [
      { id: 'campaigns', labelKey: 'admin.navCampaigns', icon: 'EnvelopeIcon' },
      { id: 'tickets', labelKey: 'admin.navTickets', icon: 'LifebuoyIcon' },
    ],
  },
  {
    titleKey: 'admin.groupSystem',
    items: [
      { id: 'audit_log', labelKey: 'admin.navAuditLog', icon: 'ClipboardDocumentListIcon' },
      { id: 'system', labelKey: 'admin.navSystem', icon: 'CogIcon' },
      { id: 'settings', labelKey: 'admin.navSettings', icon: 'Cog6ToothIcon' },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  // Esc bilan mobile drawer'ni yopish
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  // Mobile drawer ochiq bo'lganda body scroll'ni bloklash
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link
        href="/admin-dashboard"
        className="flex items-center gap-2 px-6 py-5 border-b border-border"
        onClick={onMobileClose}
      >
        <BrandMark size={36} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-heading font-bold text-foreground leading-tight">Ustoz</p>
          <p className="text-xs text-muted-foreground">{t('admin.sidebarAdminPanel')}</p>
        </div>
      </Link>

      {/* Navigation — mazmuniga qarab guruhlangan */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.titleKey} className="space-y-1">
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t(group.titleKey)}
            </p>
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onMobileClose();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-warm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    className={isActive ? '' : 'text-muted-foreground'}
                  />
                  <span className="truncate">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User block (bottom) */}
      {user && (
        <div className="border-t border-border p-3">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-smooth text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {(user.fullName || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{user.fullName ?? user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{t('admin.roleAdmin')}</p>
            </div>
            <Icon name="ChevronRightIcon" size={16} className="text-muted-foreground flex-shrink-0" />
          </button>
          <ThemeToggle variant="row" className="mt-1" />
          <button
            onClick={async () => {
              try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
              router.push('/login');
              router.refresh();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-md text-destructive hover:bg-destructive/10 transition-smooth text-sm"
          >
            <Icon name="ArrowRightOnRectangleIcon" size={18} />
            <span>{t('admin.sidebarLogout')}</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-60 bg-card border-r border-border flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        <aside
          className={`relative h-full w-72 max-w-[80vw] bg-card flex flex-col shadow-warm-lg transition-transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
