import type { Metadata } from 'next';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import CourseCreationInteractive from './components/CourseCreationInteractive';

export const metadata: Metadata = {
  title: 'Course Creation - Ustoz',
  description: 'Create and publish comprehensive educational courses with rich media content, interactive quizzes, and structured learning paths for your students.',
};

export default function CourseCreationPage() {
  return (
    <>
      <RoleBasedHeader userRole="teacher" currentPath="/course-creation" />
      <CourseCreationInteractive />
    </>
  );
}