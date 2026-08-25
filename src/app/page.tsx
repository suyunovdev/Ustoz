import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getServerT } from '@/lib/i18n/server';
import LandingPageInteractive from './landing-page/components/LandingPageInteractive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  // Root (/) — layout bilan BIR XIL segment, shuning uchun title template
  // (%s | Ustoz) qo'llanmaydi. Brendni o'zimiz qo'shamiz (SEO + izchillik).
  return {
    title: `${t('meta.landingTitle')} | Ustoz`,
    description: t('meta.landingDesc'),
  };
}

// getSession/getServerT `cookies()` o'qigani uchun dynamic.
export const dynamic = 'force-dynamic';

// Landing page endi ROOT (/) da — alohida /landing-page URL emas (SEO + UX).
// Mehmon → landing kontenti to'g'ridan-to'g'ri; authenticated → rol dashboard
// (server-side redirect, spinner/flash yo'q).
export default async function RootPage() {
  const session = await getSession();
  if (session) {
    if (session.role === 'teacher') redirect('/teacher-dashboard');
    if (session.role === 'admin') redirect('/admin-dashboard');
    redirect('/student-dashboard');
  }
  return <LandingPageInteractive />;
}
