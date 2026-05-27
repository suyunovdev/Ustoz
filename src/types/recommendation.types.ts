/**
 * Recommendation va Category type'lari
 *
 * Manba:
 *  - src/lib/services/recommendation.service.ts
 *  - src/app/api/categories/route.ts
 */

export type RecommendReason =
  | 'category_match'
  | 'popular'
  | 'new_arrival'
  | 'top_rated';

export interface RecommendedCourse {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  rating: number;
  enrollmentCount: number;
  priceUzs: number;
  totalDuration: number;
  difficultyLevel: string | null;
  category: { id: string; name: string; slug: string } | null;
  teacherName: string;
  recommendReason: RecommendReason;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  courseCount: number;
}
