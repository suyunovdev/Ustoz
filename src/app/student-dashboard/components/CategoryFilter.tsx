'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
}

const CategoryFilter = ({ categories, onCategorySelect }: CategoryFilterProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategorySelect(categoryId);
  };

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => handleCategoryClick('all')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md whitespace-nowrap transition-smooth flex-shrink-0 ${
          selectedCategory === 'all' ?'bg-primary text-primary-foreground' :'bg-card text-foreground hover:bg-muted'
        }`}
      >
        <Icon name="Squares2X2Icon" size={18} />
        <span className="font-medium">Barchasi</span>
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md whitespace-nowrap transition-smooth flex-shrink-0 ${
            selectedCategory === category.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-foreground hover:bg-muted'
          }`}
        >
          <Icon name={category.icon as any} size={18} />
          <span className="font-medium">{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;