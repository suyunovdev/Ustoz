import type { Metadata } from 'next';
import AdminDashboardInteractive from './components/AdminDashboardInteractive';

export const metadata: Metadata = {
  title: 'Admin paneli - Ustoz',
  description: 'Platformani boshqaring, foydalanuvchilarni nazorat qiling, kurslarni kuzating va tizim tahlilini ko\'ring. Administratorlar uchun to\'liq boshqaruv paneli.',
};

export default function AdminDashboardPage() {
  return <AdminDashboardInteractive />;
}