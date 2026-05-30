import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth-edge';

// Hammaga ochiq route'lar
const PUBLIC_ROUTES = [
  '/landing-page',
  '/login',
  '/register',
  '/forgot-password',
  '/about-page',
  '/course-marketplace',
  '/certificate',
  '/verify',
  '/teachers',
  '/help',
  '/r',
  '/',
];

// Faqat teacher roli uchun
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

// Teacher yoki admin uchun
const TEACHER_OR_ADMIN_ROUTES = [
  '/teacher-dashboard',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
}

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statik fayllar va API
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Ommaviy route'lar
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // JWT cookie dan session olish
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // Session yo'q — login sahifasiga
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const userRole = session.role;

  // Admin-only
  if (matchesRoutes(pathname, ADMIN_ONLY_ROUTES)) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Teacher-only
  if (matchesRoutes(pathname, TEACHER_ONLY_ROUTES)) {
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Teacher or admin
  if (matchesRoutes(pathname, TEACHER_OR_ADMIN_ROUTES)) {
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)',],
};
