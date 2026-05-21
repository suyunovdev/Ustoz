import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/certificates/my — o'quvchining barcha sertifikatlari
export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      id,
      certificate_number,
      issued_at,
      verification_url,
      metadata,
      course:courses!course_id (
        title,
        thumbnail_url,
        teacher:user_profiles!teacher_id (full_name)
      )
    `)
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Certificates fetch error:', error);
    return NextResponse.json({ error: 'Sertifikatlarni olishda xatolik' }, { status: 500 });
  }

  return NextResponse.json({ certificates: data || [] });
}
