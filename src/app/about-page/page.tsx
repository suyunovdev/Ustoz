import type { Metadata } from 'next';
import AboutPageInteractive from './components/AboutPageInteractive';

export const metadata: Metadata = {
  title: 'Biz Haqimizda - Ustoz',
  description: 'Ustoz platformasining missiyasi, jamoasi va ta\'lim falsafasi haqida to\'liq ma\'lumot.',
};

export default function AboutPage() {
  return <AboutPageInteractive />;
}