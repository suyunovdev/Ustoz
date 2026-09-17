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
  '/about',
  '/courses',
  '/certificate',
  '/verify',
  '/teachers',
  '/help',
  '/terms',
  '/privacy',
  '/unauthorized',
  '/r',
  '/auth/callback',
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
  '/become-teacher',
  '/student-certificates',
  '/profile',
  '/messages',
  '/notifications',
  '/referrals',
  '/transaction-history',
  '/live-sessions',
  '/practice-exam',
  '/payment-method-selection',
  '/payment-processing',
  '/payment-success-confirmation',
  '/learning-interface',
  '/tests',
  '/assignments',
  '/support',
];

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

// nginx orqasida request.url ichki manzilni (localhost:4028) beradi — Next.js
// standalone Host header'ni request.url uchun ishlatmaydi. Shu sabab redirect'ni
// forwarded header'lardan (nginx qo'yadi: Host, X-Forwarded-Proto) quramiz.
function publicRedirect(request: NextRequest, path: string): URL {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '') ||
    'https';
  return new URL(path, `${proto}://${host}`);
}

// ─── CSP direktivalari (script-src'dan tashqari — barchasi statik) ───
// script-src middleware'da nonce bilan quriladi (pastda). style-src'da
// 'unsafe-inline' ataylab qoldirilgan: Next/Tailwind runtime inline style
// ishlatadi va ular uchun nonce mexanizmi yo'q.
const CSP_STATIC_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.resend.com https://my.click.uz https://checkout.paycom.uz https://*.r2.cloudflarestorage.com https://video.bunnycdn.com https://*.b-cdn.net https://*.mediadelivery.net",
  "media-src 'self' blob: https://*.b-cdn.net https://*.mediadelivery.net https://*.r2.cloudflarestorage.com https://*.r2.dev",
  "frame-src 'self' https://iframe.mediadelivery.net https://www.youtube.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://my.click.uz https://checkout.paycom.uz",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── CSRF (defense-in-depth): mutating /api so'rovlarida cross-origin'ni rad etamiz.
  // Session cookie SameSite=Lax allaqachon brauzer cross-site cookie POST'ini bloklaydi;
  // bu qo'shimcha qatlam. Faqat Origin MAVJUD va MOS KELMAGANDA rad etamiz — Origin yo'q
  // (same-origin navigatsiya / native client / server cron) ruxsat. To'lov provayder
  // callback'lari (payme/click) cross-origin bo'ladi va imzo bilan tekshiriladi -> exempt.
  if (
    pathname.startsWith('/api/') &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH' ||
      request.method === 'DELETE')
  ) {
    const origin = request.headers.get('origin');
    const isProviderCallback =
      pathname.startsWith('/api/payment/payme') || pathname.startsWith('/api/payment/click');
    if (origin && !isProviderCallback) {
      const allowedHost =
        request.headers.get('x-forwarded-host') ||
        request.headers.get('host') ||
        request.nextUrl.host;
      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch {
        /* noto'g'ri Origin — pastda rad etiladi */
      }
      if (allowedHost && originHost !== allowedHost) {
        return NextResponse.json(
          { error: "Cross-origin so'rov rad etildi", code: 'CSRF_BLOCKED' },
          { status: 403 },
        );
      }
    }
  }

  // Statik fayllar va API — o'tkazib yuborish (HTML emas, CSP/nonce kerak emas)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/api/') ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // ─── CSP + NONCE (Next 15 nonce-based, script-src'da 'unsafe-inline' YO'Q) ───
  // Har bir request uchun yangi nonce. Next o'z framework skriptlariga uni
  // avtomatik qo'yadi (request header'dagi CSP'ni o'qib), 'strict-dynamic' esa
  // shu skriptlar yuklagan qolgan zanjirni ishonchli qiladi. layout.tsx'dagi
  // inline skriptlar (theme + JSON-LD) headers()'dan x-nonce'ni oladi.
  // Dev'da CSP o'rnatilmaydi — Next dev eval/inline skript ishlatadi.
  const isDev = process.env.NODE_ENV === 'development';
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(request.headers);
  let csp: string | null = null;
  if (!isDev) {
    csp = [
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      ...CSP_STATIC_DIRECTIVES,
    ].join('; ');
    requestHeaders.set('x-nonce', nonce);
    // Next shu request header'dan nonce'ni o'qib, o'z skriptlariga qo'yadi.
    requestHeaders.set('Content-Security-Policy', csp);
  }

  // Har qanday javobga CSP response header'ini qo'shadi.
  const withCsp = (response: NextResponse): NextResponse => {
    if (csp) response.headers.set('Content-Security-Policy', csp);
    return response;
  };
  // Nonce'li request header'lar bilan "davom et" javobi.
  const nextWithCsp = (): NextResponse =>
    withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  // ─── PUBLIC ───
  if (matchesRoutes(pathname, PUBLIC_ROUTES)) {
    return nextWithCsp();
  }

  // ─── HIMOYALANGAN ROUTE'MI? ───
  // Barcha real sahifalar public yoki quyidagi himoyalangan ro'yxatlarda.
  // Agar yo'l hech qaysisiga mos kelmasa — bu MAVJUD BO'LMAGAN sahifa:
  // Next'ga o'tkazamiz → not-found (404) ko'rsatiladi, /login'ga EMAS.
  // Eslatma: yangi himoyalangan sahifa qo'shsangiz, uni tegishli ro'yxatga qo'shing.
  const isProtected =
    matchesRoutes(pathname, ADMIN_ONLY_ROUTES) ||
    matchesRoutes(pathname, TEACHER_ONLY_ROUTES) ||
    matchesRoutes(pathname, TEACHER_OR_ADMIN_ROUTES) ||
    matchesRoutes(pathname, STUDENT_ONLY_ROUTES) ||
    matchesRoutes(pathname, AUTHENTICATED_ROUTES);

  if (!isProtected) {
    return nextWithCsp();
  }

  // ─── SESSION TEKSHIRUVI (faqat himoyalangan route'lar uchun) ───
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    // Toza /login — bormoqchi bo'lgan sahifa redirect param sifatida saqlanmaydi
    return withCsp(NextResponse.redirect(publicRedirect(request, '/login')));
  }

  const role = session.role;

  // ─── ADMIN ONLY ───
  if (matchesRoutes(pathname, ADMIN_ONLY_ROUTES)) {
    if (role !== 'admin') {
      return withCsp(NextResponse.redirect(publicRedirect(request, '/unauthorized')));
    }
    return nextWithCsp();
  }

  // ─── TEACHER ONLY (admin ham kira oladi) ───
  if (matchesRoutes(pathname, TEACHER_ONLY_ROUTES)) {
    if (role !== 'teacher' && role !== 'admin') {
      return withCsp(NextResponse.redirect(publicRedirect(request, '/unauthorized')));
    }
    return nextWithCsp();
  }

  // ─── TEACHER OR ADMIN ───
  if (matchesRoutes(pathname, TEACHER_OR_ADMIN_ROUTES)) {
    if (role !== 'teacher' && role !== 'admin') {
      return withCsp(NextResponse.redirect(publicRedirect(request, '/unauthorized')));
    }
    return nextWithCsp();
  }

  // ─── STUDENT ONLY ───
  if (matchesRoutes(pathname, STUDENT_ONLY_ROUTES)) {
    if (role !== 'student') {
      return withCsp(NextResponse.redirect(publicRedirect(request, '/unauthorized')));
    }
    return nextWithCsp();
  }

  // ─── AUTHENTICATED (any role) ───
  if (matchesRoutes(pathname, AUTHENTICATED_ROUTES)) {
    return nextWithCsp();
  }

  // Himoyalangan va authenticated — ruxsat (isProtected true bo'lgani uchun
  // yuqoridagi bloklardan biri odatda javob beradi; bu xavfsiz default)
  return nextWithCsp();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
