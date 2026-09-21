'use client';

/**
 * Toolbar — ro'yxat sahifasi ustidagi izchil boshqaruv qatori:
 * chap tomonda qidiruv + filtr chiplari, o'ngda amal tugmalari.
 * SearchInput debounce'ni ichida boshqaradi (har panelda takrorlanmasin).
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  initial?: string;
  delayMs?: number;
  className?: string;
}

/** Debounce'li qidiruv inputi — foydalanuvchi to'xtagach `onSearch(trimmed)` chaqiradi. */
export function SearchInput({
  placeholder,
  onSearch,
  initial = '',
  delayMs = 300,
  className,
}: SearchInputProps) {
  const [value, setValue] = React.useState(initial);
  const debounced = useDebouncedValue(value, delayMs);
  const onSearchRef = React.useRef(onSearch);
  onSearchRef.current = onSearch;

  React.useEffect(() => {
    onSearchRef.current(debounced.trim());
  }, [debounced]);

  return (
    <div className={cx('relative w-full md:w-80', className)}>
      <Icon
        name="MagnifyingGlassIcon"
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-10 pl-10 pr-9 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {value && (
        <button
          type="button"
          aria-label="Tozalash"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-smooth"
        >
          <Icon name="XMarkIcon" size={14} className="text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export interface FilterChipOption<V extends string> {
  id: V;
  label: string;
  count?: number;
}

export function FilterChips<V extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: FilterChipOption<V>[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center gap-2 flex-wrap', className)}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cx(
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-smooth',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80',
            )}
          >
            {o.label}
            {o.count != null && (
              <span
                className={cx(
                  'text-xs rounded-full px-1.5 py-0.5 leading-none',
                  active ? 'bg-primary-foreground/20' : 'bg-background/60 text-muted-foreground',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Toolbar;
