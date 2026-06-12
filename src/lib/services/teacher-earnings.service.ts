/**
 * Teacher Earnings & Withdrawals Service
 * --------------------------------------
 * Daromad balansini hisoblash, to'lovlar tarixi, withdraw flow.
 *
 * Withdrawal qoidalari:
 *   - Min summa: 100,000 UZS
 *   - Max summa: availableBalance
 *   - Bir vaqtda bitta 'pending' so'rov ruxsat (yangi ochish uchun avval kutish)
 *   - Bank/card ma'lumotlari to'liq bo'lishi shart
 */

import { prisma } from '@/lib/prisma';
import {
  earningsRepo,
  type WithdrawalRow,
  type PaymentStatusFilter,
  type WithdrawalStatus,
  type WithdrawalMethod,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';

export const MIN_WITHDRAWAL_UZS = BigInt(100_000);

export class InsufficientBalanceError extends Error {
  code = 'INSUFFICIENT_BALANCE';
  constructor() {
    super("Yetarli mablag' mavjud emas");
    this.name = 'InsufficientBalanceError';
  }
}

export class PendingWithdrawalExistsError extends Error {
  code = 'PENDING_WITHDRAWAL_EXISTS';
  constructor() {
    super(
      "Sizda allaqachon kutilayotgan so'rov bor — uni yakunlanishini kuting yoki bekor qiling",
    );
    this.name = 'PendingWithdrawalExistsError';
  }
}

export class WithdrawalNotFoundError extends Error {
  code = 'WITHDRAWAL_NOT_FOUND';
  constructor() {
    super("So'rov topilmadi");
    this.name = 'WithdrawalNotFoundError';
  }
}

export class WithdrawalAccessDeniedError extends Error {
  code = 'WITHDRAWAL_ACCESS_DENIED';
  constructor() {
    super("Bu so'rov sizniki emas");
    this.name = 'WithdrawalAccessDeniedError';
  }
}

export class CannotCancelError extends Error {
  code = 'CANNOT_CANCEL';
  constructor() {
    super("Faqat 'pending' holatdagi so'rovni bekor qilish mumkin");
    this.name = 'CannotCancelError';
  }
}

const VALID_METHODS: ReadonlyArray<WithdrawalMethod> = ['bank_transfer', 'card'];

// ==================== BALANCE & PAYMENTS ====================

function serializeBalance(b: Awaited<ReturnType<typeof earningsRepo.getBalance>>) {
  return {
    grossRevenueUzs: b.grossRevenueUzs.toString(),
    refundedUzs: b.refundedUzs.toString(),
    platformFeePct: b.platformFeePct,
    platformFeeUzs: b.platformFeeUzs.toString(),
    netRevenueUzs: b.netRevenueUzs.toString(),
    withdrawnUzs: b.withdrawnUzs.toString(),
    pendingWithdrawalUzs: b.pendingWithdrawalUzs.toString(),
    availableUzs: b.availableUzs.toString(),
    completedPaymentCount: b.completedPaymentCount,
    refundedPaymentCount: b.refundedPaymentCount,
  };
}

export async function getBalance(teacherId: string) {
  const b = await earningsRepo.getBalance(teacherId);
  return serializeBalance(b);
}

export async function listPayments(
  teacherId: string,
  filters: {
    status?: PaymentStatusFilter;
    courseId?: string;
    limit?: number;
    cursor?: string;
  } = {},
) {
  const result = await earningsRepo.listPayments(teacherId, filters);
  return {
    payments: result.rows.map((p) => ({
      ...p,
      amountUzs: p.amountUzs.toString(),
    })),
    nextCursor: result.nextCursor,
  };
}

// ==================== WITHDRAWAL ====================

export interface RequestWithdrawalInput {
  amountUzs: bigint | number | string;
  method: WithdrawalMethod;
  bankName?: string;
  bankAccountNumber?: string;
  cardNumber?: string;
  recipientName?: string;
  note?: string;
}

export async function requestWithdrawal(
  teacherId: string,
  input: RequestWithdrawalInput,
) {
  if (!VALID_METHODS.includes(input.method)) {
    throw new ValidationError(`Noto'g'ri usul: ${input.method}`);
  }

  let amount: bigint;
  try {
    amount = BigInt(input.amountUzs);
  } catch {
    throw new ValidationError("Summa yaroqsiz");
  }
  if (amount < MIN_WITHDRAWAL_UZS) {
    throw new ValidationError(
      `Minimum summa: ${MIN_WITHDRAWAL_UZS.toLocaleString('uz-UZ')} UZS`,
    );
  }

  // Bank/card validation
  if (input.method === 'bank_transfer') {
    if (!input.bankName?.trim() || !input.bankAccountNumber?.trim()) {
      throw new ValidationError("Bank nomi va hisob raqami majburiy");
    }
    if (input.bankAccountNumber.replace(/\s/g, '').length < 16) {
      throw new ValidationError("Hisob raqami noto'g'ri");
    }
  } else if (input.method === 'card') {
    if (!input.cardNumber?.trim()) {
      throw new ValidationError("Karta raqami majburiy");
    }
    const cardDigits = input.cardNumber.replace(/\D/g, '');
    if (cardDigits.length !== 16) {
      throw new ValidationError("Karta raqami 16 raqamdan iborat bo'lishi kerak");
    }
  }
  const recipientName = input.recipientName?.trim();
  if (!recipientName) {
    throw new ValidationError("Qabul qiluvchi ism-familiyasi majburiy");
  }

  // Card number mask (faqat oxirgi 4 raqam saqlanadi)
  const cardMasked = input.cardNumber
    ? '****' + input.cardNumber.replace(/\D/g, '').slice(-4)
    : null;

  // Race condition'dan himoyalanish:
  // Teacher profile qatorini FOR UPDATE bilan qulflab,
  // pending tekshiruvi + create bitta transaction ichida bajariladi.
  // Bu bir vaqtning o'zida ikkita pending withdrawal yaratilishini imkonsiz qiladi.
  const withdrawal = await prisma.$transaction(async (tx) => {
    // 1. Teacher profile row'ni qulflash
    await tx.$queryRaw`
      SELECT id FROM user_profiles
      WHERE id = ${teacherId}::uuid
      FOR UPDATE
    `;

    // 2. Balance qulflangan tx ichida hisoblanadi (refundlar bilan birga)
    const balance = await earningsRepo.getBalance(teacherId);
    if (amount > balance.availableUzs) {
      throw new InsufficientBalanceError();
    }

    // 3. Pending withdrawal mavjudligi (qulf ostida)
    const pending = await tx.teacherWithdrawal.findFirst({
      where: { teacherId, status: 'pending' },
      select: { id: true },
    });
    if (pending) throw new PendingWithdrawalExistsError();

    // 4. Yangi withdrawal
    return tx.teacherWithdrawal.create({
      data: {
        teacherId,
        amountUzs: amount,
        method: input.method,
        bankName: input.bankName?.trim() ?? null,
        bankAccountNumber: input.bankAccountNumber?.trim() ?? null,
        cardNumber: cardMasked,
        recipientName,
        note: input.note?.trim() ?? null,
        status: 'pending',
      },
    });
  });

  return serializeWithdrawal(withdrawal);
}

export async function listMyWithdrawals(
  teacherId: string,
  filters: { status?: WithdrawalStatus; limit?: number } = {},
) {
  const rows = await earningsRepo.listTeacherWithdrawals(teacherId, filters);
  return rows.map(serializeWithdrawal);
}

export async function cancelMyWithdrawal(id: string, teacherId: string) {
  const w = await earningsRepo.findWithdrawalById(id);
  if (!w) throw new WithdrawalNotFoundError();
  if (w.teacherId !== teacherId) throw new WithdrawalAccessDeniedError();
  if (w.status !== 'pending') throw new CannotCancelError();
  const cancelled = await earningsRepo.cancelWithdrawal(id);
  return serializeWithdrawal(cancelled);
}

function serializeWithdrawal(w: WithdrawalRow) {
  return {
    ...w,
    amountUzs: w.amountUzs.toString(),
  };
}

// ==================== PAYOUT SETTINGS ====================

export async function getPayoutSettings(teacherId: string) {
  return earningsRepo.getPayoutSettings(teacherId);
}

export interface UpdatePayoutSettingsInput {
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutRecipientName?: string | null;
  payoutCardNumber?: string | null;
}

export async function updatePayoutSettings(
  teacherId: string,
  input: UpdatePayoutSettingsInput,
) {
  // Sanitize / mask card
  const patch: UpdatePayoutSettingsInput = {};
  if (input.payoutBankName !== undefined) {
    patch.payoutBankName = input.payoutBankName?.trim() || null;
  }
  if (input.payoutAccountNumber !== undefined) {
    patch.payoutAccountNumber = input.payoutAccountNumber?.trim() || null;
  }
  if (input.payoutRecipientName !== undefined) {
    patch.payoutRecipientName = input.payoutRecipientName?.trim() || null;
  }
  if (input.payoutCardNumber !== undefined) {
    if (input.payoutCardNumber) {
      const digits = input.payoutCardNumber.replace(/\D/g, '');
      if (digits.length !== 16) throw new ValidationError("Karta 16 raqam");
      patch.payoutCardNumber = '****' + digits.slice(-4);
    } else {
      patch.payoutCardNumber = null;
    }
  }
  return earningsRepo.updatePayoutSettings(teacherId, patch);
}
