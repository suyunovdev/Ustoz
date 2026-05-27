/**
 * streak.service.ts — unit testlar.
 *
 * `activityRepo.findRecentDates`'ni mock qilamiz va `vi.useFakeTimers`
 * orqali bugungi sanani fiksatsiya qilamiz, shunda streak hisoblash
 * deterministik bo'ladi.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/repositories', () => ({
  activityRepo: {
    findRecentDates: vi.fn(),
    findRecentDatesAsc: vi.fn(),
    findByDateRange: vi.fn(),
  },
}));

import { getStreakData, getCurrentStreak, getLongestStreak } from '../streak.service';
import { activityRepo } from '@/lib/repositories';

/** UTC-fixed sana (DST/timezone'siz) */
function utc(daysAgo: number, base = new Date('2026-05-27T00:00:00.000Z')): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Bugungi sana = 2026-05-27 UTC
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-27T12:30:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getStreakData', () => {
  it('activity ro\'yxati bo\'sh → current=0, longest=0, activeToday=false', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([]);

    const result = await getStreakData('s1');
    expect(result).toEqual({
      current: 0,
      longest: 0,
      lastActivityDate: null,
      activeToday: false,
    });
  });

  it('faqat bugun → current=1, activeToday=true', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([{ date: utc(0) }]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
    expect(result.activeToday).toBe(true);
    expect(result.lastActivityDate).toBe('2026-05-27');
  });

  it('bugun + kecha → current=2', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([
      { date: utc(0) },
      { date: utc(1) },
    ]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
    expect(result.activeToday).toBe(true);
  });

  it('faqat kecha (bugun yo\'q) → current=1, activeToday=false', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([{ date: utc(1) }]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(1);
    expect(result.activeToday).toBe(false);
  });

  it('eng so\'nggi faollik 3+ kun avval → current=0 (streak yo\'q)', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([
      { date: utc(3) },
      { date: utc(4) },
      { date: utc(5) },
    ]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(0);
    // longest = 3 (uzluksiz uchlik)
    expect(result.longest).toBe(3);
    expect(result.activeToday).toBe(false);
  });

  it('5 kun ketma-ket (bugundan boshlab) → current=5', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([
      { date: utc(0) },
      { date: utc(1) },
      { date: utc(2) },
      { date: utc(3) },
      { date: utc(4) },
    ]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(5);
    expect(result.longest).toBe(5);
  });

  it('uzilishli streak: bugun+kecha + 10 kun avval 4 kun → current=2, longest=4', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([
      { date: utc(0) },
      { date: utc(1) },
      // gap
      { date: utc(10) },
      { date: utc(11) },
      { date: utc(12) },
      { date: utc(13) },
    ]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(2);
    expect(result.longest).toBe(4);
  });

  it('aynan bitta kun (faqat 7 kun avval) → current=0, longest=1', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([{ date: utc(7) }]);

    const result = await getStreakData('s1');
    expect(result.current).toBe(0);
    expect(result.longest).toBe(1);
    expect(result.activeToday).toBe(false);
  });
});

describe('getCurrentStreak', () => {
  it('public API — getStreakData bilan bir xil natija beradi', async () => {
    vi.mocked(activityRepo.findRecentDates).mockResolvedValue([
      { date: utc(0) },
      { date: utc(1) },
      { date: utc(2) },
    ]);

    const current = await getCurrentStreak('s1');
    expect(current).toBe(3);
  });
});

describe('getLongestStreak', () => {
  it('ASC repo\'dan o\'qiydi va eng uzun ketma-ketlikni qaytaradi', async () => {
    vi.mocked(activityRepo.findRecentDatesAsc).mockResolvedValue([
      { date: utc(20) },
      { date: utc(19) },
      { date: utc(18) },
      { date: utc(17) }, // 4 kun
      { date: utc(10) },
      { date: utc(9) }, // 2 kun
    ]);

    const longest = await getLongestStreak('s1');
    expect(longest).toBe(4);
  });
});
