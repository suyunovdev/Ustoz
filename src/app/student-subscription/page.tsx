import { redirect } from 'next/navigation';

// Obuna bo'limi student tomonidan olib tashlandi (pay-per-course modeli). Eski havolalar
// 404 bermasin — dashboardga yo'naltiramiz. Backend/komponent dormant qoladi.
export default function SubscriptionPage() {
  redirect('/student-dashboard');
}
