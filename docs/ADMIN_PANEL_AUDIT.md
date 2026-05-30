# Ustoz — Admin Panel: To'liq Audit va Takomillashtirish Rejasi

**Sana:** 2026-05-27
**Audit muallifi:** Claude Opus 4.7 (Anthropic)
**Maqsad:** Admin panelni production'ga tayyor holatga keltirish bo'yicha senior dasturchilar va AI'lar bilan maslahatlashish uchun toʻliq brifing.

---

## 1. Loyiha konteksti

**Ustoz** — Oʻzbek tilida onlayn taʼlim platformasi (marketplace + LMS).

| Komponent | Texnologiya |
|---|---|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19 + TypeScript (strict) + Tailwind CSS 3.4 |
| Database | PostgreSQL 15 + Prisma 7.8 (pg adapter) |
| Auth | JWT (jose) + httpOnly cookie + bcryptjs 12 rounds |
| State | TanStack Query v5 + HydrationBoundary (faqat student dashboard'da) |
| Charts | Recharts |
| Email | Resend (OTP) |
| Testing | Vitest + React Testing Library |

**Rollar (UserRole enum):** `student`, `teacher`, `admin`.

**Hozirgi rivojlanish bosqichi:**
- ✅ Student dashboard — enterprise quality (real progress, streak, recommendations, SSR, tests)
- ⚠️ Teacher dashboard — qisman ishlaydi (assignments, courses)
- ❌ **Admin dashboard — 90% mock data, 0 ta backend endpoint**

---

## 2. Hozirgi admin panel — strukturasi

### Routing
- **Sahifa**: `/admin-dashboard`
- **Auth guard**: `src/middleware.ts` — admin-only ([middleware.ts:82-85](src/middleware.ts#L82-L85))
- **Page file**: `src/app/admin-dashboard/page.tsx` — 13 qator
- **Asosiy komponent**: `AdminDashboardInteractive.tsx` — Client Component

### Komponentlar (jami 7 ta, ~1075 LOC)

```
src/app/admin-dashboard/
├── page.tsx                              13 LOC   (wrapper + metadata)
└── components/
    ├── AdminDashboardInteractive.tsx     193 LOC  6 tab orchestrator + URL sync
    ├── PlatformMetrics.tsx               91  LOC  4 ta KPI card
    ├── UserManagementPanel.tsx           174 LOC  Filter + qidirish + ro'yxat
    ├── CourseOversightPanel.tsx          206 LOC  Moderation status filter + ro'yxat
    ├── ModerationQueuePanel.tsx          145 LOC  Content review queue
    ├── AnalyticsCharts.tsx               137 LOC  3 ta Recharts grafik
    └── SystemHealthPanel.tsx             148 LOC  Tizim sog'ligi + alert'lar
```

### Tab navigatsiyasi (6 ta)

```
[ 🏠 Umumiy ko'rinish ] [ 👥 Foydalanuvchilar ] [ 📚 Kurslar ]
[ ✅ Moderatsiya ] [ 📊 Tahlil ] [ ⚙️ Tizim ]
```

URL bilan sinxron: `/admin-dashboard?tab=users`, `?tab=courses`, va h.k. (2026-05-27 da qo'shildi).

---

## 3. Frontend holati — Tab-by-tab

### 3.1. Umumiy ko'rinish (Overview)
**Faylar**: `AdminDashboardInteractive.tsx` → `PlatformMetrics` + `ModerationQueuePanel` + `SystemHealthPanel` + `AnalyticsCharts`

**Hozirgi holat:**
| KPI | Ma'lumot manbasi | Real/Mock |
|---|---|---|
| Jami foydalanuvchilar | `setStats({ totalUsers: 0 })` | ❌ Mock (0) |
| Faol kurslar | `/api/courses?limit=50` (pagination.total) | ✅ Real |
| Umumiy daromad | `setStats({ totalRevenue: 0 })` | ❌ Mock ($0) |
| Tizim holati | `setStats({ systemHealth: 98 })` | ❌ Hardcoded 98% |
| User growth % | `setStats({ userGrowth: 0 })` | ❌ Mock |
| Course growth % | `setStats({ courseGrowth: 0 })` | ❌ Mock |
| Revenue growth % | `setStats({ revenueGrowth: 0 })` | ❌ Mock |

**Code reference** ([AdminDashboardInteractive.tsx:82-91](src/app/admin-dashboard/components/AdminDashboardInteractive.tsx#L82-L91)):

```ts
// TODO: add /api/admin/stats endpoint for totalUsers / revenue / system metrics
setStats({
  totalUsers: 0,
  activeCourses,
  totalRevenue: 0,
  systemHealth: 98,
  userGrowth: 0,
  courseGrowth: 0,
  revenueGrowth: 0
});
```

### 3.2. Foydalanuvchilar (Users)
**Fayl**: `UserManagementPanel.tsx`

**Hozirgi holat:**
- UI to'liq: role filter (Barchasi/O'qituvchi/Talaba/Admin) + qidirish + ro'yxat
- Backend: `loadUsers()` qaytaradigan `setUsers([])` — har doim bo'sh
- Action: Har user qatorida 3-dot menu → bosilganda `alert("Bu funksiya tez orada qo'shiladi")`

**Code reference** ([UserManagementPanel.tsx:26-38](src/app/admin-dashboard/components/UserManagementPanel.tsx#L26-L38)):

```ts
const loadUsers = async () => {
  setIsLoading(true);
  try {
    // TODO: add /api/admin/users endpoint (returns user_profiles list with role filter)
    // For now, the panel renders the empty state so the UI doesn't crash.
    setUsers([]);
  } catch (error) {
    console.error('Error loading users:', error);
    setUsers([]);
  } finally {
    setIsLoading(false);
  }
};
```

**Stub action** ([UserManagementPanel.tsx:149-158](src/app/admin-dashboard/components/UserManagementPanel.tsx#L149-L158)):

```ts
onClick={() => {
  // TODO: add /api/admin/users/[id] PATCH endpoint for suspend/role change
  alert("Bu funksiya tez orada qo'shiladi");
}}
```

### 3.3. Kurslar (Courses)
**Fayl**: `CourseOversightPanel.tsx`

**Hozirgi holat:**
- Filter: Barchasi / Kutilmoqda / Tasdiqlangan / Rad etilgan
- Backend: `/api/courses?limit=50` (faqat published kurslar)
- `moderation_status`: har course'ga `'approved'` deb hardcoded set qilingan ([CourseOversightPanel.tsx:53](src/app/admin-dashboard/components/CourseOversightPanel.tsx#L53))
- pending va rejected count'lar har doim 0
- View button (👁️) onClick'siz

```ts
const normalized: Course[] = apiCourses.map((c: any) => ({
  ...
  moderation_status: 'approved', // /api/courses only returns published items
  ...
}));

setStats({
  total: totalFromApi,
  approved: totalFromApi,
  pending: 0, // TODO: needs /api/admin/courses
  rejected: 0 // TODO: needs /api/admin/courses
});
```

### 3.4. Moderatsiya (Moderation Queue)
**Fayl**: `ModerationQueuePanel.tsx`

**Hozirgi holat:**
- Stat'lar (Kutilmoqda / Ko'rib chiqilmoqda / O'rtacha vaqt) — hammasi 0
- Item ro'yxati — bo'sh
- View button (👁️) — onClick'siz

**Code reference** ([ModerationQueuePanel.tsx:33-46](src/app/admin-dashboard/components/ModerationQueuePanel.tsx#L33-L46)):

```ts
const loadModerationQueue = async () => {
  setIsLoading(true);
  try {
    // TODO: add /api/admin/moderation-queue endpoint that joins
    //       moderation_queue with course_materials and returns
    //       { items: [...], stats: { pending, underReview, avgReviewTime } }
    setItems([]);
    setStats({ pending: 0, underReview: 0, avgReviewTime: '0h 0m' });
  } catch (error) {
    console.error('Error loading moderation queue:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### 3.5. Tahlil (Analytics)
**Fayl**: `AnalyticsCharts.tsx`

**Hozirgi holat: 100% mock data.** Hardcoded oylik (Yan/Fev/Mar/Apr/May/Iyun) va kunlik (Dush/Sesh/.../Yak) ma'lumot bilan 3 ta grafik:

1. **User Growth Chart** — Bar chart (teachers + students per month)
2. **Course Completion Chart** — Line chart (completion % + enrollment %)
3. **Engagement Chart** — Bar chart (active users per weekday)

```ts
const userGrowthData = [
  { month: 'Yan', users: 120, teachers: 15, students: 105 },
  { month: 'Fev', users: 185, teachers: 22, students: 163 },
  // ... 6 oy hardcoded
];
```

### 3.6. Tizim (System Health)
**Fayl**: `SystemHealthPanel.tsx`

**Hozirgi holat: 100% hardcoded.** Real monitoring yo'q.

```ts
const [healthMetrics, setHealthMetrics] = useState({
  serverStatus: 'online',
  databasePerformance: 95,
  apiResponseTime: 145,
  storageUsage: 68,
  activeConnections: 234,
  errorRate: 0.2
});

const [alerts, setAlerts] = useState([
  { id: '1', type: 'info', message: 'Tizim yangilanishi mavjud', time: '10 daqiqa oldin' },
  { id: '2', type: 'success', message: 'Backup muvaffaqiyatli yakunlandi', time: '2 soat oldin' }
]);
```

**Bug**: Line 12'da `SystemHealthPanelPanelProps` — duplicate "Panel" typo. `@ts-nocheck` (line 1) buni yashirgan.

---

## 4. Backend — Admin endpoint'lar

### 4.1. Mavjudlik
**`/api/admin/` papkasi umuman yo'q.** Bu — eng katta gap.

Mavjud API'lar (admin shu yerdan ham ma'lumot olishi mumkin):
- `/api/auth/me` — current user
- `/api/courses` — faqat `isPublished=true` kurslar
- `/api/notifications` — current user notification'lari
- `/api/categories` — kategoriya ro'yxati
- `/api/student/streak`, `/api/student/activity`, `/api/student/recommendations` — student-only
- `/api/enrollments/*` — student enrollment'lar
- `/api/teacher/*` — teacher resources (assignments, students, groups, analytics, courses, dashboard)
- `/api/tests/*` — quiz endpoints

### 4.2. TODO comment'lar (verbatim — admin code'idan)

```
// TODO: add /api/admin/stats endpoint for totalUsers / revenue / system metrics
// TODO: add /api/admin/users endpoint (returns user_profiles list with role filter)
// TODO: add /api/admin/users/[id] PATCH endpoint for suspend/role change
// TODO: add /api/admin/courses endpoint with moderation_status filter
// TODO: add /api/admin/moderation-queue endpoint that joins
//       moderation_queue with course_materials and returns
//       { items: [...], stats: { pending, underReview, avgReviewTime } }
```

### 4.3. Kerakli endpoint'lar ro'yxati (taklif)

| Endpoint | Method | Vazifa |
|---|---|---|
| `/api/admin/stats` | GET | Dashboard KPI'lar (users, courses, revenue, growth) |
| `/api/admin/users` | GET | Foydalanuvchilar ro'yxati + role filter + qidirish + pagination |
| `/api/admin/users/[id]` | PATCH | Role o'zgartirish, suspend/activate |
| `/api/admin/users/[id]` | DELETE | Soft delete (mark inactive) |
| `/api/admin/courses` | GET | Barcha kurslar (moderation status bo'yicha filter) |
| `/api/admin/courses/[id]/moderate` | POST | Approve/reject + feedback |
| `/api/admin/moderation` | GET | Moderation queue + statistika |
| `/api/admin/moderation/[id]` | POST | Approve/reject material |
| `/api/admin/analytics/users` | GET | Oylik user growth (real `users.created_at` bo'yicha) |
| `/api/admin/analytics/courses` | GET | Enrollment + completion trends |
| `/api/admin/analytics/engagement` | GET | DAU/WAU/MAU (`student_activities` jadvalidan) |
| `/api/admin/analytics/revenue` | GET | Daromad statistikasi (`payment_transactions`) |
| `/api/admin/health` | GET | DB ping, table sizes, slow query log |
| `/api/admin/audit-log` | GET | Admin actions journal (yangi jadval kerak) |

---

## 5. Auth & Middleware

### 5.1. Route guards ([src/middleware.ts](src/middleware.ts))

```ts
const ADMIN_ONLY_ROUTES = [
  '/admin-dashboard',
  '/content-moderation-dashboard',
];

if (matchesRoutes(pathname, ADMIN_ONLY_ROUTES)) {
  if (userRole !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}
```

✅ Frontend route guard ishlaydi.
❌ Lekin **backend route guard'lar yo'q** — API endpoint'larda har bir handler'da manual `if (session.role !== 'admin')` tekshirish kerak. Hozircha bu shaklda emas (chunki endpoint'lar yo'q).

### 5.2. Admin user yaratish
- DB'da admin yo'q edi (2026-05-27 holatida).
- `scripts/seed-test-users.ts` orqali 3 ta test akkaunt yaratildi:
  - `admin@ustoz.uz` / `Test1234!`
  - `teacher@ustoz.uz` / `Test1234!`
  - `student@ustoz.uz` / `Test1234!`

### 5.3. Header navigatsiyasi (2026-05-27 fix)
**Avval**: Admin'ga teacher nav ko'rsatilardi ("Kurs Yaratish", "Guruhlar", "Topshiriqlar").
**Hozir**: Admin uchun alohida nav:
- 🛡 Admin paneli → `/admin-dashboard`
- 👥 Foydalanuvchilar → `?tab=users`
- 📚 Kurslar → `?tab=courses`
- ✅ Moderatsiya → `?tab=moderation`

---

## 6. Database — Admin uchun mavjud schema

### 6.1. Asosiy jadvallar (real ma'lumot bilan)
| Jadval | Rows (live) | Admin uchun ahamiyati |
|---|---|---|
| `users` | 17 | Total users, role breakdown |
| `courses` | 12 | Total courses, moderation status, top kurslar |
| `enrollments` | 12 | Enrollment growth, top kurslar |
| `payment_transactions` | 1 | Revenue stats |
| `student_activities` | 5 | DAU/WAU/MAU |
| `moderation_queue` | 0 | Content moderation (hali ishlatilmagan) |
| `notifications` | ? | Admin xabarnomalari |

### 6.2. Moderation infrastructure (mavjud, lekin ishlatilmagan)

**`moderation_queue` jadvali** ([schema.prisma:638-654](prisma/schema.prisma#L638-L654)):
```prisma
model ModerationQueue {
  id              String           @id @default(uuid()) @db.Uuid
  materialId      String           @map("material_id") @db.Uuid
  reviewerId      String?          @map("reviewer_id") @db.Uuid
  status          ModerationStatus @default(submitted)
  feedback        String?
  plagiarismScore Decimal?
  qualityScore    Decimal?
  policyCompliant Boolean?
  submittedAt     DateTime
  reviewedAt      DateTime?
  // ...
}
```

**`moderation_history`** — har bir action log uchun (audit trail).

**`ModerationStatus` enum**: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `revision_requested`.

### 6.3. Tegishli enum'lar
- `UserRole`: `teacher`, `student`, `admin`
- `TransactionStatus`: `pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded`
- `NotificationType`: `enrollment`, `quiz_completion`, `assignment_submission`, `course_update`, `achievement`, `payment`

### 6.4. **Yo'q** narsalar
- ❌ User `isActive` / `suspended` field — suspend qilish uchun yangi field kerak
- ❌ `audit_log` jadval — admin action'larini logging uchun
- ❌ User `lastLoginAt` — engagement uchun
- ❌ `system_alerts` jadval — real notification'lar uchun (hozir frontend'da hardcoded)

---

## 7. Code Quality Issues

### 7.1. `@ts-nocheck` ishlatilgan fayllar (5/7)
TypeScript'ni butunlay bypass qiladi → bug'larni yashiradi.

- `AdminDashboardInteractive.tsx`
- `UserManagementPanel.tsx`
- `CourseOversightPanel.tsx`
- `ModerationQueuePanel.tsx`
- `SystemHealthPanel.tsx`

`AnalyticsCharts.tsx` va `PlatformMetrics.tsx` — TypeScript bilan toza.

### 7.2. Yashirilgan bug'lar
- [SystemHealthPanel.tsx:12](src/app/admin-dashboard/components/SystemHealthPanel.tsx#L12): `SystemHealthPanelPanelProps` — duplicate "Panel" so'zi (typo). Komponent argument tipa noto'g'ri. `@ts-nocheck` yashirgan.

### 7.3. Anti-pattern'lar (student-dashboard'dan farqli)
| Pattern | Admin'da | Student'da |
|---|---|---|
| Data fetching | `useState` + `useEffect` + `fetch` | TanStack Query hook'lar |
| Cache | yo'q (har tab switch'da qayta fetch) | 30s-5min staleTime |
| Optimistic UI | yo'q | onMutate + rollback |
| SSR prefetch | yo'q | HydrationBoundary + Server Component |
| Service layer | yo'q | `lib/services/*.ts` |
| Repository layer | yo'q | `lib/repositories/*.ts` |
| Tests | 0 ta | 14 ta service test + 6 ta component test |
| Loading skeleton | bor (lekin har tab'da qayta) | bor (TanStack Query bilan optimallashtirilgan) |

### 7.4. Dead code va boshqa kichik muammolar
- Avval `<RoleBasedHeader userRole="teacher" .../>` — `userRole` prop ignored bo'lardi (`useAuth()` ishlatiladi). **Fix qilindi.**
- `setIsHydrated` pattern — `'use client'` + `useEffect` bilan kerak emas
- Stub action'larda `alert(...)` ishlatilgan — toast/modal o'rniga
- `Cmd+F "console.log"` — ko'p production'siz log

---

## 8. Bugun bajarilgan tuzatishlar (2026-05-27)

| Fayl | O'zgarish |
|---|---|
| `RoleBasedHeader.tsx` | `adminNavItems` qo'shildi, admin'ga to'g'ri nav ko'rinadi |
| `RoleBasedHeader.tsx` | Logo link admin uchun `/admin-dashboard`'ga |
| `AdminDashboardInteractive.tsx` | URL `?tab=` ⇄ activeTab sinxronlash |
| `AdminDashboardInteractive.tsx` | Dead `userRole="teacher"` prop olib tashlandi |
| `admin-dashboard/page.tsx` | `dynamic = 'force-dynamic'` + `robots: noindex` |

**Hali tegmagan**: 7 ta komponentdagi mock data, 0 ta backend endpoint, `@ts-nocheck`.

---

## 9. Student-dashboard bilan taqqoslash (taqlid namunasi)

Student dashboard'da nima bor — admin'ga ham shu kerak:

### 9.1. 3-qatlamli arxitektura
```
HTTP route → Service → Repository → Prisma
```

### 9.2. Hozir mavjud (faqat student uchun)
- `lib/services/`: progress, streak, recommendation, dashboard (orchestrator), dashboard-progress.helper
- `lib/repositories/`: enrollment, course, topic, topic-completion, activity, certificate, category
- `lib/errors/`: ServiceError, EnrollmentNotFoundError, TopicNotFoundError, CourseNotFoundError
- `hooks/queries/`: useStudentDashboard, useStreak, useActivityCalendar, useCategories
- `hooks/mutations/`: useCompleteTopicMutation (optimistic)
- `__tests__/`: 14 progress + 10 streak + 9 recommendation + 6 component = 39 tests, 84-100% coverage

### 9.3. Admin uchun shu strukturani qo'llash
**Yangi service'lar:**
- `admin-stats.service.ts` — KPI hisoblash
- `user-management.service.ts` — list/suspend/role change
- `course-moderation.service.ts` — approve/reject + audit
- `admin-analytics.service.ts` — DAU/WAU/MAU, growth metrics
- `audit-log.service.ts` — admin action logging

**Yangi repository'lar:**
- `payment.repository.ts` — revenue queries
- `audit-log.repository.ts` (yangi jadval kerak)
- `moderation.repository.ts`
- User va Course repo'lariga admin query'lar qo'shish

**Yangi hook'lar:**
- `useAdminStats`, `useAdminUsers`, `useAdminCourses`, `useAdminAnalytics`
- `useSuspendUserMutation`, `useModerateCourseMutation`

---

## 10. Gap analysis — har tab uchun nima kerak

### Overview (tab=overview)
| Kerak | Manba |
|---|---|
| Total users count | `SELECT COUNT(*) FROM users` |
| Users by role | `GROUP BY role` |
| Active courses | mavjud — `/api/courses` |
| Total revenue | `SUM(amount_uzs) FROM payment_transactions WHERE status='completed'` |
| Growth % (oy oldidan) | Mavjud user/enrollment'larni 30-day window bo'yicha taqqoslash |
| Recent activity feed | `student_activities` last 24h |

### Foydalanuvchilar (tab=users)
| Kerak | Manba |
|---|---|
| Paginated list | `user_profiles JOIN users` + cursor pagination |
| Role filter | `WHERE role = ?` |
| Search (email/name) | `WHERE email ILIKE ? OR full_name ILIKE ?` |
| Suspend/activate | YANGI `is_active` column kerak |
| Role change | `UPDATE` (faqat admin → admin huquqi tahlil qilish kerak) |
| User detail view | Modal yoki `/admin-dashboard/users/[id]` route |
| Login history | YANGI jadval kerak (`login_history`) |

### Kurslar (tab=courses)
| Kerak | Manba |
|---|---|
| Barcha kurslar (status filter) | `courses` jadval (isPublished + future moderation_status) |
| Course detail (admin view) | Existing + reviewer notes |
| Approve/reject | Status update + `moderation_history` insert |
| Bulk actions | API kerak |
| Featured kurs belgilash | YANGI `is_featured` column kerak |

### Moderatsiya (tab=moderation)
| Kerak | Manba |
|---|---|
| Queue (status=submitted/under_review) | Mavjud `moderation_queue` jadval |
| Stat'lar (pending/avg_review_time) | Aggregation query |
| Item detail (modal) | Material + reviewer history |
| Approve/reject + feedback | Mavjud schema'da feedback field bor |
| Reviewer assign | Mavjud `reviewer_id` field |

### Tahlil (tab=analytics)
| Kerak | Manba |
|---|---|
| Oylik user growth | `users.created_at` bo'yicha `date_trunc('month')` |
| Oylik enrollment | `enrollments.enrolled_at` |
| Course completion rate | `enrollments WHERE progress >= 100` / total |
| DAU/WAU/MAU | `student_activities.date` |
| Top kurslar (enrollment) | `courses ORDER BY enrollment_count DESC` |
| Top o'qituvchilar | `course_reviews AVG(rating) JOIN courses` |
| Revenue trend | `payment_transactions GROUP BY date_trunc('month', created_at)` |
| Engagement by weekday | `student_activities GROUP BY EXTRACT(DOW FROM date)` |

### Tizim (tab=system)
| Kerak | Manba |
|---|---|
| DB connection check | `SELECT 1` ping |
| Table row counts | `pg_class` yoki `COUNT(*)` |
| Slow queries | `pg_stat_statements` (extension kerak) |
| Storage usage | `pg_database_size` |
| Active sessions | mavjud (Prisma client pool stats) |
| Error rate | YANGI: error log jadval yoki Sentry integration |
| Recent alerts | YANGI `system_alerts` jadval |

---

## 11. Tavsiya etilgan yo'l xaritasi

### Phase 1 — Real data hookup (3-4 kun)
1. Schema'ga `user_profiles.is_active` column + migration
2. Repository qatlami: `payment.repository.ts`, `user.repository.ts` (admin queries)
3. Service qatlami: `admin-stats.service.ts`, `user-management.service.ts`
4. Endpoint'lar: `/api/admin/stats`, `/api/admin/users` (GET + PATCH)
5. Frontend: `useAdminStats`, `useAdminUsers` hooks (TanStack Query)
6. UserManagementPanel'ni real data'ga ulash
7. Suspend/role change mutations
8. **`@ts-nocheck`'larni olib tashlash**

### Phase 2 — Moderation flow (3-4 kun)
1. `moderation.repository.ts` + `course-moderation.service.ts`
2. `/api/admin/courses` (GET) + `/api/admin/courses/[id]/moderate` (POST)
3. `/api/admin/moderation` (GET + POST)
4. CourseOversightPanel + ModerationQueuePanel real data
5. Modal: course/material detail view
6. Approve/reject + feedback flow
7. `audit_log` jadval + service + `useAuditLog` query

### Phase 3 — Real analytics (2-3 kun)
1. `admin-analytics.service.ts` — DB queries (date_trunc, group by)
2. `/api/admin/analytics/*` endpoint'lari
3. AnalyticsCharts'ni real data'ga ulash
4. Date range picker
5. Export (CSV/Excel) — optional

### Phase 4 — System monitoring (1-2 kun)
1. DB health check service
2. `/api/admin/health` endpoint
3. Pg_stat_statements integration (slow queries)
4. SystemHealthPanel real data
5. Real alert'lar (Sentry yoki custom)

### Phase 5 — Polish (1-2 kun)
1. Server Components migration (SSR prefetch — student kabi)
2. Test coverage: service + component testlari
3. Toast'lar `alert()` o'rniga
4. Loading skeleton'larni TanStack Query bilan optimallashtirish
5. Audit log viewer
6. Role-based action authorization (admin → admin demotion?)

**Jami: ~10-15 kun**

---

## 12. Texnik qarorlar — Senior'lar uchun ochiq savollar

### 12.1. RBAC siyosati
- **Savol**: Admin boshqa admin'ni demote/suspend qila oladimi?
- **Variant A**: Hech bir admin boshqa admin'ga tegmaydi (faqat self-demote)
- **Variant B**: Super-admin role qo'shamiz (`super_admin` vs `admin`)
- **Variant C**: Admin → admin actions audit log'ga yoziladi va 2 admin tasdiqlashi kerak

### 12.2. Soft delete vs hard delete
- **Hozir**: hard delete (Cascade) — user o'chsa, hammasi o'chadi (enrollment, certificate, va h.k.)
- **Tavsiya**: `is_active = false` + `deleted_at` timestamp (soft delete)
- **Savol**: GDPR'ga muvofiq ma'lumot o'chirish talab qilinsa (right to be forgotten)?

### 12.3. Real-time updates
- **Hozir**: TanStack Query refetchOnWindowFocus + 30s staleTime
- **Variant**: WebSocket (Socket.io / native WS) — moderation queue real-time yangilanish
- **Savol**: Real-time kerakmi yoki polling yetarli?

### 12.4. Pagination strategiyasi
- **Variant A**: Offset-based — oddiy, lekin katta data'da sekin
- **Variant B**: Cursor-based — tez, lekin "page 5'ga o'tish" qiyin
- **Tavsiya**: Cursor-based (createdAt + id) + UI'da "Load more"

### 12.5. Audit log granularity
- **Variant A**: Faqat critical action'lar (suspend, role change, course reject)
- **Variant B**: Har bir admin GET request log qilinadi (compliance)
- **Tavsiya**: B-variant, lekin GET'lar separate "access_log" jadval'da

### 12.6. Analytics caching
- **Variant A**: Real-time query (har request'da DB hisoblaydi)
- **Variant B**: Materialized view'lar (kuniga 1 marta yangilanadi)
- **Variant C**: Redis cache (1 soat TTL)
- **Tavsiya**: Boshlash uchun A, scale bo'lganda B

### 12.7. Charts library
- **Hozir**: Recharts
- **Alternativa**: Tremor (Tailwind-native, sodda) yoki visx (low-level)
- **Savol**: Recharts'da bundle size masalasi bo'ladi (50KB+)

### 12.8. Sentry / error monitoring
- **Hozir**: Yo'q
- **Savol**: Admin panel uchun ham Sentry kerakmi yoki faqat critical user flow'lar uchun?

### 12.9. Background jobs
- Email yuborish, certificate generation, moderation auto-checks — hozir sync.
- **Savol**: BullMQ + Redis worker pattern kerakmi yoki Vercel Cron yetarli?

### 12.10. Multi-tenancy
- Loyiha bitta institutsiya yoki ko'p maktab/universitetlar uchunmi?
- Agar ko'p — `organization_id` + tenant isolation kerak.

---

## 13. Risk register

| Risk | Ehtimollik | Impact | Mitigation |
|---|---|---|---|
| Admin o'zini suspend qiladi | Past | Yuqori | UI'da tasdiqlash + backend self-action block |
| Admin oxirgi admin'ni o'chiradi | Past | Yuqori | Backend'da "minimum 1 admin" rule |
| SQL injection (admin search) | Past | Yuqori | Prisma parametrized queries (mavjud) |
| Mass user delete | Past | Yuqori | Rate limit + 2FA admin actions |
| Audit log to'lib qoladi | O'rta | O'rta | Retention policy (90 kun) + partitioning |
| Analytics query timeout | O'rta | Past | Indeks + materialized view |
| Race condition (concurrent moderation) | O'rta | O'rta | Optimistic locking (`updatedAt` check) |

---

## 14. Foydali code reference'lar (senior'lar uchun)

### Student dashboard — taqlid uchun namuna
- Page (Server Component + prefetch): [src/app/student-dashboard/page.tsx](src/app/student-dashboard/page.tsx)
- Service (orchestrator): [src/lib/services/dashboard.service.ts](src/lib/services/dashboard.service.ts)
- Repository pattern: [src/lib/repositories/](src/lib/repositories/)
- TanStack Query hook'lar: [src/hooks/queries/](src/hooks/queries/)
- Tests: [src/lib/services/__tests__/](src/lib/services/__tests__/)

### Mavjud arxitektura hujjati
- [ARCHITECTURE.md](ARCHITECTURE.md) — 3-qatlamli pattern tushuntirish

---

## 15. Xulosa

**Hozirgi holat:**
- UI 90% tayyor, lekin ma'lumot mock.
- 0 ta admin API endpoint.
- 5 ta komponentda `@ts-nocheck`.
- Bugun: navigatsiya tuzatildi, tab URL sync qo'shildi.

**Eng katta gap'lar:**
1. `/api/admin/*` endpoint'lari yo'q (eng birinchi galda hal qilinishi kerak).
2. Service/repository qatlami admin uchun mavjud emas (student'dan taqlid qilish kerak).
3. Audit log infrastructure'i mavjud emas.
4. Real analytics o'rniga 6 oylik hardcoded mock.

**Tavsiya etilgan birinchi qadam:**
Phase 1 — User Management to'liq ishlasin (3-4 kun): real list + suspend + role change + audit log.

---

## Qo'shimcha kontekst

- **GitHub repo**: https://github.com/suyunovdev/Ustoz
- **Test akkauntlar** (`Test1234!` parol bilan):
  - `admin@ustoz.uz`
  - `teacher@ustoz.uz`
  - `student@ustoz.uz`
- **Dev server**: `npm run dev` → http://localhost:4028
- **Database**: PostgreSQL 15, local
- **Migrations**: Prisma 7.8 (`prisma migrate dev`)
