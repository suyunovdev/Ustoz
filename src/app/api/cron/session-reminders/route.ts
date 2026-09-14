/**
 * GET /api/cron/session-reminders
 *
 * Har ~5-10 daqiqada ishlaydigan cron (server crontab yoki UptimeRobot
 * `Authorization: Bearer <CRON_SECRET>`): boshlanishiga ~20 daqiqa qolgan jonli
 * darslar uchun guruh a'zolariga eslatma bildirishnomasi. Har sessiya bir marta
 * eslatiladi (reminderSentAt orqali idempotent).
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendDueSessionReminders } from '@/lib/services/group-session.service';

const REMINDER_WINDOW_MIN = 20;

export async function GET(req: NextRequest) {
  // Bildirishnoma yuboradi va ma'lumot yozadi — prod'da CRON_SECRET MAJBURIY.
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : process.env.NODE_ENV !== 'production';
  if (!authorized) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendDueSessionReminders(REMINDER_WINDOW_MIN);
    return NextResponse.json({ status: 'ok', ...result });
  } catch (err) {
    console.error('[cron/session-reminders]', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
