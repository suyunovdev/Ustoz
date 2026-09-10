'use client';

/**
 * Huquqiy hujjatlar sahifasi (Foydalanish shartlari / Maxfiylik siyosati).
 *
 * Mehmon ham, kirgan foydalanuvchi ham ochadi (ro'yxatdan o'tish footeridagi havolalar
 * mehmonga ochiladi), shuning uchun sidebar emas — o'zining yengil sarlavha paneli:
 * "U" logo (bosh sahifaga) + orqaga qaytish. Kontent i18n kalitlaridan keladi.
 */
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

export interface LegalSection {
  heading: string;
  body: string;
}

interface LegalPageProps {
  icon: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  updatedLabel: string;
}

/** Matnni bloklarga bo'ladi: `\n\n` — paragraf; `• ` bilan boshlangan qatorlar — ro'yxat. */
function renderBody(body: string) {
  const blocks = body.split('\n\n');
  return blocks.map((block, bi) => {
    const lines = block.split('\n');
    const isList = lines.every((l) => l.trim().startsWith('• '));
    if (isList) {
      return (
        <ul key={bi} className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          {lines.map((l, li) => (
            <li key={li}>{l.replace(/^\s*•\s*/, '')}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="text-sm text-muted-foreground leading-relaxed">
        {block}
      </p>
    );
  });
}

export default function LegalPage({ icon, title, intro, sections, updatedLabel }: LegalPageProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Sarlavha paneli — logo + orqaga */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-heading font-bold text-foreground"
            aria-label="Ustoz"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">U</span>
            <span className="text-lg">Ustoz</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) window.history.back();
              else window.location.assign('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="ArrowLeftIcon" size={16} className="shrink-0" />
            <span className="hidden sm:inline">{t('common.back')}</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Bosh blok */}
        <div className="flex items-start gap-4 mb-8">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon name={icon} size={26} />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{updatedLabel}</p>
          </div>
        </div>

        <p className="text-foreground leading-relaxed mb-8">{intro}</p>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <section
              key={i}
              className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm"
            >
              <h2 className="font-heading font-semibold text-foreground mb-3">{section.heading}</h2>
              <div className="space-y-3">{renderBody(section.body)}</div>
            </section>
          ))}
        </div>

        {/* Pastki havolalar */}
        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-smooth">
            {t('auth.termsModalTitle')}
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/privacy" className="hover:text-primary transition-smooth">
            {t('auth.privacyModalTitle')}
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/help" className="hover:text-primary transition-smooth">
            {t('nav.help')}
          </Link>
        </div>
      </main>
    </div>
  );
}
