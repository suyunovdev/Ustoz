'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Kurslarni qidirish..."
        className="w-full px-4 py-3 pl-12 bg-card border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
      />
      <button
        type="submit"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
        aria-label="Qidirish"
      >
        <Icon name="MagnifyingGlassIcon" size={20} />
      </button>
      {searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            onSearch('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Tozalash"
        >
          <Icon name="XMarkIcon" size={20} />
        </button>
      )}
    </form>
  );
};

export default SearchBar;