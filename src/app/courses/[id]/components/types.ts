// Kurs tafsiloti sahifasi bo'ylab umumiy tiplar

/** Kichik kurs kartasi ma'lumoti (o'xshash kurslar / muallif kurslari) */
export interface CourseCardData {
  id: string;
  title: string;
  coverImage: string | null;
  priceUzs: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  difficultyLevel: string | null;
  teacherName: string;
}

/** Reyting taqsimoti bir darajasi (5→1) */
export interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}
