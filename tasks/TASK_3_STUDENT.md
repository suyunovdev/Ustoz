# TASK 3 — STUDENT DASHBOARD + LEARNING
**Branch:** `feature/student-dashboard`  
**Daraja:** O'rta

---

## Nima qilasiz?

O'quvchi dashboard, dars ko'rish va sertifikat sahifalarini API ga ulaysiz. Shuningdek, bitta yangi API fayl yaratasiz.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/app/student-dashboard/components/StudentDashboardInteractive.tsx`
2. `src/app/learning-interface/components/LearningInterfaceInteractive.tsx`
3. `src/app/quiz-interface/components/QuizInterfaceInteractive.tsx`
4. `src/app/api/certificates/my/route.ts`
5. `src/app/api/certificates/[id]/route.ts`

## Yangi fayl yaratasiz:

6. `src/app/api/enrollments/my/route.ts` ← **bu faylni yaratishingiz kerak**

---

## YANGI FAYL: `src/app/api/enrollments/my/route.ts`

Papkani yarating: `src/app/api/enrollments/my/`  
Keyin `route.ts` faylini yarating va quyidagini yozing:

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

// GET /api/enrollments/my — o'quvchining kurslarini olish
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 })

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.sub },
    include: {
      course: {
        include: {
          teacher: { select: { fullName: true, avatarUrl: true } },
          _count: { select: { topics: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  return jsonResponse({
    enrollments: enrollments.map(e => ({
      id: e.id,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
      course: {
        id: e.course.id,
        title: e.course.title,
        coverImage: e.course.coverImage,
        category: e.course.category,
        priceUzs: e.course.priceUzs.toString(),
        topicCount: e.course._count.topics,
        teacher: e.course.teacher,
      },
    })),
  })
}
```

---

## FAYL 1: `src/app/student-dashboard/components/StudentDashboardInteractive.tsx`

Supabase kodni quyidagi bilan almashtiring:

```typescript
const [enrollments, setEnrollments] = useState<any[]>([])
const [certificates, setCertificates] = useState<any[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const load = async () => {
    try {
      const [enrollRes, certRes] = await Promise.all([
        fetch('/api/enrollments/my', { credentials: 'include' }),
        fetch('/api/certificates/my', { credentials: 'include' }),
      ])
      const [enrollData, certData] = await Promise.all([
        enrollRes.json(),
        certRes.json(),
      ])
      setEnrollments(enrollData.enrollments || [])
      setCertificates(certData.certificates || [])
    } finally {
      setIsLoading(false)
    }
  }
  load()
}, [])

// progress ko'rsatish:
// enrollment.progress — 0 dan 100 gacha
```

---

## FAYL 2: `src/app/learning-interface/components/LearningInterfaceInteractive.tsx`

```typescript
const searchParams = useSearchParams()
const courseId = searchParams.get('courseId')
const [course, setCourse] = useState<any>(null)
const [currentTopicId, setCurrentTopicId] = useState<string | null>(null)

// Kurs ma'lumotlarini yuklash:
useEffect(() => {
  if (!courseId) return
  fetch(`/api/courses/${courseId}`, { credentials: 'include' })
    .then(r => r.json())
    .then(({ course }) => {
      setCourse(course)
      if (course.topics?.length > 0) {
        setCurrentTopicId(course.topics[0].id)
      }
    })
}, [courseId])

// Dars tugatilganda progress yangilash:
const markTopicDone = async (topicId: string) => {
  await fetch('/api/progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ courseId, topicId, progress: 100 }),
  })
  // Keyin kursni qayta yuklash:
  // fetchCourse()
}
```

---

## FAYL 3: `src/app/quiz-interface/components/QuizInterfaceInteractive.tsx`

```typescript
const searchParams = useSearchParams()
const testId = searchParams.get('testId')
const [quiz, setQuiz] = useState<any>(null)

// Testni yuklash:
useEffect(() => {
  if (!testId) return
  fetch(`/api/teacher/tests?id=${testId}`, { credentials: 'include' })
    .then(r => r.json())
    .then(({ tests }) => setQuiz(tests?.[0] || null))
}, [testId])
```

---

## FAYL 4: `src/app/api/certificates/my/route.ts`

To'liq almashtiring:

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 })

  const certificates = await prisma.certificate.findMany({
    where: { studentId: session.sub },
    include: {
      course: { select: { title: true, coverImage: true } },
    },
    orderBy: { issuedAt: 'desc' },
  })
  return jsonResponse({ certificates })
}
```

---

## FAYL 5: `src/app/api/certificates/[id]/route.ts`

To'liq almashtiring:

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const certificate = await prisma.certificate.findFirst({
    where: { id },
    include: {
      course: { select: { title: true } },
      student: { select: { fullName: true } },
    },
  })

  if (!certificate) return jsonResponse({ error: 'Sertifikat topilmadi' }, { status: 404 })
  return jsonResponse({ certificate })
}
```

---

## TEST QILISH

1. Login qiling (Task 1 tugagan bo'lsa)
2. `/student-dashboard` — kurslaringiz ko'rinsinmi?
3. Kursga bosing → `/learning-interface` — darslar ko'rinsinmi?
4. `http://localhost:3000/api/enrollments/my` — ma'lumot kelsinmi?
5. `http://localhost:3000/api/certificates/my` — javob kelsinmi?

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: student - enrollments/my API yaratildi"
git commit -m "feat: student - dashboard API ga ulandi"
git commit -m "feat: student - certificates API Prisma ga o'tkazildi"
```
