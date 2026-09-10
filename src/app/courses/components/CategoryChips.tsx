'use client';



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

const CategoryChips = ({ categories, activeCategory, onCategoryChange }: CategoryChipsProps) => {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex items-center space-x-3 min-w-max pb-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-smooth whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-warm-md'
                  : 'bg-card text-foreground hover:bg-muted hover:-translate-y-0.5'
              }`}
            >
              <span className="font-medium">{category.name}</span>
              <span className={`px-2 py-0.5 text-xs font-data rounded-full ${
                isActive ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {category.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChips;