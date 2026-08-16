/** PATCH (plan tahrirlash/toggle) — admin. */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { serializePlan } from '@/lib/services/subscription.service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (b.name !== undefined) data.name = String(b.name).trim();
    if (b.description !== undefined) data.description = b.description;
    if (b.priceUzs !== undefined) data.priceUzs = BigInt(Math.max(0, Math.floor(Number(b.priceUzs) || 0)));
    if (b.durationDays !== undefined) data.durationDays = Math.max(1, Math.floor(Number(b.durationDays)));
    if (b.tier !== undefined) data.tier = Math.floor(Number(b.tier) || 0);
    if (Array.isArray(b.features)) data.features = b.features.filter((f: unknown) => typeof f === 'string');
    if (b.allCoursesAccess !== undefined) data.allCoursesAccess = !!b.allCoursesAccess;
    if (b.isActive !== undefined) data.isActive = !!b.isActive;
    if (b.sortOrder !== undefined) data.sortOrder = Math.floor(Number(b.sortOrder) || 0);
    if (Object.keys(data).length === 0) throw new ValidationError("O'zgartirish yo'q");
    const plan = await prisma.subscriptionPlan.update({ where: { id }, data });
    return jsonResponse({ plan: serializePlan(plan) });
  } catch (err) { return errorResponse(err); }
}
