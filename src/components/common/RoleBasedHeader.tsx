// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
interface RoleBasedHeaderProps {
  userRole?: 'teacher' | 'student' | null;
  currentPath?: string;
}

const RoleBasedHeader = ({ currentPath = '/' }: RoleBasedHeaderProps) => {
  const livePathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');
  const activePath = livePathname || currentPath;
  const isItemActive = (itemPath: string) => {
    const [itemPathname, itemQuery = ''] = itemPath.split('?');
    if (activePath !== itemPathname) return false;
    if (!itemQuery) return !currentTab;
    const expectedTab = new URLSearchParams(itemQuery).get('tab');
    return expectedTab === currentTab;
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // AuthContext app shell darajasida bitta marta yuklanadi. Navigatsiya paytida
  // qayta mount qilinmaydi, shuning uchun user ma'lumoti darrov tayyor turadi.
  const { user, loading: authLoading } = useAuth();
  const currentUser = user;
  const userId = user?.id || null;
  const userRole: 'teacher' | 'student' | 'admin' | null = user?.role || null;

  // Public navigation (for non-authenticated users)
  const publicNavItems = [
    { label: 'Bosh Sahifa', path: '/landing-page', icon: 'HomeIcon' },
    { label: 'Kurslar', path: '/course-marketplace', icon: 'BookOpenIcon' },
    { label: 'Biz Haqimizda', path: '/about-page', icon: 'InformationCircleIcon' },
  ];

  // Teacher navigation
  const teacherNavItems = [
    { label: 'Dashboard', path: '/teacher-dashboard', icon: 'HomeIcon' },
    { label: 'Kurs Yaratish', path: '/course-creation', icon: 'PlusCircleIcon' },
    { label: 'Guruhlar', path: '/group-creation', icon: 'UserGroupIcon' },
    { label: 'Topshiriqlar', path: '/assignment-management', icon: 'ClipboardDocumentListIcon' },
  ];

  // Student navigation
  const studentNavItems = [
    { label: 'Dashboard', path: '/student-dashboard', icon: 'HomeIcon' },
    { label: 'Bozor', path: '/course-marketplace', icon: 'ShoppingBagIcon' },
    { label: 'Sertifikatlar', path: '/certificates', icon: 'TrophyIcon' },
  ];

  // Admin uchun header'da nav link'lar yo'q — admin paneli ichida tab'lar bor.
  // Faqat logo + UserMenu ko'rinadi.
  const getNavItems = () => {
    if (userRole === 'admin') return [];
    if (userRole === 'teacher') return teacherNavItems;
    if (userRole === 'student') return studentNavItems;
    return publicNavItems;
  };

  const navItems = getNavItems();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-card shadow-warm-md z-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={
              userRole === 'admin'
                ? '/admin-dashboard'
                : userRole === 'teacher'
                ? '/teacher-dashboard'
                : userRole === 'student'
                ? '/student-dashboard'
                : '/landing-page'
            }
            className="flex items-center space-x-2 transition-smooth hover:opacity-80"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-heading font-bold text-foreground">Ustoz</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = isItemActive(item.path);
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-smooth ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted hover:-translate-y-0.5'
                  }`}
                >
                  <Icon name={item.icon as any} size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {userId && <NotificationBell userId={userId} />}

            {/* Logged-in: avatar menu (til + theme + chiqish ichida) */}
            {currentUser && <UserMenu user={currentUser} />}

            {/* Guest: language selector + Login/Register */}
            {!userRole && (
              <>
                <LanguageSelector />
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-smooth font-medium"
                  >
                    Kirish
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md transition-smooth hover:opacity-90 font-medium"
                  >
                    Ro'yxat
                  </Link>
                </div>
              </>
            )}

            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-foreground hover:bg-muted transition-smooth"
              aria-label="Toggle mobile menu"
            >
              <Icon name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = isItemActive(item.path);
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-smooth ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon name={item.icon as any} size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile Auth Buttons for Public Users */}
            {!userRole && (
              <div className="pt-4 border-t border-border space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3 text-foreground hover:bg-muted rounded-md transition-smooth font-medium"
                >
                  Kirish
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-3 bg-primary text-primary-foreground rounded-md transition-smooth hover:opacity-90 font-medium"
                >
                  Ro'yxatdan O'tish
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default RoleBasedHeader;