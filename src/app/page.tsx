'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      const role = user?.role;
      if (role === 'teacher') {
        router?.replace('/teacher-dashboard');
      } else if (role === 'admin') {
        router?.replace('/admin-dashboard');
      } else {
        router?.replace('/course-marketplace');
      }
    } else {
      router?.replace('/landing-page');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
