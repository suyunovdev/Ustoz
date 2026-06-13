import type { Metadata } from 'next';
import CourseCreationInteractive from './components/CourseCreationInteractive';

export const metadata: Metadata = {
  title: 'Kurs yaratish — Ustoz',
  description: 'Video, test va topshiriqlar bilan kurslar yarating.',
};

export default function CourseCreationPage() {
  return <CourseCreationInteractive />;
}
