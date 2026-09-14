/**
 * GET /api/student/sessions — o'quvchining yaqin jonli darslari (a'zo guruhlari bo'yicha)
 */

import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listMyUpcomingSessions } from '@/lib/services/group-session.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const rows = await listMyUpcomingSessions(session.sub);
    // meetingUrl ATAYLAB berilmaydi — havola faqat "qo'shilish" endpoint'i orqali
    // (o'shanda davomat yoziladi). Bu yerda faqat ko'rsatish uchun ma'lumot.
    const sessions = rows.map((s) => ({
      id: s.id,
      title: s.title,
      startsAt: s.startsAt,
      durationMin: s.durationMin,
      status: s.status,
      group: s.group,
    }));
    return jsonResponse({ sessions });
  } catch (err) {
    return errorResponse(err);
  }
}
