'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { useCategories } from '@/hooks/queries/useCategories';

interface CategoryFilterProps {
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategoryFilter = ({ selectedSlug, onSelect }: CategoryFilterProps) => {
  const { t } = useI18n();
  const { data, isLoading: loading } = useCategories();
  const categories = data?.categories ?? [];

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted rounded-full flex-shrink-0" />
        ))}
      </div>
    );
  }

  // Faqat kursi bor kategoriyalarni ko'rsat
  const visibleCategories = categories.filter((c) => c.courseCount > 0);

  if (visibleCategories.length === 0) return null;

  const baseBtn =
    'flex items-center space-x-2 px-4 py-2 rounded-md whitespace-nowrap transition-smooth flex-shrink-0';
  const active = 'bg-primary text-primary-foreground';
  const inactive = 'bg-card text-foreground hover:bg-muted';

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`${baseBtn} ${selectedSlug === null ? active : inactive}`}
      >
        <Icon name="Squares2X2Icon" size={18} />
        <span className="font-medium">{t('common.all')}</span>
      </button>

      {visibleCategories.map((cat) => {
        const isActive = selectedSlug === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => onSelect(cat.slug)}
            className={`${baseBtn} ${isActive ? active : inactive}`}
          >
            {cat.iconName && <Icon name={cat.iconName as any} size={18} />}
            <span className="font-medium">{cat.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted-foreground/15 text-muted-foreground'
              }`}
            >
              {cat.courseCount}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
