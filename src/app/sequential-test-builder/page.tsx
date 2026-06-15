import type { Metadata } from 'next';
import SequentialTestBuilderInteractive from './components/SequentialTestBuilderInteractive';

export const metadata: Metadata = {
  title: 'Test yaratish',
  description: 'Kurslaringiz uchun keng qamrovli testlar yarating. Savol boshqaruvi, adaptiv testlash va avtomatik baholash imkoniyatlari.',
};

export default function SequentialTestBuilderPage() {
  return <SequentialTestBuilderInteractive />;
}