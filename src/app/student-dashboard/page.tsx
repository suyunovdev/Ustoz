import type { Metadata } from 'next';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import StudentDashboardInteractive from './components/StudentDashboardInteractive';

export const metadata: Metadata = {
  title: 'Student Dashboard - Ustoz',
  description: 'Track your learning progress, access purchased courses, and discover new educational content on Ustoz platform.',
};

export default function StudentDashboardPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/student-dashboard" />
      <StudentDashboardInteractive />
    </>
  );
}