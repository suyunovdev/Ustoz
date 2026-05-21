import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/certificates/[id] — sertifikat ma'lumotlari
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'ID kiritilmagan' }, { status: 400 });
  }

  const supabase = await createClient();

  // UUID bo'yicha yoki certificate_number bo'yicha qidirish
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const query = supabase.from('certificates').select(`
    id,
    certificate_number,
    issued_at,
    verification_url,
    metadata,
    student:user_profiles!student_id (full_name, avatar_url),
    course:courses!course_id (title, thumbnail_url, teacher:user_profiles!teacher_id (full_name))
  `);

  const { data, error } = uuidRegex.test(id)
    ? await query.eq('id', id).single()
    : await query.eq('certificate_number', id.toUpperCase()).single();

  if (error || !data) {
    return NextResponse.json({ error: 'Sertifikat topilmadi' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ustoz.uz';
  const certificate = {
    ...data,
    verification_url: `${appUrl}/verify/${data.certificate_number}`,
  };

  return NextResponse.json({ certificate });
}
