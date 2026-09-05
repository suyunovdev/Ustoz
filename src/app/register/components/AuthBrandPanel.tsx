import Link from 'next/link';
import RegistonEmblem from '@/app/landing-page/components/RegistonEmblem';
import BrandMark from '@/components/common/BrandMark';
import { AUTH_INK, AUTH_GOLD, AUTH_INK_TEXT } from './authTheme';

// Mobil brend sarlavhasi (lg'da brend paneli o'rnini bosadi — qog'oz fonda)
export function AuthMobileBrand() {
  return (
    <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 pt-8 pb-2">
      <BrandMark size={36} />
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
        <RegistonEmblem className="w-full h-full" />
      </div>

      {/* Logo */}
      <Link href="/" className="relative flex items-center gap-2.5 w-fit">
        <BrandMark size={36} />
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
              <path d="M5 12.5l4 4 10-10" stroke={AUTH_GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[0.95rem]" style={{ color: 'rgba(247,241,228,0.85)' }}>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
