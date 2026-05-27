# Arxitektura

Ustoz student dashboard'ning ichki tuzilishi.

## Asosiy printsip — 3 qatlam

```
┌────────────────────────────────────────────────────────────┐
│  HTTP layer                                                │
│  app/api/**/route.ts  + Server Components (page.tsx)       │
│  — Request parsing, auth, validation, status code mapping  │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│  Service layer                                             │
│  lib/services/*.ts                                         │
│  — Biznes logika, transaction'lar, custom errors throw     │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│  Repository layer                                          │
│  lib/repositories/*.ts                                     │
│  — Prisma query'lar, bitta jadval = bitta fayl             │
└─────────────────────────┬──────────────────────────────────┘
                          │
                       Prisma → PostgreSQL
```

### Qoidalar

| Qatlam | KIRADI | KIRMAYDI |
| --- | --- | --- |
| Route | `req`, `params`, `getSessionFromRequest`, `jsonResponse` | Biznes logika, Prisma query |
| Service | Biznes logika, `prisma.$transaction`, custom error throw | HTTP statuslar, request parsing |
| Repository | `prisma.*` query'lar, optional `tx` parametri | Biznes qoidalar, error throw (faqat Prisma'niki) |

### Service nima uchun?

- Test qilish oson (repository va `prisma`'ni mock qilamiz, route handler'siz)
- Server Component va API route bir xil funksiyani chaqiradi (`loadDashboardData(studentId)`)
- Transaction boshqarish bir joyda

## Service ro'yxati

| Fayl | Vazifa |
| --- | --- |
| `progress.service.ts` | Topic complete, course progress %, next topic |
| `streak.service.ts` | Current/longest streak, activity calendar |
| `recommendation.service.ts` | 60% relevant + 30% diversity + 10% freshness; cold start; similar courses |
| `dashboard.service.ts` | **Orchestrator** — barcha service'larni parallel chaqiradi |
| `dashboard-progress.helper.ts` | N+1 yo'q — bir nechta enrollment uchun progress meta bir query'da |

## Repository ro'yxati

`src/lib/repositories/index.ts` — namespace barrel:

```typescript
import { enrollmentRepo, courseRepo, topicRepo } from '@/lib/repositories';
```

Har repo `Prisma.TransactionClient`'ni qo'shimcha argument qabul qiladi:

```typescript
export async function updateProgress(
  enrollmentId: string,
  data: { progress: number; ... },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.enrollment.update({ ... });
}
```

Service `prisma.$transaction(async tx => { ... })` ichida shu `tx`'ni uzatadi → bitta atomic operatsiya.

## TanStack Query strategiyasi

`src/components/providers/QueryProvider.tsx`:

```typescript
defaultOptions: {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
  },
  mutations: { retry: 0 },
}
```

### Query kalitlari — `src/hooks/queries/queryKeys.ts`

Central factory — typo'lar bo'lmaydi:

```typescript
export const queryKeys = {
  studentDashboard: ['student-dashboard'] as const,
  streak: ['student-streak'] as const,
  activityCalendar: (days: number) => ['student-activity', days] as const,
  categories: ['categories'] as const,
};
```

### Hooks

| Hook | staleTime | Eslatma |
| --- | --- | --- |
| `useStudentDashboard()` | 30s | Asosiy dashboard data |
| `useStreak()` | 5min | Streak alohida tab'da |
| `useActivityCalendar(days)` | 60s | Heatmap, `enabled` bayrog'i bilan |
| `useCategories()` | `Infinity` | Kategoriyalar deyarli o'zgarmaydi |

### Optimistic mutation namuna

`src/hooks/mutations/useCompleteTopicMutation.ts`:

```typescript
onMutate: async (vars) => {
  const previous = qc.getQueryData(queryKeys.studentDashboard);
  qc.setQueryData(queryKeys.studentDashboard, (old) => /* optimistic apply */);
  return { previous };
},
onError: (_err, _vars, ctx) => {
  if (ctx?.previous) qc.setQueryData(queryKeys.studentDashboard, ctx.previous);
},
onSettled: () => {
  qc.invalidateQueries({ queryKey: queryKeys.studentDashboard });
  qc.invalidateQueries({ queryKey: queryKeys.streak });
}
```

## SSR + Hydration

`app/student-dashboard/page.tsx`:

```typescript
export const dynamic = 'force-dynamic'; // auth → personalized
const queryClient = new QueryClient();
await queryClient.prefetchQuery({
  queryKey: queryKeys.studentDashboard,
  queryFn: () => loadDashboardData(session.sub),
});
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <StudentDashboardInteractive />
  </HydrationBoundary>
);
```

Server'da data prefetch → client'da `useStudentDashboard()` darhol cache'dan o'qiydi → loading flash yo'q.

`Date → ISO string` `lib/json.ts`'dagi `serializeData` orqali (hydration mismatch yo'q).

## Error handling

`src/lib/errors/index.ts`:

```typescript
ServiceError(message, code)
  ↳ EnrollmentNotFoundError  → ENROLLMENT_NOT_FOUND
  ↳ TopicNotFoundError       → TOPIC_NOT_FOUND
  ↳ CourseNotFoundError      → COURSE_NOT_FOUND
```

Route handler:

```typescript
try {
  const result = await markTopicComplete(...);
  return jsonResponse(result);
} catch (err) {
  if (err instanceof TopicNotFoundError)      return jsonResponse({ error }, { status: 404 });
  if (err instanceof EnrollmentNotFoundError) return jsonResponse({ error }, { status: 403 });
  throw err; // 500 → global handler
}
```

## Migration qoidalari

1. Schema o'zgarganda **avval** `npx prisma migrate dev --name <slug>` — local'da migration yaratiladi.
2. Production'ga deploy: `npx prisma migrate deploy`.
3. Drift bo'lsa (manual SQL ishlatilgan bo'lsa):
   ```bash
   npx prisma migrate diff --from-config-datasource --to-schema --script > tmp.sql
   psql $DATABASE_URL -f tmp.sql
   npx prisma migrate resolve --applied <migration-name>
   ```
4. **Hech qachon `migrate reset` qilmaslik production'da.**

## Testlash strategiyasi

- **Service'lar**: repository'lar va `@/lib/prisma`'ni `vi.mock` — DB'ga ulanmaymiz.
- **Komponentlar**: jsdom + React Testing Library, mock'lash kerak emas (props orqali ma'lumot uzatamiz).
- **Fake timers**: streak testida `vi.setSystemTime(new Date('2026-05-27T...'))` — deterministik.
- **Coverage targeti**: critical service'lar uchun 80%+ (statements).

## Folder konventsiyasi

- **Server Component default** — `'use client'` faqat zarur bo'lsa.
- **`page.tsx`** = Server Component (auth + prefetch).
- **`*Interactive.tsx`** = Client Component (hook'lar, event handler'lar).
- **`__tests__/`** subdirectory — test fayllar.
- **Repository nomi**: `<entity>.repository.ts` (kebab-case fayl, camelCase export namespace).

## Kelajak iteratsiyalar (TODO)

- **Refresh token**: 15-min access + 7-day refresh (hozir 7-kun access)
- **Sentry**: production runtime error tracking
- **Vercel Analytics** (yoki Plausible): custom events (`topic_completed`, `streak_milestone`, ...)
- **i18n**: hozir faqat O'zbek tilida, kelajak — Rus va Ingliz
- **Refresh token DB jadval**: hozir cookie'da hammasi
- **Redis rate limit**: hozir in-memory (`lib/rateLimit.ts`)
- **Background jobs**: certificate generation, email kuyish — hozircha sync
