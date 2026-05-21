import type { Metadata } from 'next';
import { Suspense } from 'react';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import QuizInterfaceInteractive from './components/QuizInterfaceInteractive';

export const metadata: Metadata = {
  title: 'Test topshirish - Ustoz',
  description: 'Interaktiv test topshirish interfeysi. Savollarni javoblang, vaqtni kuzating va natijalaringizni ko\'ring.',
};

export default function QuizInterfacePage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/quiz-interface" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <QuizInterfaceInteractive />
      </Suspense>
    </>
  );
}