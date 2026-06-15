import type { Metadata } from 'next';
import { Suspense } from 'react';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import LearningInterfaceInteractive from './components/LearningInterfaceInteractive';

export const metadata: Metadata = {
  title: "Dars",
  description: "Video darslar, interaktiv transkript, eslatmalar va o'quv jarayonini kuzatish.",
};

export default function LearningInterfacePage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/learning-interface" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <LearningInterfaceInteractive />
      </Suspense>
    </>
  );
}
