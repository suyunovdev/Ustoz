# Ustoz — O'zbek tilidagi onlayn ta'lim platformasi

Talabalar va o'qituvchilar uchun marketplace + student dashboard. Real progress tracking, streak, shaxsiy tavsiyalar va sertifikatlar.

## Tech Stack

| Qatlam | Texnologiya |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS 3.4 |
| Language | TypeScript (strict) |
| Database | PostgreSQL 15 + Prisma 7.8 (pg adapter) |
| Auth | JWT (jose) + httpOnly cookie + bcryptjs |
| State | TanStack Query v5 (cache + optimistic) |
| Email | Resend |
| Testing | Vitest + React Testing Library |

## Arxitektura

Uch qatlamli:

```
HTTP route  →  Service        →  Repository      →  Prisma
(app/api)      (lib/services)    (lib/repositories)
```

Tafsilot uchun [ARCHITECTURE.md](ARCHITECTURE.md).

## O'rnatish

1. Dependencies:
   ```bash
   npm install
   ```

2. `.env`'ni `.env.example`'dan nusxalang va sozlang:
   ```bash
   cp .env.example .env
   # DATABASE_URL, JWT_SECRET, RESEND_API_KEY'ni to'ldiring
   ```

3. Database tayyorlash:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. Dev server:
   ```bash
   npm run dev
   # → http://localhost:4028
   ```

## Scripts

| Buyruq | Tavsif |
| --- | --- |
| `npm run dev` | Dev server (port 4028) |
| `npm run build` | Production build |
| `npm run serve` | Production server |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Single test run |
| `npm run test:coverage` | Coverage report (HTML + text) |
| `npm run analyze` | Bundle analyzer (`ANALYZE=true next build`) |
| `npm run db:seed` | Prisma seed |

## Testlar

```bash
npm run test:run
# 4 fayl, 39 test, ~1.5s
```

**Coverage** (`npm run test:coverage`):

| Modul | Statements |
| --- | --- |
| `lib/services/progress.service.ts` | 88.6% |
| `lib/services/streak.service.ts` | 84.9% |
| `lib/services/recommendation.service.ts` | 100% |
| `app/student-dashboard/components/WelcomeSection.tsx` | 97.7% |

## Performance

- **Dashboard LCP**: ~600ms (SSR + HydrationBoundary)
- **Cache hit**: ~22ms (TanStack Query)
- **Server bundle**: 1 query per data source (N+1 muammosi yo'q — bitta helper barcha enrollment uchun)

## Loyiha tuzilishi

```
src/
├── app/                       # Next.js App Router
│   ├── api/                   # Route handlers
│   ├── student-dashboard/     # Dashboard (server + interactive)
│   ├── course-marketplace/
│   ├── course-details/
│   ├── learning-interface/
│   ├── robots.ts              # SEO
│   ├── sitemap.ts             # SEO
│   └── layout.tsx             # Root layout + metadata
│
├── components/                # Reusable UI
│   ├── common/                # RoleBasedHeader, Toaster, UserMenu
│   ├── providers/             # QueryProvider
│   └── ui/                    # AppIcon, AppImage
│
├── contexts/                  # AuthContext
│
├── hooks/                     # React hooks
│   ├── queries/               # TanStack Query hook'lar
│   └── mutations/             # TanStack Mutation hook'lar
│
├── lib/
│   ├── auth.ts                # JWT helpers
│   ├── prisma.ts              # Prisma client (pg adapter)
│   ├── errors/                # ServiceError, EnrollmentNotFoundError…
│   ├── repositories/          # DB access (1 fayl = 1 jadval)
│   └── services/              # Biznes logika
│       ├── progress.service.ts
│       ├── streak.service.ts
│       ├── recommendation.service.ts
│       ├── dashboard.service.ts          # orchestrator
│       └── dashboard-progress.helper.ts  # N+1 avoidance
│
├── styles/                    # Global CSS + Tailwind
├── test/                      # Vitest setup
└── types/                     # Shared types
```

## SEO

- [`src/app/robots.ts`](src/app/robots.ts) — public sahifalar ochiq, dashboard/admin yopiq
- [`src/app/sitemap.ts`](src/app/sitemap.ts) — statik route'lar + barcha published kurslar
- Per-page metadata (`title`, `description`, `openGraph`, `twitter`)
- `NEXT_PUBLIC_SITE_URL` env'dan o'qiladi

## Xavfsizlik

Security headers [next.config.mjs](next.config.mjs)'da:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/microphone/geolocation off)
- Production: `Strict-Transport-Security` + CSP

JWT:
- 7-kunlik httpOnly cookie (`ustoz_session`)
- bcrypt 12 rounds parol uchun
- TODO: refresh token (15-min access + 7-day refresh) — kelajak iteratsiya

## Pre-deploy checklist

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run test:run` → barcha PASS
- [ ] `npm run build` → muvaffaqiyatli
- [ ] `.env` to'liq (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_SITE_URL)
- [ ] Database migration deploy (`npx prisma migrate deploy`)

## Litsenziya

Proprietary — Ustoz Team.
