'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface SortOption {
  id: string;
  label: string;
  icon: string;
}

interface SortControlsProps {
  currentSort: string;
  onSortChange: (sortId: string) => void;
}

const SortControls = ({ currentSort, onSortChange }: SortControlsProps) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: SortOption[] = [
    { id: 'popularity', label: t('marketplace.popular'), icon: 'FireIcon' },
    { id: 'price-low', label: t('marketplace.priceAsc'), icon: 'ArrowUpIcon' },
    { id: 'price-high', label: t('marketplace.priceDesc'), icon: 'ArrowDownIcon' },
    { id: 'rating', label: t('marketplace.highestRated'), icon: 'StarIcon' },
    { id: 'newest', label: t('marketplace.newest'), icon: 'ClockIcon' }
  ];

  const currentOption = sortOptions.find(opt => opt.id === currentSort) || sortOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSortSelect = (sortId: string) => {
    onSortChange(sortId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-card border border-border rounded-md hover:bg-muted transition-smooth"
        aria-label="Sort options"
      >
        <Icon name={currentOption.icon as any} size={20} />
        <span className="font-medium hidden sm:inline">{currentOption.label}</span>
        <span className="font-medium sm:hidden">{t('marketplace.sortBy')}</span>
        <Icon name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-popover rounded-md shadow-warm-lg border border-border z-200 overflow-hidden">
          <div className="py-2">
            {sortOptions.map((option, index) => {
              const isSelected = option.id === currentSort;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSortSelect(option.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-smooth ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  } ${index !== sortOptions.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon name={option.icon as any} size={20} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  {isSelected && <Icon name="CheckIcon" size={20} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortControls;