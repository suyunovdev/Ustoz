'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/common/UserMenu';

export type AdminTabId =
  | 'overview'
  | 'users'
  | 'teacher_applications'
  | 'courses'
  | 'reviews'
  | 'payments'
  | 'campaigns'
  | 'moderation'
  | 'tickets'
  | 'audit_log'
  | 'analytics'
  | 'system';

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: "Umumiy ko'rinish", icon: 'HomeIcon' },
  { id: 'users', label: 'Foydalanuvchilar', icon: 'UserGroupIcon' },
  { id: 'teacher_applications', label: "O'qituvchi arizalari", icon: 'AcademicCapIcon' },
  { id: 'courses', label: 'Kurslar', icon: 'BookOpenIcon' },
  { id: 'reviews', label: 'Sharhlar', icon: 'ChatBubbleLeftRightIcon' },
  { id: 'payments', label: "To'lovlar", icon: 'CreditCardIcon' },
  { id: 'campaigns', label: 'Email yuborish', icon: 'EnvelopeIcon' },
  { id: 'moderation', label: 'Moderatsiya', icon: 'ShieldCheckIcon' },
  { id: 'tickets', label: 'Yordam so\'rovlari', icon: 'LifebuoyIcon' },
  { id: 'audit_log', label: 'Audit log', icon: 'ClipboardDocumentListIcon' },
  { id: 'analytics', label: 'Tahlil', icon: 'ChartBarIcon' },
  { id: 'system', label: 'Tizim', icon: 'CogIcon' },
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
        <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-md shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="currentColor"
              className="text-primary-foreground"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              className="text-primary-foreground"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              className="text-primary-foreground"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-heading font-bold text-foreground leading-tight">Ustoz</p>
          <p className="text-xs text-muted-foreground">Admin paneli</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onMobileClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-warm'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon
                name={item.icon}
                size={20}
                className={isActive ? '' : 'text-muted-foreground'}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User block (bottom) */}
      {user && (
        <div className="border-t border-border p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{user.fullName ?? user.email}</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
          <UserMenu user={user} />
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
