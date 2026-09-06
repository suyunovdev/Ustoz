'use client';

/**
 * Global suzuvchi "orqaga" tugmasi — barcha ichki sahifalarda chap-pastda ko'rinadi.
 * Bosilganda oldingi sahifaga qaytadi (router.back()); tarix bo'sh bo'lsa — rolga mos
 * dashboardga yoki bosh sahifaga. Bosh/ildiz va auth sahifalarida yashiriladi (u yerda
 * o'z "Bosh sahifaga" navigatsiyasi bor).
 *
 * RootLayout'da bir marta render qilinadi — hech bir sahifaga alohida qo'shish shart emas.
 */
import { useRouter, usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

// Bu sahifalarda tugma ko'rinmaydi: ildiz/dashboard bosh sahifalari + auth oqimi.
const HIDDEN_PATHS = new Set<string>([
  '/',
  '/landing-page',
  '/student-dashboard',
  '/teacher-dashboard',
  '/admin-dashboard',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

function dashboardHref(role: string | undefined): string {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'teacher') return '/teacher-dashboard';
  if (role === 'student') return '/student-dashboard';
  return '/';
}

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();

  if (!pathname || HIDDEN_PATHS.has(pathname)) return null;

  const handleClick = () => {
    // Tarixda oldingi sahifa bo'lsa — o'shanga qaytamiz; aks holda (to'g'ridan-to'g'ri
    // ochilgan) rolga mos dashboardga o'tamiz, sayt tashqarisiga chiqib ketmaslik uchun.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(dashboardHref(user?.role));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('common.back')}
      title={t('common.back')}
      className="group fixed bottom-5 right-4 z-40 inline-flex items-center gap-0
                 h-12 rounded-full bg-primary text-primary-foreground shadow-warm-lg
                 px-3.5 hover:bg-primary/90
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                 transition-all duration-200 motion-reduce:transition-none"
    >
      <Icon name="ArrowLeftIcon" size={20} className="shrink-0 transition-transform duration-200 motion-reduce:transition-none group-hover:-translate-x-0.5" />
      {/* Hover'da yoyiladigan matn — kompakt, lekin ma'noli */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0
                       transition-all duration-200 motion-reduce:transition-none
                       group-hover:max-w-[7rem] group-hover:pl-2 group-hover:opacity-100">
        {t('common.back')}
      </span>
    </button>
  );
}
