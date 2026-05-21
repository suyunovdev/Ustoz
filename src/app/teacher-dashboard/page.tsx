import type { Metadata } from 'next';
import TeacherDashboardInteractive from './components/TeacherDashboardInteractive';

export const metadata: Metadata = {
  title: 'O\'qituvchi paneli - Ustoz',
  description: 'Kurslaringizni boshqaring, daromadingizni kuzating va talabalar faolligini tahlil qiling. O\'qituvchilar uchun to\'liq boshqaruv paneli.',
};

export default function TeacherDashboardPage() {
  return <TeacherDashboardInteractive />;
}