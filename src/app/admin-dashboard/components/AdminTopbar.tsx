'use client';

/**
 * AdminTopbar — kontent ustidagi yopishqoq (sticky) sarlavha paneli.
 * Mobil menyu tugmasi + joriy bo'lim sarlavhasi/tavsifi. CRM shell'ning tepasi.
 */
import Icon from '@/components/ui/AppIcon';

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export default function AdminTopbar({ title, subtitle, onMenuClick }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-3 h-14 md:h-16 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-smooth shrink-0"
          aria-label="Menyu"
        >
          <Icon name="Bars3Icon" size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-heading font-bold text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden md:block text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
