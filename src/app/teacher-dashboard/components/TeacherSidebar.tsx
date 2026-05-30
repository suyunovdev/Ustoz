'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/common/UserMenu';

export type TeacherTabId =
  | 'overview'
  | 'courses'
  | 'students'
  | 'groups'
  | 'assignments'
  | 'tests'
  | 'analytics'
  | 'earnings'
  | 'reviews'
  | 'certificates'
  | 'messages';

interface NavItem {
  id: TeacherTabId;
  label: string;
  icon: string;
  href?: string; // tashqi sahifaga link
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: "Umumiy ko'rinish", icon: 'HomeIcon' },
  { id: 'courses', label: 'Kurslarim', icon: 'BookOpenIcon' },
  { id: 'students', label: 'Talabalarim', icon: 'UserGroupIcon', href: '/teacher-dashboard/students' },
  { id: 'groups', label: 'Guruhlar', icon: 'UsersIcon', href: '/teacher-dashboard/groups' },
  { id: 'assignments', label: 'Topshiriqlar', icon: 'ClipboardDocumentListIcon', href: '/teacher-dashboard/assignments' },
  { id: 'tests', label: 'Testlar', icon: 'AcademicCapIcon', href: '/teacher-dashboard/tests' },
  { id: 'analytics', label: 'Tahlil', icon: 'ChartBarIcon', href: '/teacher-dashboard/analytics' },
  { id: 'earnings', label: 'Daromad', icon: 'CurrencyDollarIcon', href: '/teacher-dashboard/earnings' },
  { id: 'reviews', label: 'Sharhlar', icon: 'ChatBubbleLeftRightIcon', href: '/teacher-dashboard/reviews' },
  { id: 'certificates', label: 'Sertifikatlar', icon: 'TrophyIcon', href: '/teacher-dashboard/certificates' },
  { id: 'messages', label: 'Xabarlar', icon: 'ChatBubbleOvalLeftIcon', href: '/messages' },
];

interface TeacherSidebarProps {
  /** Optional — agar berilmasa pathname'dan aniqlanadi */
  activeTab?: TeacherTabId;
  /** Optional — agar berilmasa, href-siz tab'lar bosilganda navigate qilinadi */
  onTabChange?: (tab: TeacherTabId) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function resolveActiveFromPath(pathname: string): TeacherTabId {
  if (pathname.startsWith('/teacher-dashboard/students')) return 'students';
  if (pathname.startsWith('/teacher-dashboard/groups')) return 'groups';
  if (pathname.startsWith('/teacher-dashboard/assignments')) return 'assignments';
  if (pathname.startsWith('/teacher-dashboard/tests')) return 'tests';
  if (pathname.startsWith('/teacher-dashboard/analytics')) return 'analytics';
  if (pathname.startsWith('/teacher-dashboard/earnings')) return 'earnings';
  if (pathname.startsWith('/teacher-dashboard/reviews')) return 'reviews';
  if (pathname.startsWith('/teacher-dashboard/certificates')) return 'certificates';
  if (pathname.startsWith('/teacher-dashboard/courses')) return 'courses';
  if (pathname.startsWith('/messages')) return 'messages';
  return 'overview';
}

export default function TeacherSidebar({
  activeTab: activeTabProp,
  onTabChange,
  mobileOpen,
  onMobileClose,
}: TeacherSidebarProps) {
  const pathname = usePathname() || '/teacher-dashboard';
  const activeTab = activeTabProp ?? resolveActiveFromPath(pathname);
  const { user } = useAuth();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

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
        href="/teacher-dashboard"
        className="flex items-center gap-2 px-6 py-5 border-b border-border"
        onClick={onMobileClose}
      >
        <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-md shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
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
          <p className="text-xs text-muted-foreground">O'qituvchi paneli</p>
        </div>
      </Link>

      {/* CTA: yangi kurs */}
      <div className="px-3 py-3 border-b border-border">
        <Link
          href="/course-creation"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium text-sm"
          onClick={onMobileClose}
        >
          <Icon name="PlusCircleIcon" size={18} />
          Yangi kurs
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const baseClasses = `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-smooth ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-warm'
              : 'text-foreground hover:bg-muted'
          }`;

          // Agar href bo'lsa — Link, aks holda — onTabChange button
          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onMobileClose}
                className={baseClasses}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  className={isActive ? '' : 'text-muted-foreground'}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          // href yo'q va onTabChange ham yo'q — Link sifatida /teacher-dashboard?tab=...
          if (!onTabChange) {
            return (
              <Link
                key={item.id}
                href={`/teacher-dashboard?tab=${item.id}`}
                onClick={onMobileClose}
                className={baseClasses}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  className={isActive ? '' : 'text-muted-foreground'}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onMobileClose();
              }}
              className={baseClasses}
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

      {/* User block */}
      {user && (
        <div className="border-t border-border p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.fullName ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">O'qituvchi</p>
          </div>
          <UserMenu user={user} />
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-60 bg-card border-r border-border flex-col z-40">
        {sidebarContent}
      </aside>

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
