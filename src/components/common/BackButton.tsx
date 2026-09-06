'use client';

/**
 * "Orqaga" tugmasi — header/kontent tepasida ko'rinadi (suzuvchi emas).
 * Bosilganda oldingi sahifaga qaytadi (router.back()); tarix bo'sh bo'lsa — rolga mos
 * dashboardga yoki bosh sahifaga. Bosh/ildiz va auth sahifalarida yashiriladi (u yerda
 * o'z "Bosh sahifaga" navigatsiyasi bor).
 *
 * Joylashtirilishi: mehmon sahifalarida RoleBasedHeader ichida, kirgan foydalanuvchida
 * RoleBasedShell kontenti tepasida. `className` bilan joyni ota-komponent belgilaydi.
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

export default function BackButton({ className = '' }: { className?: string }) {
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
      className={
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 ' +
        'text-sm font-medium text-foreground shadow-sm transition-colors ' +
        'hover:bg-muted hover:border-primary/40 hover:text-primary ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
        className
      }
    >
      <Icon name="ArrowLeftIcon" size={16} className="shrink-0" />
      <span className="hidden sm:inline">{t('common.back')}</span>
    </button>
  );
}
