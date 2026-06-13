'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import TeacherSidebar from '@/app/teacher-dashboard/components/TeacherSidebar';

export default function AssignmentManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="md:hidden sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-muted transition-smooth"
          aria-label="Menyu"
        >
          <Icon name="Bars3Icon" size={24} />
        </button>
        <p className="font-heading font-semibold text-foreground">Topshiriqlar</p>
        <div className="w-9" />
      </div>

      <div className="md:ml-60 min-h-screen">{children}</div>
    </div>
  );
}
