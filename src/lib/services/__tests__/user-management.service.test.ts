/**
 * user-management.service.ts — unit testlar.
 *
 * Repository + prisma.$transaction mock'lanadi (DB'ga ulanmaymiz).
 * Biznes qoidalarni (self-action, last admin, idempotency) tekshiramiz.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/repositories', () => ({
  userRepo: {
    findManyForAdmin: vi.fn(),
    countForAdmin: vi.fn(),
    findById: vi.fn(),
    updateActiveStatus: vi.fn(),
    updateRole: vi.fn(),
    countActiveAdmins: vi.fn(),
  },
  auditLogRepo: {
    create: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb({})),
  },
}));

// auth-helpers → next/headers ko'tarmasligi uchun mock
vi.mock('@/lib/auth-helpers', () => ({
  getClientIp: () => null,
  getUserAgent: () => null,
}));

import {
  listUsers,
  suspendUser,
  activateUser,
  changeUserRole,
} from '../user-management.service';
import { userRepo, auditLogRepo } from '@/lib/repositories';
import {
  SelfActionError,
  LastAdminError,
  UserNotFoundError,
  ValidationError,
} from '@/lib/errors';

const ADMIN_A = 'admin-a';
const USER_X = 'user-x';

function makeUser(overrides: Partial<any> = {}) {
  return {
    id: USER_X,
    email: 'user@test.uz',
    fullName: 'Test User',
    role: 'student',
    avatarUrl: null,
    isActive: true,
    deletedAt: null,
    lastLoginAt: null,
    createdAt: new Date('2026-05-01'),
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listUsers', () => {
  it('paginated natija: nextCursor mavjud bo\'lganda', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => makeUser({ id: `u${i}` }));
    vi.mocked(userRepo.findManyForAdmin).mockResolvedValue(rows);
    vi.mocked(userRepo.countForAdmin).mockResolvedValue(50);

    const result = await listUsers({ limit: 20 });
    expect(result.users).toHaveLength(20);
    expect(result.nextCursor).toBe('u19'); // 20-chi qator (index 19)
    expect(result.total).toBe(50);
  });

  it('oxirgi sahifa: nextCursor=null', async () => {
    const rows = [makeUser({ id: 'u1' }), makeUser({ id: 'u2' })];
    vi.mocked(userRepo.findManyForAdmin).mockResolvedValue(rows);
    vi.mocked(userRepo.countForAdmin).mockResolvedValue(2);

    const result = await listUsers({ limit: 20 });
    expect(result.users).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });
});

describe('suspendUser', () => {
  it('o\'zini suspend qilishga urinish → SelfActionError', async () => {
    await expect(suspendUser(ADMIN_A, ADMIN_A, undefined)).rejects.toThrow(SelfActionError);
  });

  it('user topilmasa → UserNotFoundError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(suspendUser(ADMIN_A, USER_X, undefined)).rejects.toThrow(UserNotFoundError);
  });

  it('allaqachon suspended → idempotent (audit yozilmaydi)', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ isActive: false }));
    const result = await suspendUser(ADMIN_A, USER_X, undefined);
    expect(result.isActive).toBe(false);
    expect(auditLogRepo.create).not.toHaveBeenCalled();
    expect(userRepo.updateActiveStatus).not.toHaveBeenCalled();
  });

  it('oxirgi adminni suspend qilish → LastAdminError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(userRepo.countActiveAdmins).mockResolvedValue(1);
    await expect(suspendUser(ADMIN_A, USER_X, 'reason')).rejects.toThrow(LastAdminError);
  });

  it('muvaffaqiyatli suspend: audit + update chaqiriladi', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ role: 'student' }));
    vi.mocked(userRepo.updateActiveStatus).mockResolvedValue(makeUser({ isActive: false }));

    const result = await suspendUser(ADMIN_A, USER_X, 'spam');
    expect(result.isActive).toBe(false);
    expect(userRepo.updateActiveStatus).toHaveBeenCalledWith(USER_X, false, expect.anything());
    expect(auditLogRepo.create).toHaveBeenCalledOnce();

    const auditCall = vi.mocked(auditLogRepo.create).mock.calls[0][0];
    expect(auditCall.action).toBe('user.suspend');
    expect(auditCall.targetType).toBe('user');
    expect(auditCall.targetId).toBe(USER_X);
    expect(auditCall.adminId).toBe(ADMIN_A);
    expect(auditCall.metadata).toMatchObject({ reason: 'spam', previousRole: 'student' });
  });
});

describe('activateUser', () => {
  it('user topilmasa → UserNotFoundError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(activateUser(ADMIN_A, USER_X)).rejects.toThrow(UserNotFoundError);
  });

  it('allaqachon active → idempotent', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ isActive: true }));
    const result = await activateUser(ADMIN_A, USER_X);
    expect(result.isActive).toBe(true);
    expect(auditLogRepo.create).not.toHaveBeenCalled();
  });

  it('inactive userni faollashtirish: audit + update', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ isActive: false }));
    vi.mocked(userRepo.updateActiveStatus).mockResolvedValue(makeUser({ isActive: true }));

    const result = await activateUser(ADMIN_A, USER_X);
    expect(result.isActive).toBe(true);
    expect(userRepo.updateActiveStatus).toHaveBeenCalledWith(USER_X, true, expect.anything());

    const auditCall = vi.mocked(auditLogRepo.create).mock.calls[0][0];
    expect(auditCall.action).toBe('user.activate');
  });
});

describe('changeUserRole', () => {
  it('o\'z rolini o\'zgartirishga urinish → SelfActionError', async () => {
    await expect(changeUserRole(ADMIN_A, ADMIN_A, 'teacher')).rejects.toThrow(SelfActionError);
  });

  it('noto\'g\'ri rol → ValidationError', async () => {
    await expect(changeUserRole(ADMIN_A, USER_X, 'godmode' as any)).rejects.toThrow(
      ValidationError,
    );
  });

  it('user topilmasa → UserNotFoundError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    await expect(changeUserRole(ADMIN_A, USER_X, 'teacher')).rejects.toThrow(UserNotFoundError);
  });

  it('shu rolda → idempotent (audit yozilmaydi)', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ role: 'teacher' }));
    await changeUserRole(ADMIN_A, USER_X, 'teacher');
    expect(userRepo.updateRole).not.toHaveBeenCalled();
    expect(auditLogRepo.create).not.toHaveBeenCalled();
  });

  it('oxirgi adminni demote qilish → LastAdminError', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(userRepo.countActiveAdmins).mockResolvedValue(1);
    await expect(changeUserRole(ADMIN_A, USER_X, 'teacher')).rejects.toThrow(LastAdminError);
  });

  it('muvaffaqiyatli role change: audit + update', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ role: 'student' }));
    vi.mocked(userRepo.updateRole).mockResolvedValue(makeUser({ role: 'teacher' }));

    const result = await changeUserRole(ADMIN_A, USER_X, 'teacher');
    expect(result.role).toBe('teacher');
    expect(userRepo.updateRole).toHaveBeenCalledWith(USER_X, 'teacher', expect.anything());

    const auditCall = vi.mocked(auditLogRepo.create).mock.calls[0][0];
    expect(auditCall.action).toBe('user.role_change');
    expect(auditCall.metadata).toMatchObject({ fromRole: 'student', toRole: 'teacher' });
  });

  it('admin → admin (boshqa hisobni) → ruxsat berilgan', async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(makeUser({ role: 'admin' }));
    vi.mocked(userRepo.countActiveAdmins).mockResolvedValue(2); // 2 ta admin bor
    vi.mocked(userRepo.updateRole).mockResolvedValue(makeUser({ role: 'admin' }));

    const result = await changeUserRole(ADMIN_A, USER_X, 'admin');
    // same role → idempotent
    expect(result.role).toBe('admin');
  });
});
