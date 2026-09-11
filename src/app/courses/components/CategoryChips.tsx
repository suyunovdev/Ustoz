'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryChipsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

/**
 * Kategoriya filtri — dropdown ko'rinishida (ilgari gorizontal chip qatori edi).
 * Interaktivlik namunasi: SortControls.tsx (bir papkada) bilan izchil.
 */
const CategoryChips = ({ categories, activeCategory, onCategoryChange }: CategoryChipsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = categories.find((c) => c.id === activeCategory) ?? categories[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onCategoryChange(id);
    setIsOpen(false);
  };

  if (!current) return null;

  return (
    <div className="relative w-full sm:w-64" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={current.name}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl hover:bg-muted hover:border-primary/40 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="AdjustmentsHorizontalIcon" size={18} className="text-primary shrink-0" />
        <span className="font-medium text-foreground truncate">{current.name}</span>
        <span className="px-2 py-0.5 text-xs font-data rounded-full bg-muted text-muted-foreground shrink-0">
          {current.count}
        </span>
        <Icon
          name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={16}
          className="ml-auto shrink-0 text-muted-foreground"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={current.name}
          className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-popover border border-border rounded-xl shadow-warm-lg z-[200] overflow-hidden"
        >
          <div className="py-1.5 max-h-80 overflow-y-auto">
            {categories.map((category) => {
              const isSelected = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(category.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-smooth ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {isSelected && <Icon name="CheckIcon" size={16} className="shrink-0" />}
                    <span className="font-medium truncate">{category.name}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-data rounded-full shrink-0 ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryChips;
