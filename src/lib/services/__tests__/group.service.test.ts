import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/repositories', () => ({
  groupRepo: {
    createGroup: vi.fn(),
    findGroupById: vi.fn(),
    isGroupOwner: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    listMembers: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    addMembersBulk: vi.fn(),
    getMemberIds: vi.fn(),
    listGroups: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    course: { findUnique: vi.fn() },
    enrollment: { findFirst: vi.fn(), findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));

import {
  createGroup,
  addGroupMember,
  removeGroupMember,
  broadcastToGroup,
  GroupNotFoundError,
  GroupAccessDeniedError,
  GroupFullError,
  AlreadyMemberError,
  StudentNotEnrolledError,
} from '../group.service';
import { groupRepo } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

const TEACHER = 'teacher-1';
const STUDENT = 'student-1';
const GROUP = 'group-1';
const COURSE = 'course-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createGroup', () => {
  it('nom juda qisqa bo\'lsa xato', async () => {
    await expect(
      createGroup(TEACHER, { name: 'a' }),
    ).rejects.toThrow(ValidationError);
  });

  it('maxMembers chegaradan tashqari — xato', async () => {
    await expect(
      createGroup(TEACHER, { name: 'Guruh', maxMembers: 0 }),
    ).rejects.toThrow(ValidationError);
  });

  it('noto\'g\'ri rang — xato', async () => {
    await expect(
      createGroup(TEACHER, { name: 'Guruh', color: 'rainbow' as any }),
    ).rejects.toThrow(ValidationError);
  });

  it('courseId berilsa ownership tekshiriladi', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue({ teacherId: 'other' } as any);

    await expect(
      createGroup(TEACHER, { name: 'Guruh', courseId: COURSE }),
    ).rejects.toThrow(ValidationError);
  });

  it('muvaffaqiyatli yaratish', async () => {
    const created = { id: GROUP, name: 'Guruh', teacherId: TEACHER };
    vi.mocked(groupRepo.createGroup).mockResolvedValue(created as any);

    const result = await createGroup(TEACHER, { name: 'Guruh' });
    expect(result).toMatchObject({ id: GROUP });
    expect(groupRepo.createGroup).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: TEACHER, name: 'Guruh' }),
    );
  });
});

describe('addGroupMember', () => {
  it('guruh egasi bo\'lmasa xato', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: false });

    await expect(addGroupMember(GROUP, TEACHER, STUDENT)).rejects.toThrow(
      GroupAccessDeniedError,
    );
  });

  it('talaba enrolled bo\'lmasa xato', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValue(null);

    await expect(addGroupMember(GROUP, TEACHER, STUDENT)).rejects.toThrow(
      StudentNotEnrolledError,
    );
  });

  it('guruh to\'lgan — GroupFullError', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValue({ id: 'e-1' } as any);
    vi.mocked(groupRepo.addMember).mockRejectedValue(new Error('GROUP_FULL'));

    await expect(addGroupMember(GROUP, TEACHER, STUDENT)).rejects.toThrow(GroupFullError);
  });

  it('allaqachon a\'zo — AlreadyMemberError', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValue({ id: 'e-1' } as any);
    vi.mocked(groupRepo.addMember).mockRejectedValue(new Error('ALREADY_MEMBER'));

    await expect(addGroupMember(GROUP, TEACHER, STUDENT)).rejects.toThrow(AlreadyMemberError);
  });

  it('muvaffaqiyatli qo\'shish', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(prisma.enrollment.findFirst).mockResolvedValue({ id: 'e-1' } as any);
    vi.mocked(groupRepo.addMember).mockResolvedValue({
      groupId: GROUP,
      studentId: STUDENT,
    } as any);

    const result = await addGroupMember(GROUP, TEACHER, STUDENT);
    expect(result).toMatchObject({ studentId: STUDENT });
  });
});

describe('removeGroupMember', () => {
  it('egasi bo\'lmasa xato', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: false });

    await expect(removeGroupMember(GROUP, TEACHER, STUDENT)).rejects.toThrow(
      GroupAccessDeniedError,
    );
  });

  it('muvaffaqiyatli o\'chirish', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(groupRepo.removeMember).mockResolvedValue(undefined);

    await removeGroupMember(GROUP, TEACHER, STUDENT);
    expect(groupRepo.removeMember).toHaveBeenCalledWith(GROUP, STUDENT);
  });
});

describe('broadcastToGroup', () => {
  it('egasi bo\'lmasa xato', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: false });

    await expect(
      broadcastToGroup(GROUP, TEACHER, { title: 'Test', message: 'Hello' }),
    ).rejects.toThrow(GroupAccessDeniedError);
  });

  it('xabar juda qisqa — ValidationError', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });

    await expect(
      broadcastToGroup(GROUP, TEACHER, { title: 'T', message: 'Hello' }),
    ).rejects.toThrow(ValidationError);
  });

  it('a\'zolar bo\'lmasa sent=0', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(groupRepo.getMemberIds).mockResolvedValue([]);

    const result = await broadcastToGroup(GROUP, TEACHER, {
      title: 'Yangilik',
      message: 'Dars vaqti o\'zgardi',
    });
    expect(result).toEqual({ sent: 0 });
  });

  it('a\'zolarga bildirishnoma yuboradi', async () => {
    vi.mocked(groupRepo.isGroupOwner).mockResolvedValue({ ok: true });
    vi.mocked(groupRepo.getMemberIds).mockResolvedValue(['s-1', 's-2', 's-3']);
    vi.mocked(groupRepo.findGroupById).mockResolvedValue({
      id: GROUP,
      courseId: COURSE,
    } as any);
    vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 3 });

    const result = await broadcastToGroup(GROUP, TEACHER, {
      title: 'Yangilik',
      message: 'Dars vaqti o\'zgardi',
    });
    expect(result).toEqual({ sent: 3 });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ recipientId: 's-1', senderId: TEACHER }),
        expect.objectContaining({ recipientId: 's-2' }),
        expect.objectContaining({ recipientId: 's-3' }),
      ]),
    });
  });
});
