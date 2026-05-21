import type { Metadata } from 'next';
import { Suspense } from 'react';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import CourseDetailsInteractive from './components/CourseDetailsInteractive';

export const metadata: Metadata = {
  title: 'Kurs Tafsilotlari - Ustoz',
  description: 'Kurs haqida to\'liq ma\'lumot, o\'quv dasturi, sharhlar va sotib olish imkoniyati.',
};

export default function CourseDetailsPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/course-details" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <CourseDetailsInteractive />
      </Suspense>
    </>
  );
}