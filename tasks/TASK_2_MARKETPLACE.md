# TASK 2 — COURSE MARKETPLACE + DETAILS
**Branch:** `feature/marketplace`  
**Daraja:** O'rta

---

## Nima qilasiz?

Kurs bozori (marketplace) va kurs detail sahifasini Supabase dan yangi API ga ulaysiz.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/app/course-marketplace/components/MarketplaceInteractive.tsx`
2. `src/app/course-details/components/CourseDetailsInteractive.tsx`
3. `src/app/api/reviews/route.ts`
4. `src/app/api/health/route.ts`

---

## FAYL 1: `src/app/course-marketplace/components/MarketplaceInteractive.tsx`

Faylni oching. Supabase bilan kurslar olinadigan qismni toping va quyidagicha o'zgartiring:

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'

// STATE:
const [courses, setCourses] = useState<any[]>([])
const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
const [search, setSearch] = useState('')
const [category, setCategory] = useState('')
const [sortBy, setSortBy] = useState('createdAt')
const [page, setPage] = useState(1)
const [isLoading, setIsLoading] = useState(true)

// KURSLAR OLISH FUNKSIYASI:
const fetchCourses = useCallback(async () => {
  setIsLoading(true)
  try {
    const params = new URLSearchParams({ page: String(page), limit: '12', sortBy })
    if (search) params.set('search', search)
    if (category) params.set('category', category)

    const res = await fetch(`/api/courses?${params}`)
    const data = await res.json()
    setCourses(data.courses || [])
    setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 })
  } finally {
    setIsLoading(false)
  }
}, [page, search, category, sortBy])

useEffect(() => { fetchCourses() }, [fetchCourses])
```

**Narxni ko'rsatish uchun** (`priceUzs` string keladi):
```typescript
// Masalan: "150000" → "150 000 so'm"
const formatPrice = (price: string) =>
  Number(price) === 0 ? 'Bepul' : `${Number(price).toLocaleString()} so'm`
```

---

## FAYL 2: `src/app/course-details/components/CourseDetailsInteractive.tsx`

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

const params = useParams()
const courseId = params.id as string
const router = useRouter()

const [course, setCourse] = useState<any>(null)
const [isLoading, setIsLoading] = useState(true)

// KURS MA'LUMOTLARINI OLISH:
useEffect(() => {
  fetch(`/api/courses/${courseId}`)
    .then(r => r.json())
    .then(({ course }) => {
      setCourse(course)
      setIsLoading(false)
    })
    .catch(() => setIsLoading(false))
}, [courseId])

// KURSGA YOZILISH (bepul kurslar uchun):
const handleEnroll = async () => {
  const res = await fetch(`/api/courses/${courseId}/enroll`, {
    method: 'POST',
    credentials: 'include',
  })
  const data = await res.json()
  if (res.ok) {
    router.push(`/learning-interface?courseId=${courseId}`)
  } else {
    alert(data.error) // Masalan: "Bu kurs pullik. Avval to'lov qiling."
  }
}

// course.isEnrolled — true bo'lsa: "Kursni boshlash" tugmasi
// course.isEnrolled — false bo'lsa: "Yozilish" tugmasi
```

---

## FAYL 3: `src/app/api/reviews/route.ts`

Bu faylni **to'liq** quyidagi bilan almashtiring:

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

// GET /api/reviews?courseId=xxx — kurs sharhlari
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  if (!courseId) return jsonResponse({ error: 'courseId kerak' }, { status: 400 })

  const reviews = await prisma.courseReview.findMany({
    where: { courseId },
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return jsonResponse({ reviews })
}

// POST /api/reviews — sharh yozish
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 })

  const { courseId, rating, comment } = await req.json()
  if (!courseId || !rating) return jsonResponse({ error: "courseId va rating kerak" }, { status: 400 })

  // Faqat kursga yozilgan o'quvchi sharh yoza oladi
  const enrollment = await prisma.enrollment.findFirst({
    where: { courseId, studentId: session.sub },
  })
  if (!enrollment) return jsonResponse({ error: "Avval kursga yoziling" }, { status: 403 })

  const existing = await prisma.courseReview.findFirst({
    where: { courseId, studentId: session.sub },
  })
  if (existing) return jsonResponse({ error: "Allaqachon sharh yozgansiz" }, { status: 400 })

  const review = await prisma.courseReview.create({
    data: { courseId, studentId: session.sub, rating: Number(rating), comment },
  })
  return jsonResponse({ review }, { status: 201 })
}
```

---

## FAYL 4: `src/app/api/health/route.ts`

Bu faylni to'liq almashtiring:

```typescript
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return jsonResponse({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
  } catch (err: any) {
    return jsonResponse({ status: 'error', database: 'disconnected', error: err.message }, { status: 500 })
  }
}
```

---

## TEST QILISH

1. `/course-marketplace` — kurslar ro'yxati ko'rinsinmi?
2. Qidiruv ishlayaptimi?
3. Kurs kartasiga bosing — detail sahifasi ochilsinmi?
4. Bepul kursga "Yozilish" — ishlayaptimi?
5. `http://localhost:3000/api/health` — `{"status":"ok"}` kelsinmi?

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: marketplace - API ga ulandi, bepul kurs enroll ishlaydi"
git commit -m "feat: reviews API - Prisma bilan qayta yozildi"
```
