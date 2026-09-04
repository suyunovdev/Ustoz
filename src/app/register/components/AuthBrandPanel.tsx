import Link from 'next/link';
import GirihEmblem from '@/app/landing-page/components/GirihEmblem';
import { AUTH_INK, AUTH_GOLD, AUTH_INK_TEXT } from './authTheme';

// Mobil brend sarlavhasi (lg'da brend paneli o'rnini bosadi — qog'oz fonda)
export function AuthMobileBrand() {
  return (
    <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 pt-8 pb-2">
      <span className="flex items-center justify-center w-9 h-9 rounded-[10px]" style={{ background: AUTH_GOLD }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path d="M12 1.5l2.4 5.1 5.6.7-4.1 3.9 1.1 5.6L12 19.9 6.9 22.8 8 17.2 3.9 13.3l5.6-.7L12 1.5z" fill={AUTH_INK} opacity="0.92" />
        </svg>
      </span>
      <span className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: AUTH_INK_TEXT }}>
        Ustoz
      </span>
    </Link>
  );
}

// ─── Auth brend paneli ───
// Login/register chap tomonidagi ink panel — girih emblema, Fraunces sarlavha va
// ishonch nuqtalari. Landing identitetini auth oqimiga olib kiradi. Faqat lg+ da
// ko'rinadi (mobil'da forma ustuni to'liq egallaydi).
export default function AuthBrandPanel({
  title,
  subtitle,
  trust,
}: {
  title: string;
  subtitle: string;
  trust: string[];
}) {
  return (
    <aside
      className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden lg:sticky lg:top-0 lg:h-screen"
      style={{ background: AUTH_INK }}
    >
      {/* nozik oltin nur */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(90% 70% at 30% 20%, rgba(223,162,58,0.16), transparent 60%)' }}
      />
      {/* katta girih voda-belgisi */}
      <div className="absolute -right-28 -bottom-28 w-[28rem] h-[28rem] opacity-[0.16] pointer-events-none">
        <GirihEmblem className="w-full h-full" />
      </div>

      {/* Logo */}
      <Link href="/" className="relative flex items-center gap-2.5 w-fit">
        <span
          className="flex items-center justify-center w-9 h-9 rounded-[10px]"
          style={{ background: AUTH_GOLD, boxShadow: '0 2px 10px rgba(223,162,58,0.35)' }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M12 1.5l2.4 5.1 5.6.7-4.1 3.9 1.1 5.6L12 19.9 6.9 22.8 8 17.2 3.9 13.3l5.6-.7L12 1.5z" fill={AUTH_INK} opacity="0.92" />
          </svg>
        </span>
        <span className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#F7F1E4' }}>
          Ustoz
        </span>
      </Link>

      {/* Sarlavha */}
      <div className="relative max-w-md">
        <h2
          className="font-medium leading-[1.08] tracking-[-0.01em]"
          style={{ fontFamily: 'var(--font-display)', color: '#F7F1E4', fontSize: 'clamp(2rem, 3vw, 3rem)' }}
        >
          {title}
        </h2>
        <p className="mt-5 text-lg leading-relaxed" style={{ color: 'rgba(247,241,228,0.72)' }}>
          {subtitle}
        </p>
      </div>

      {/* Ishonch nuqtalari */}
      <ul className="relative space-y-3.5">
        {trust.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <path d="M12 1.5l2.4 5.1 5.6.7-4.1 3.9 1.1 5.6L12 19.9 6.9 22.8 8 17.2 3.9 13.3l5.6-.7L12 1.5z" fill={AUTH_GOLD} />
            </svg>
            <span className="text-[0.95rem]" style={{ color: 'rgba(247,241,228,0.85)' }}>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
