'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import TeacherSidebar from '@/app/teacher-dashboard/components/TeacherSidebar';
import AdminSidebar from '@/app/admin-dashboard/components/AdminSidebar';
import StudentSidebar from '@/app/student-dashboard/components/StudentSidebar';

/**
 * Rol-aware layout: kirgan foydalanuvchi rolига qarab tegishli sidebar'ni ko'rsatadi
 * (student / teacher / admin). Ulashilgan authenticated sahifalarda ishlatiladi.
 *
 * initialRole — server layout'dan (getSession) uzatiladi: SSR'da to'g'ri sidebar
 * ko'rinadi (flash / hydration mismatch bo'lmaydi). Client'da jonli user ustun.
 */
export default function RoleBasedShell({
  children,
  initialRole = null,
}: {
  children: React.ReactNode;
  initialRole?: 'student' | 'teacher' | 'admin' | null;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const role = user?.role ?? initialRole;
  const close = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip-to-content — klaviatura foydalanuvchilari uchun */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        {t('common.skipToContent')}
      </a>
      {role === 'admin' ? (
        <AdminSidebar
          activeTab="overview"
          onTabChange={() => router.push('/admin-dashboard')}
          mobileOpen={mobileNavOpen}
          onMobileClose={close}
        />
      ) : role === 'teacher' ? (
        <TeacherSidebar mobileOpen={mobileNavOpen} onMobileClose={close} />
      ) : (
        <StudentSidebar mobileOpen={mobileNavOpen} onMobileClose={close} />
      )}

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted transition-smooth"
          aria-label="Menyu"
        >
          <Icon name="Bars3Icon" size={24} />
        </button>
        <p className="font-heading font-semibold text-foreground">Ustoz</p>
        <div className="w-9" />
      </div>

      <main id="main-content" className="md:ml-60 min-h-screen">{children}</main>
    </div>
  );
}
