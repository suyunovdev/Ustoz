import type { Metadata } from 'next';
import LandingPageInteractive from './components/LandingPageInteractive';

export const metadata: Metadata = {
  title: 'Bosh sahifa',
  description: "O'qituvchilar va o'quvchilar uchun zamonaviy onlayn ta'lim platformasi. Kurslar yarating, o'rganing va rivojlaning.",
};

// 60 sekund cache — har 60 sekundda yangilanadi
export const revalidate = 60;

export default function LandingPage() {
  return <LandingPageInteractive />;
}
