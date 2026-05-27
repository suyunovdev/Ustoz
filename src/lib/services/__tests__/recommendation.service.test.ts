/**
 * recommendation.service.ts — unit testlar.
 *
 * Cold start, 60/30/10 distribution va exclude logic'ni sinaymiz.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/repositories', () => ({
  enrollmentRepo: {
    findCourseIdsAndCategories: vi.fn(),
  },
  courseRepo: {
    findPublishedByCategoriesExcluding: vi.fn(),
    findPublishedExcludingCategories: vi.fn(),
    findRecentPublished: vi.fn(),
    findTopRatedPublished: vi.fn(),
    findByIds: vi.fn(),
    findSimilarByEnrollment: vi.fn(),
  },
}));

import { getRecommendedCourses, getSimilarCourses } from '../recommendation.service';
import { enrollmentRepo, courseRepo } from '@/lib/repositories';

type AnyCourse = any;

function makeCourse(id: string, overrides: Partial<AnyCourse> = {}): AnyCourse {
  return {
    id,
    title: `Course ${id}`,
    description: 'desc',
    coverImage: null,
    rating: 4.5,
    enrollmentCount: 10,
    priceUzs: 0,
    totalDuration: 60,
    difficultyLevel: 'BEGINNER',
    categoryRel: { id: 'cat-1', name: 'Cat', slug: 'cat' },
    teacher: { fullName: 'Ustoz Ali' },
    categoryId: 'cat-1',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getRecommendedCourses — cold start (0 enrollment)', () => {
  it('top-rated kurslarni qaytaradi va recommendReason=top_rated', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([
      makeCourse('c1', { rating: 4.9 }),
      makeCourse('c2', { rating: 4.8 }),
      makeCourse('c3', { rating: 4.7 }),
    ]);

    const result = await getRecommendedCourses('new-user', 3);

    expect(result).toHaveLength(3);
    expect(result.every((r) => r.recommendReason === 'top_rated')).toBe(true);
    expect(result[0].id).toBe('c1');
  });

  it('cold start excludeIds parametrini hurmat qiladi', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([]);

    await getRecommendedCourses('new-user', 6, {
      excludeIds: ['excluded-1', 'excluded-2'],
    });

    expect(courseRepo.findTopRatedPublished).toHaveBeenCalledWith(
      ['excluded-1', 'excluded-2'],
      6,
      { minRating: undefined },
    );
  });
});

describe('getRecommendedCourses — 60/30/10 mix', () => {
  it('limit=10 → 6 relevant + 3 diversity + 1 fresh', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([
      { courseId: 'enrolled-1', categoryId: 'cat-A' },
      { courseId: 'enrolled-2', categoryId: 'cat-B' },
    ]);

    vi.mocked(courseRepo.findPublishedByCategoriesExcluding).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => makeCourse(`rel-${i}`)),
    );
    vi.mocked(courseRepo.findPublishedExcludingCategories).mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => makeCourse(`div-${i}`)),
    );
    vi.mocked(courseRepo.findRecentPublished).mockResolvedValue([
      makeCourse('new-0'),
    ]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([]);

    const result = await getRecommendedCourses('s1', 10);

    expect(result).toHaveLength(10);
    expect(result.filter((r) => r.recommendReason === 'category_match')).toHaveLength(6);
    expect(result.filter((r) => r.recommendReason === 'popular')).toHaveLength(3);
    expect(result.filter((r) => r.recommendReason === 'new_arrival')).toHaveLength(1);
  });

  it('enrolled kurslar exclude ro\'yxatiga qo\'shiladi', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([
      { courseId: 'enrolled-1', categoryId: 'cat-A' },
    ]);
    vi.mocked(courseRepo.findPublishedByCategoriesExcluding).mockResolvedValue([]);
    vi.mocked(courseRepo.findPublishedExcludingCategories).mockResolvedValue([]);
    vi.mocked(courseRepo.findRecentPublished).mockResolvedValue([]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([]);

    await getRecommendedCourses('s1', 6, { excludeIds: ['extra-1'] });

    const call = vi.mocked(courseRepo.findPublishedByCategoriesExcluding).mock
      .calls[0];
    // categoryIds, excludeIds, take, options
    expect(call[1]).toEqual(expect.arrayContaining(['enrolled-1', 'extra-1']));
  });

  it('relevant kam bo\'lsa, filler top-rated bilan to\'ldiriladi', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([
      { courseId: 'enrolled-1', categoryId: 'cat-A' },
    ]);
    vi.mocked(courseRepo.findPublishedByCategoriesExcluding).mockResolvedValue([
      makeCourse('rel-1'),
    ]);
    vi.mocked(courseRepo.findPublishedExcludingCategories).mockResolvedValue([]);
    vi.mocked(courseRepo.findRecentPublished).mockResolvedValue([]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([
      makeCourse('top-1'),
      makeCourse('top-2'),
      makeCourse('top-3'),
      makeCourse('top-4'),
      makeCourse('top-5'),
    ]);

    const result = await getRecommendedCourses('s1', 6);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(6);
    const fillerCount = result.filter((r) => r.recommendReason === 'top_rated').length;
    expect(fillerCount).toBeGreaterThan(0);
  });
});

describe('getRecommendedCourses — formatlash', () => {
  it('teacherName bo\'sh bo\'lsa "Ustoz" deb belgilanadi', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([
      makeCourse('c1', { teacher: { fullName: null } }),
    ]);

    const result = await getRecommendedCourses('s1', 1);
    expect(result[0].teacherName).toBe('Ustoz');
  });

  it('categoryRel null bo\'lsa category=null', async () => {
    vi.mocked(enrollmentRepo.findCourseIdsAndCategories).mockResolvedValue([]);
    vi.mocked(courseRepo.findTopRatedPublished).mockResolvedValue([
      makeCourse('c1', { categoryRel: null }),
    ]);

    const result = await getRecommendedCourses('s1', 1);
    expect(result[0].category).toBeNull();
  });
});

describe('getSimilarCourses', () => {
  it('overlap bo\'lmasa bo\'sh ro\'yxat qaytaradi', async () => {
    vi.mocked(courseRepo.findSimilarByEnrollment).mockResolvedValue([]);

    const result = await getSimilarCourses('course-1', 4);
    expect(result).toEqual([]);
    expect(courseRepo.findByIds).not.toHaveBeenCalled();
  });

  it('overlap order\'ni saqlaydi (findByIds qaytargan tartibni qayta tartiblaydi)', async () => {
    vi.mocked(courseRepo.findSimilarByEnrollment).mockResolvedValue([
      { id: 'b', overlap: BigInt(5) },
      { id: 'a', overlap: BigInt(3) },
      { id: 'c', overlap: BigInt(1) },
    ]);
    // findByIds tartibni saqlamaydi — boshqacha tartibda qaytaramiz
    vi.mocked(courseRepo.findByIds).mockResolvedValue([
      makeCourse('a'),
      makeCourse('c'),
      makeCourse('b'),
    ]);

    const result = await getSimilarCourses('course-1', 4);
    expect(result.map((r) => r.id)).toEqual(['b', 'a', 'c']);
    expect(result.every((r) => r.recommendReason === 'popular')).toBe(true);
  });
});
