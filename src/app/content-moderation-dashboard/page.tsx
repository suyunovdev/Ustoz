import type { Metadata } from 'next';
import ModerationDashboardInteractive from './components/ModerationDashboardInteractive';

export const metadata: Metadata = {
  title: 'Moderatsiya',
  description: 'O\'qituvchilar yuklagan dars materiallarini, testlarni va tashqi havolalarni ko\'rib chiqish va tasdiqlash. Administrator uchun kontent moderatsiya paneli.',
};

export default function ContentModerationDashboardPage() {
  return <ModerationDashboardInteractive />;
}