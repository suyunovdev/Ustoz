# TASK 7 — ADMIN DASHBOARD
**Branch:** `feature/admin-dashboard`  
**Daraja:** O'rta

---

## Nima qilasiz?

Admin panel komponentlarini Supabase dan yangi Prisma API ga ulaysiz. 3 ta yangi API route yaratasiz.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/app/admin-dashboard/components/AdminDashboardInteractive.tsx`
2. `src/app/admin-dashboard/components/ModerationQueuePanel.tsx`
3. `src/app/admin-dashboard/components/CourseOversightPanel.tsx`
4. `src/app/admin-dashboard/components/UserManagementPanel.tsx`
5. `src/app/content-moderation-dashboard/components/ModerationDashboardInteractive.tsx`
6. `src/app/content-moderation-dashboard/components/PreviewPanel.tsx`

## Yangi fayllar yaratasiz:

7. `src/app/api/admin/stats/route.ts`
8. `src/app/api/admin/users/route.ts`
9. `src/app/api/admin/courses/route.ts`

---

## YANGI FAYL 1: `src/app/api/admin/stats/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return jsonResponse({ error: 'Admin ruxsati kerak' }, { status: 403 })
  }

  const [totalUsers, totalCourses, totalEnrollments, publishedCourses] = await Promise.all([
    prisma.userProfile.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.course.count({ where: { isPublished: true } }),
  ])

  return jsonResponse({
    stats: {
      totalUsers,
      totalCourses,
      totalEnrollments,
      publishedCourses,
      draftCourses: totalCourses - publishedCourses,
    },
  })
}
```

---

## YANGI FAYL 2: `src/app/api/admin/users/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

// GET /api/admin/users — barcha foydalanuvchilar
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return jsonResponse({ error: 'Admin ruxsati kerak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = 20
  const search = searchParams.get('search') || ''

  const where = search
    ? { OR: [
        { fullName: { contains: search, mode: 'insensitive' as const } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ]}
    : {}

  const [users, total] = await Promise.all([
    prisma.userProfile.findMany({
      where,
      include: { user: { select: { email: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.userProfile.count({ where }),
  ])

  return jsonResponse({ users, pagination: { page, total, totalPages: Math.ceil(total / limit) } })
}

// PATCH /api/admin/users — foydalanuvchi rolini o'zgartirish
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return jsonResponse({ error: 'Admin ruxsati kerak' }, { status: 403 })
  }

  const { userId, role } = await req.json()
  if (!userId || !['student', 'teacher', 'admin'].includes(role)) {
    return jsonResponse({ error: "userId va to'g'ri role kerak" }, { status: 400 })
  }

  const updated = await prisma.userProfile.update({
    where: { userId },
    data: { role },
  })
  return jsonResponse({ user: updated })
}
```

---

## YANGI FAYL 3: `src/app/api/admin/courses/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

// GET /api/admin/courses — barcha kurslar (admin uchun)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return jsonResponse({ error: 'Admin ruxsati kerak' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = 20
  const isPublished = searchParams.get('isPublished')

  const where: any = {}
  if (isPublished === 'true') where.isPublished = true
  if (isPublished === 'false') where.isPublished = false

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        teacher: { select: { fullName: true, avatarUrl: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.course.count({ where }),
  ])

  return jsonResponse({
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      isPublished: c.isPublished,
      priceUzs: c.priceUzs.toString(),
      rating: c.rating,
      enrollmentCount: c._count.enrollments,
      teacher: c.teacher,
      createdAt: c.createdAt,
    })),
    pagination: { page, total, totalPages: Math.ceil(total / limit) },
  })
}

// PATCH /api/admin/courses — kurs holati o'zgartirish
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'admin') {
    return jsonResponse({ error: 'Admin ruxsati kerak' }, { status: 403 })
  }

  const { courseId, isPublished } = await req.json()
  if (!courseId) return jsonResponse({ error: 'courseId kerak' }, { status: 400 })

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { isPublished },
  })
  return jsonResponse({ course: { ...updated, priceUzs: updated.priceUzs.toString() } })
}
```

---

## FRONTEND KOMPONENTLAR — UMUMIY PATTERN

Barcha admin komponentlarida Supabase o'rniga yangi API'lardan foydalaning:

### `AdminDashboardInteractive.tsx`:
```typescript
const [stats, setStats] = useState<any>(null)

useEffect(() => {
  fetch('/api/admin/stats', { credentials: 'include' })
    .then(r => r.json())
    .then(({ stats }) => setStats(stats))
}, [])
```

### `UserManagementPanel.tsx`:
```typescript
const [users, setUsers] = useState<any[]>([])

const loadUsers = async (search = '', page = 1) => {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)

  const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
  const { users } = await res.json()
  setUsers(users || [])
}

useEffect(() => { loadUsers() }, [])

// Rol o'zgartirish:
const changeRole = async (userId: string, role: string) => {
  await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userId, role }),
  })
  loadUsers()
}
```

### `CourseOversightPanel.tsx` va `ModerationQueuePanel.tsx`:
```typescript
const [courses, setCourses] = useState<any[]>([])

// Barcha kurslar:
fetch('/api/admin/courses', { credentials: 'include' })
  .then(r => r.json())
  .then(({ courses }) => setCourses(courses || []))

// Faqat kutayotganlar (unpublished):
fetch('/api/admin/courses?isPublished=false', { credentials: 'include' })
  .then(r => r.json())
  .then(({ courses }) => setCourses(courses || []))

// Kursni publish qilish:
const publishCourse = async (courseId: string) => {
  await fetch('/api/admin/courses', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ courseId, isPublished: true }),
  })
  // Ro'yxatni yangilash
}
```

---

## TEST QILISH

Admin foydalanuvchi yaratasiz (DB da role='admin' qiling) va:

1. `/admin-dashboard` — statistika ko'rinsinmi?
2. Foydalanuvchilar ro'yxati ko'rinsinmi?
3. Kurslar ro'yxati ko'rinsinmi?
4. `http://localhost:3000/api/admin/stats` — JSON kelsinmi?

> **DB da admin yaratish:**  
> `user_profiles` jadvalida biror foydalanuvchining `role` ni `admin` ga o'zgartiring.

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: admin - stats, users, courses API yaratildi"
git commit -m "feat: admin - dashboard komponentlar API ga ulandi"
git commit -m "feat: admin - kurs moderatsiya ishlaydi"
```
