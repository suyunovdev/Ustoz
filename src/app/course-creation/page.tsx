import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import CourseCreationInteractive from './components/CourseCreationInteractive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.courseCreateTitle'),
    description: t('meta.courseCreateDesc'),
  };
}

export default function CourseCreationPage() {
  return <CourseCreationInteractive />;
}
