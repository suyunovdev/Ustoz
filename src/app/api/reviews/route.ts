import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

// GET /api/reviews?courseId=xxx — kurs sharhlari ro'yxati
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'courseId kiritilmagan' }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(courseId)) {
    return NextResponse.json({ error: 'courseId formati noto\'g\'ri' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('course_reviews')
    .select(`
      id,
      rating,
      comment,
      helpful_count,
      created_at,
      student:user_profiles!student_id (full_name, avatar_url)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Sharhlarni olishda xatolik' }, { status: 500 });
  }

  return NextResponse.json({ reviews: data || [] });
}

// POST /api/reviews — yangi sharh yozish
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 });
  }

  // Rate limiting: 5 sharh / soat
  const rateLimitKey = `review:${user.id}`;
  const { allowed } = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Juda ko\'p sharh. 1 soatdan keyin urinib ko\'ring.' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { courseId, rating, comment } = body;

  // Validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!courseId || !uuidRegex.test(courseId)) {
    return NextResponse.json({ error: 'courseId noto\'g\'ri' }, { status: 400 });
  }

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Reyting 1 dan 5 gacha bo\'lishi kerak' }, { status: 400 });
  }

  if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
    return NextResponse.json({ error: 'Izoh 1000 belgidan oshmasligi kerak' }, { status: 400 });
  }

  // Faqat kursga yozilgan o'quvchi sharh yoza oladi
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    return NextResponse.json(
      { error: 'Faqat kursni sotib olgan o\'quvchilar sharh yoza oladi' },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('course_reviews')
    .upsert(
      {
        course_id: courseId,
        student_id: user.id,
        rating: Math.round(rating),
        comment: comment?.trim() || null,
        is_verified_purchase: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'course_id,student_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Review create error:', error);
    return NextResponse.json({ error: 'Sharh yozishda xatolik' }, { status: 500 });
  }

  return NextResponse.json({ review: data }, { status: 201 });
}
