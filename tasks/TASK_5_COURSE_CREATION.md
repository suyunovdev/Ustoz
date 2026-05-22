# TASK 5 — TEACHER COURSE CREATION
**Branch:** `feature/course-creation`  
**Daraja:** O'rta

---

## Nima qilasiz?

O'qituvchi kurs yaratish sahifasini va quiz builder ni API ga ulaysiz. Shuningdek, kursni tahrirlash (edit mode) ni ishlatib tashlaysiz.

---

## Qaysi fayllarni o'zgartirasiz?

1. `src/app/course-creation/components/CourseCreationInteractive.tsx`
2. `src/app/course-creation/components/ContentUploadManager.tsx`
3. `src/app/course-creation/components/QuizBuilder.tsx`
4. `src/app/course-creation/components/SequentialTestBuilder.tsx`

---

## FAYL 1: `src/app/course-creation/components/CourseCreationInteractive.tsx`

Bu faylda ikkita ish bor: **kurs yaratish** va **kurs tahrirlash (edit mode)**.

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const router = useRouter()
const searchParams = useSearchParams()
const editId = searchParams.get('edit') // ?edit=courseId bo'lsa — tahrirlash rejimi

// FORM STATE:
const [formData, setFormData] = useState({
  title: '',
  description: '',
  category: '',
  targetAudience: '',
  subjectCategory: '',
  priceUzs: '0',
  language: 'uz',
  difficultyLevel: 'beginner',
  coverImage: '',
  topics: [] as Array<{ title: string; duration: string; content: string }>,
})
const [isLoading, setIsLoading] = useState(false)
const [isLoadingCourse, setIsLoadingCourse] = useState(false)

// EDIT MODE — mavjud kursni yuklash:
useEffect(() => {
  if (!editId) return
  setIsLoadingCourse(true)
  fetch(`/api/teacher/courses/${editId}`, { credentials: 'include' })
    .then(r => r.json())
    .then(({ course }) => {
      if (course) {
        setFormData({
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          targetAudience: course.targetAudience || '',
          subjectCategory: course.subjectCategory || '',
          priceUzs: course.priceUzs || '0',
          language: course.language || 'uz',
          difficultyLevel: course.difficultyLevel || 'beginner',
          coverImage: course.coverImage || '',
          topics: course.topics?.map((t: any) => ({
            title: t.title,
            duration: t.duration,
            content: t.content || '',
          })) || [],
        })
      }
    })
    .finally(() => setIsLoadingCourse(false))
}, [editId])

// SUBMIT — yaratish yoki yangilash:
const handleSubmit = async () => {
  setIsLoading(true)
  try {
    const method = editId ? 'PATCH' : 'POST'
    const url = editId ? `/api/teacher/courses/${editId}` : '/api/teacher/courses'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData),
    })
    const data = await res.json()

    if (res.ok) {
      router.push('/teacher-dashboard')
    } else {
      alert(data.error || 'Xatolik yuz berdi')
    }
  } finally {
    setIsLoading(false)
  }
}

// PUBLISH:
const handlePublish = async () => {
  if (!editId) return
  await fetch(`/api/teacher/courses/${editId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isPublished: true }),
  })
  router.push('/teacher-dashboard')
}
```

---

## FAYL 2: `src/app/course-creation/components/ContentUploadManager.tsx`

Bu komponent kurs materiallari bilan ishlaydi:

```typescript
// Teacher kurslarini yuklash:
const [courses, setCourses] = useState<any[]>([])

useEffect(() => {
  fetch('/api/teacher/courses', { credentials: 'include' })
    .then(r => r.json())
    .then(({ courses }) => setCourses(courses || []))
}, [])

// Material saqlash:
const saveMaterial = async (material: { courseId: string; title: string; fileUrl: string; fileType: string }) => {
  const res = await fetch('/api/teacher/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(material),
  })
  return res.json()
}
```

---

## FAYL 3: `src/app/course-creation/components/QuizBuilder.tsx`

```typescript
// Testlarni yuklash:
const loadTests = async (courseId: string) => {
  const res = await fetch(`/api/teacher/tests?courseId=${courseId}`, { credentials: 'include' })
  const { tests } = await res.json()
  return tests || []
}

// Test saqlash:
const handleSaveQuiz = async () => {
  if (!courseId || questions.length === 0) {
    alert('Kurs va kamida 1 ta savol kerak')
    return
  }

  const res = await fetch('/api/teacher/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      courseId,
      topicId: selectedTopicId,  // ixtiyoriy
      title: quizTitle,
      questions: questions.map(q => ({
        question: q.text,
        options: q.options,        // ['A variant', 'B variant', 'C variant', 'D variant']
        correctAnswer: q.correct,  // 0, 1, 2, yoki 3
        points: q.points || 1,
      })),
    }),
  })

  const data = await res.json()
  if (res.ok) {
    alert('Test saqlandi!')
  } else {
    alert(data.error)
  }
}
```

---

## FAYL 4: `src/app/course-creation/components/SequentialTestBuilder.tsx`

```typescript
// Teacher kurslarini yuklash:
const [courses, setCourses] = useState<any[]>([])

useEffect(() => {
  fetch('/api/teacher/courses', { credentials: 'include' })
    .then(r => r.json())
    .then(({ courses }) => setCourses(courses || []))
}, [])

// Test yaratish:
const handlePublishTest = async () => {
  const res = await fetch('/api/teacher/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      courseId: selectedCourseId,
      title: testTitle,
      questions: testQuestions,
    }),
  })
  if (res.ok) alert('Test yaratildi!')
}

// Saqlangan testlar:
const [savedTests, setSavedTests] = useState<any[]>([])

const loadSavedTests = async () => {
  const res = await fetch('/api/teacher/tests', { credentials: 'include' })
  const { tests } = await res.json()
  setSavedTests(tests || [])
}
```

---

## TEST QILISH

1. Teacher sifatida login qiling
2. `/course-creation` — forma to'ldirib saqlang → teacher-dashboard da ko'rinsinmi?
3. Teacher-dashboard da "Edit" → `/course-creation?edit=ID` → forma to'liq ma'lumotlar bilan ochilsinmi?
4. QuizBuilder: savol qo'shib "Save" → xatosiz saqlansinmi?

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: course-creation - API ga ulandi, create/edit ishlaydi"
git commit -m "feat: quiz-builder - test saqlash API ga ulandi"
```
