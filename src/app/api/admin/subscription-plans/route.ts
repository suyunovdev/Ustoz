/** GET (barcha planlar) + POST (yangi plan) — admin. */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { serializePlan } from '@/lib/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } });
    return jsonResponse({ plans: plans.map(serializePlan) });
  } catch (err) { return errorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const b = await req.json().catch(() => ({}));
    if (!b.name || typeof b.name !== 'string') throw new ValidationError('name majburiy');
    const priceUzs = BigInt(Math.max(0, Math.floor(Number(b.priceUzs) || 0)));
    const durationDays = Math.max(1, Math.floor(Number(b.durationDays) || 30));
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: b.name.trim(),
        description: typeof b.description === 'string' ? b.description : null,
        priceUzs,
        durationDays,
        tier: Math.floor(Number(b.tier) || 0),
        features: Array.isArray(b.features) ? b.features.filter((f: unknown) => typeof f === 'string') : [],
        allCoursesAccess: b.allCoursesAccess !== false,
        isActive: b.isActive !== false,
        sortOrder: Math.floor(Number(b.sortOrder) || 0),
      },
    });
    return jsonResponse({ plan: serializePlan(plan) }, { status: 201 });
  } catch (err) { return errorResponse(err); }
}
