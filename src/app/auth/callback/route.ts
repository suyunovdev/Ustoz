import { NextRequest, NextResponse } from 'next/server';

// Google OAuth o'chirilgan — JWT + Postgres ga ko'chirildi
// Bu route faqat /login ga yo'naltirish uchun saqlab qolingan
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/login?oauth=disabled', req.url));
}
