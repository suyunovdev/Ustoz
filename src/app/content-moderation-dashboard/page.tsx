import { redirect } from 'next/navigation';

// Kontent moderatsiyasi endi admin panel ichida (sidebar bilan izchil):
// kurs + material moderatsiya /admin-dashboard'ning "Moderatsiya" tab'ida.
// Bu eski (orphan, sidebarsiz) sahifa o'sha yerga yo'naltiriladi.
export default function ContentModerationDashboardPage() {
  redirect('/admin-dashboard?tab=moderation');
}
