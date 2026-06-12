import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/repositories', () => ({
  notificationRepo: {
    listForUser: vi.fn(),
    getUnreadCount: vi.fn(),
    getCountsByType: vi.fn(),
    markAsRead: vi.fn(),
    markManyAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    archive: vi.fn(),
    archiveAll: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

import {
  getInbox,
  getBadge,
  markRead,
  markMultipleRead,
  markAllRead,
  archive,
  archiveAll,
  deleteOne,
} from '../notification.service';
import { notificationRepo } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';

const USER_ID = 'user-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getInbox', () => {
  it('barcha ma\'lumotlarni parallel yuklaydi', async () => {
    vi.mocked(notificationRepo.listForUser).mockResolvedValue({
      rows: [{ id: 'n-1' }],
      nextCursor: null,
    } as any);
    vi.mocked(notificationRepo.getUnreadCount).mockResolvedValue(3);
    vi.mocked(notificationRepo.getCountsByType).mockResolvedValue({
      enrollment: 1,
      payment: 2,
    } as any);

    const result = await getInbox(USER_ID, {});
    expect(result.rows).toHaveLength(1);
    expect(result.unreadCount).toBe(3);
    expect(result.countsByType).toMatchObject({ enrollment: 1, payment: 2 });
  });

  it('noto\'g\'ri status filtri e\'tiborsiz qoldiriladi', async () => {
    vi.mocked(notificationRepo.listForUser).mockResolvedValue({ rows: [], nextCursor: null } as any);
    vi.mocked(notificationRepo.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notificationRepo.getCountsByType).mockResolvedValue({} as any);

    await getInbox(USER_ID, { status: 'invalid_status' });
    expect(notificationRepo.listForUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ status: undefined }),
    );
  });

  it('to\'g\'ri status filtri uzatiladi', async () => {
    vi.mocked(notificationRepo.listForUser).mockResolvedValue({ rows: [], nextCursor: null } as any);
    vi.mocked(notificationRepo.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notificationRepo.getCountsByType).mockResolvedValue({} as any);

    await getInbox(USER_ID, { status: 'unread' });
    expect(notificationRepo.listForUser).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ status: 'unread' }),
    );
  });
});

describe('getBadge', () => {
  it('o\'qilmagan sonni qaytaradi', async () => {
    vi.mocked(notificationRepo.getUnreadCount).mockResolvedValue(5);
    const result = await getBadge(USER_ID);
    expect(result).toEqual({ unreadCount: 5 });
  });
});

describe('markRead', () => {
  it('notifikatsiyani o\'qilgan deb belgilaydi', async () => {
    await markRead('n-1', USER_ID);
    expect(notificationRepo.markAsRead).toHaveBeenCalledWith('n-1', USER_ID);
  });
});

describe('markMultipleRead', () => {
  it('bo\'sh ro\'yxat — 0 qaytaradi', async () => {
    const result = await markMultipleRead([], USER_ID);
    expect(result).toEqual({ updated: 0 });
    expect(notificationRepo.markManyAsRead).not.toHaveBeenCalled();
  });

  it('200 dan ortiq — ValidationError', async () => {
    const ids = Array.from({ length: 201 }, (_, i) => `n-${i}`);
    await expect(markMultipleRead(ids, USER_ID)).rejects.toThrow(ValidationError);
  });

  it('muvaffaqiyatli belgilash', async () => {
    vi.mocked(notificationRepo.markManyAsRead).mockResolvedValue(3);
    const result = await markMultipleRead(['n-1', 'n-2', 'n-3'], USER_ID);
    expect(result).toEqual({ updated: 3 });
  });
});

describe('markAllRead', () => {
  it('hammasini o\'qilgan deb belgilaydi', async () => {
    vi.mocked(notificationRepo.markAllAsRead).mockResolvedValue(10);
    const result = await markAllRead(USER_ID);
    expect(result).toEqual({ updated: 10 });
  });
});

describe('archive', () => {
  it('notifikatsiyani arxivlaydi', async () => {
    await archive('n-1', USER_ID);
    expect(notificationRepo.archive).toHaveBeenCalledWith('n-1', USER_ID);
  });
});

describe('archiveAll', () => {
  it('hammasini arxivlaydi', async () => {
    vi.mocked(notificationRepo.archiveAll).mockResolvedValue(7);
    const result = await archiveAll(USER_ID);
    expect(result).toEqual({ updated: 7 });
  });
});

describe('deleteOne', () => {
  it('notifikatsiyani o\'chiradi', async () => {
    await deleteOne('n-1', USER_ID);
    expect(notificationRepo.deleteNotification).toHaveBeenCalledWith('n-1', USER_ID);
  });
});
