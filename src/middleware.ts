import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth-edge';

// ═══ ROUTE ACCESS MAP ═══
// Har bir sahifa qaysi rol(lar) uchun ochiq ekani aniq belgilangan.
// Ro'yxatda YO'Q sahifa → login talab qilinadi (default-deny).

// Hammaga ochiq (login shart emas)
const PUBLIC_ROUTES = [
  '/landing-page',
  '/login',
  '/register',
  '/forgot-password',
  '/about-page',
  '/course-marketplace',
  '/course-details',
  '/certificate',
  '/verify',
  '/teachers',
  '/help',
  '/unauthorized',
  '/not-found',
  '/r',
  '/',
];

// Faqat student roli uchun
const STUDENT_ONLY_ROUTES = [
  '/student-dashboard',
  '/assignment-submission-portal',
];

// Faqat teacher (+ admin) roli uchun
const TEACHER_ONLY_ROUTES = [
  '/course-creation',
  '/sequential-test-builder',
  '/group-creation',
  '/content-upload-center',
  '/assignment-management',
];

// Faqat admin roli uchun
const ADMIN_ONLY_ROUTES = [
  '/admin-dashboard',
  '/content-moderation-dashboard',
];

// Teacher yoki admin
const TEACHER_OR_ADMIN_ROUTES = [
  '/teacher-dashboard',
];

// Login qilingan har qanday rol (student, teacher, admin)
const AUTHENTICATED_ROUTES = [
  '/certificates',
  '/profile',
  '/messages',
  '/notifications',
  '/referrals',
  '/transaction-history',
  '/payment-method-selection',
  '/payment-processing',
  '/payment-success-confirmation',
  '/learning-interface',
  '/quiz-interface',
  '/tests',
  '/assignments',
  '/support',
];

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik fayllar va API — o'tkazib yuborish
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // ─── PUBLIC ───
  if (matchesRoutes(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // ─── SESSION TEKSHIRUVI ───
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const role = session.role;

  // ─── ADMIN ONLY ───
  if (matchesRoutes(pathname, ADMIN_ONLY_ROUTES)) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // ─── TEACHER ONLY (admin ham kira oladi) ───
  if (matchesRoutes(pathname, TEACHER_ONLY_ROUTES)) {
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // ─── TEACHER OR ADMIN ───
  if (matchesRoutes(pathname, TEACHER_OR_ADMIN_ROUTES)) {
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // ─── STUDENT ONLY ───
  if (matchesRoutes(pathname, STUDENT_ONLY_ROUTES)) {
    if (role !== 'student') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // ─── AUTHENTICATED (any role) ───
  if (matchesRoutes(pathname, AUTHENTICATED_ROUTES)) {
    return NextResponse.next();
  }

  // ─── DEFAULT DENY ───
  // Ro'yxatlarda yo'q sahifa → login'ga yo'naltirish
  // Bu yangi sahifa qo'shilganda unutilishini oldini oladi
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
