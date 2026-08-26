'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { optimizeImageUrl } from '@/lib/imageUrl';
import Icon from '@/components/ui/AppIcon';
import CategoryChips from './CategoryChips';
import FilterPanel from './FilterPanel';
import SearchBar from './SearchBar';
import SortControls from './SortControls';
import CourseGrid from './CourseGrid';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from '@/components/common/ErrorState';
import { useI18n } from '@/contexts/I18nContext';

const WISHLIST_KEY = 'ustoz_marketplace_wishlist';

interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorImage: string;
  instructorImageAlt: string;
  coverImage: string;
  coverImageAlt: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  enrollmentCount: number;
  difficulty: string;
  language: string;
  category: string;
  subjectCategory: string;
  targetAudience: string;
  gradeLevel: number | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface FilterOptions {
  priceRange: [number, number];
  currency: 'USD' | 'UZS';
  languages: string[];
  difficulty: string[];
  minRating: number;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
  categoryId?: string;
  subcategoryId?: string;
  subjectId?: string;
  tags?: string[];
}

const MarketplaceInteractive = () => {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeCategory, setActiveCategory] = useState(searchParams?.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [currentSort, setCurrentSort] = useState('popularity');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [wishlistedCourses, setWishlistedCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: t('courses.allCourses'), count: 0 },
  ]);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 5000000],
    currency: 'UZS',
    languages: [],
    difficulty: [],
    minRating: 0,
    targetAudience: '',
    subjectCategory: '',
    gradeLevel: '',
    categoryId: '',
    subcategoryId: '',
    subjectId: '',
    tags: [],
  });

  useEffect(() => {
    setIsHydrated(true);
    // Saqlangan kurslarni localStorage'dan tiklash (backend wishlist yo'q —
    // hech bo'lmaganda qurilmada barqaror saqlanadi, reload'da yo'qolmaydi)
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (raw) setWishlistedCourses(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/courses?limit=50&sortBy=enrollments', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mapped: Course[] = (data.courses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        instructor: c.teacherName || t('auth.teacher'),
        // Avatar bo'lmasa bo'sh — CourseCard initials-fallback ko'rsatadi (generic
        // template rasm EMAS)
        instructorImage: c.teacherAvatar || '',
        instructorImageAlt: t('marketplace.instructorImageAlt', { name: c.teacherName || t('auth.teacher') }),
        coverImage: c.coverImage ? optimizeImageUrl(c.coverImage, 500) : '',
        coverImageAlt: t('marketplace.courseCoverAlt', { title: c.title }),
        rating: Number(c.rating) || 0,
        reviewCount: c.reviewCount || 0,
        price: Number(c.priceUzs) || 0,
        currency: 'UZS',
        enrollmentCount: c.enrollmentCount || 0,
        difficulty: c.difficultyLevel || 'Beginner',
        language: c.language || 'uz',
        category: c.category || 'other',
        subjectCategory: c.subjectCategory || '',
        targetAudience: c.targetAudience || '',
        gradeLevel: typeof c.gradeLevel === 'number' ? c.gradeLevel : null,
        createdAt: c.createdAt || '',
      }));

      setCourses(mapped);

      // Build categories from data.
      // course.category — izchil bo'lmagan erkin matn (programming/Programming/
      // language/"Dasturlash va IT"). i18n kaliti bo'lsa — tarjima; aks holda
      // XOM kalit ("categories.language") EMAS, humanize qilingan nom ko'rsatiladi.
      // Katta/kichik harf variantlari birlashtiriladi (case-insensitive).
      const humanize = (raw: string): string => {
        const key = 'categories.' + raw;
        const translated = t(key);
        if (translated && translated !== key && !translated.startsWith('categories.')) {
          return translated;
        }
        const cleaned = raw.replace(/[_-]+/g, ' ').trim();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      };
      const catMap: Record<string, { count: number; label: string }> = {};
      mapped.forEach((c) => {
        const raw = c.category || 'other';
        const id = raw.toLowerCase();
        if (!catMap[id]) catMap[id] = { count: 0, label: humanize(raw) };
        catMap[id].count += 1;
      });
      const catList: Category[] = [
        { id: 'all', name: t('courses.allCourses'), count: mapped.length },
        ...Object.entries(catMap).map(([id, { count, label }]) => ({ id, name: label, count })),
      ];
      setCategories(catList);
    } catch (err) {
      console.error('Kurslarni yuklashda xato:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlistToggle = (courseId: string) => {
    if (!isHydrated) return;
    setWishlistedCourses((prev) => {
      const next = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const filterCourses = () => {
    let filtered = [...courses];

    if (activeCategory !== 'all') {
      // chip id lowercase — case-insensitive taqqoslash (programming == Programming)
      filtered = filtered.filter((c) => (c.category || '').toLowerCase() === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)
      );
    }

    filtered = filtered.filter((c) => {
      const price = c.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    if (filters.languages.length > 0) {
      filtered = filtered.filter((c) => filters.languages.includes(c.language));
    }

    // Qiyinlik — katta/kichik harfga bog'liq bo'lmagan taqqoslash
    if (filters.difficulty.length > 0) {
      const wanted = filters.difficulty.map((d) => d.toLowerCase());
      filtered = filtered.filter((c) => wanted.includes((c.difficulty || '').toLowerCase()));
    }

    // Auditoriya / fan / sinf — ilgari yig'ilardi-yu qo'llanilmasdi (o'lik filtr)
    if (filters.targetAudience) {
      filtered = filtered.filter((c) => c.targetAudience === filters.targetAudience);
    }
    if (filters.subjectCategory) {
      filtered = filtered.filter((c) => c.subjectCategory === filters.subjectCategory);
    }
    if (filters.gradeLevel) {
      filtered = filtered.filter((c) => String(c.gradeLevel ?? '') === filters.gradeLevel);
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter((c) => c.rating >= filters.minRating);
    }

    switch (currentSort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Haqiqiy sana bo'yicha — ilgari faqat reverse() edi (noto'g'ri)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    }

    return filtered;
  };

  const filteredCourses = isHydrated ? filterCourses() : courses;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-card rounded-md animate-pulse"></div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="h-12 bg-card rounded-md animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <LoadingSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">{t('courses.courseMarketplace')}</h1>
              <p className="text-muted-foreground mt-2">
                {filteredCourses.length} {t('courses.coursesAvailable')}
              </p>
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              <Icon name="AdjustmentsHorizontalIcon" size={20} />
              <span>{t('misc.filters')}</span>
            </button>
          </div>
          <CategoryChips
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBar onSearch={setSearchQuery} defaultValue={searchQuery} />
              </div>
              <SortControls currentSort={currentSort} onSortChange={setCurrentSort} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredCourses.length} {t('courses.coursesShowing')}
              </p>
              {wishlistedCourses.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Icon name="HeartIcon" size={16} variant="solid" className="text-error" />
                  <span>{wishlistedCourses.length} {t('courses.savedCount')}</span>
                </div>
              )}
            </div>

            {loadError ? (
              <ErrorState onRetry={fetchCourses} />
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filteredCourses.length === 0 ? (
                <div className="col-span-3 text-center py-16">
                  <Icon name="MagnifyingGlassIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">{t('courses.noCoursesFound')}</h3>
                  <p className="text-muted-foreground">{t('courses.tryOtherFilter')}</p>
                </div>
              ) : (
                <CourseGrid
                  courses={filteredCourses}
                  onWishlistToggle={handleWishlistToggle}
                  wishlistedCourses={wishlistedCourses}
                />
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceInteractive;
