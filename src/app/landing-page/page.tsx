import type { Metadata } from 'next';
import LandingPageInteractive from './components/LandingPageInteractive';

export const metadata: Metadata = {
  title: 'Bosh sahifa',
  description: 'O\'qituvchilar va o\'quvchilar uchun zamonaviy onlayn ta\'lim platformasi. Kurslar yarating, o\'rganing va rivojlaning.',
};

export default function LandingPage() {
  return <LandingPageInteractive />;
}