import type { Metadata } from 'next';
import SequentialTestBuilderInteractive from './components/SequentialTestBuilderInteractive';

export const metadata: Metadata = {
  title: 'Ketma-ket test yaratish - Ustoz',
  description: 'Kurslaringiz uchun keng qamrovli testlar yarating. Savol boshqaruvi, adaptiv testlash va avtomatik baholash imkoniyatlari.',
};

export default function SequentialTestBuilderPage() {
  return <SequentialTestBuilderInteractive />;
}