# EXAM VAZIFA 9 — Dashboard Sahifasi

**Daraja:** O'rta-Yuqori  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-9/page.tsx` — o'qituvchi mini-dashboard yasang.

### Ko'rinish:
```
  USTOZ DASHBOARD     [ Alisher ▼ ]

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  5        │  │  247     │  │  4.8 ⭐  │  │ 1,250,000│
  │  Kurslar  │  │  Jami    │  │  Reyting │  │  Daromad │
  │           │  │  O'quvchi│  │          │  │  (so'm)  │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘

  MENING KURSLARIM

  [Barchasi] [Faol] [Arxiv]

  ┌─────────────────────────────────────────────────────┐
  │ Python dasturlash      85 o'quvchi  ⭐4.8  [✏ Tahrir]│
  │ Faol                   150 000 so'm       [🗑 O'chir]│
  └─────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────┐
  │ Next.js kursi          42 o'quvchi  ⭐4.5  [✏ Tahrir]│
  │ Arxiv                  Bepul              [🗑 O'chir]│
  └─────────────────────────────────────────────────────┘
```

### Talablar:

1. `/api/exam/dashboard` dan barcha ma'lumotlarni **bitta so'rov** bilan oling
2. **4 ta statistika kartasi:** kurslar soni, jami o'quvchilar, reyting, daromad
3. **Kurslar jadvali** — tab filter: `Barchasi`, `Faol`, `Arxiv`
4. Har kursda: "Tahrir" (hozircha `alert("Tahrirlash: " + kurs.id)`) va "O'chir" tugmalari
5. **"O'chir"** bosganda:
   - `confirm("Haqiqatan o'chirmoqchimisiz?")` — ha bo'lsa
   - `DELETE /api/exam/courses/[id]` yuboring
   - Ro'yxatdan darhol o'chiring
6. Daromadni formatlang: `1250000` → `1 250 000 so'm`
7. **Loading skeleton** — ma'lumot yuklanayotganda kartalar o'rnida kulrang bloklar ko'rinsin

### API:

`src/app/api/exam/dashboard/route.ts`:
```typescript
// GET
{
  "stats": {
    "courseCount": 5,
    "totalStudents": 247,
    "avgRating": 4.8,
    "totalRevenue": 1250000
  },
  "courses": [
    { "id": "1", "title": "Python dasturlash", "students": 85, "rating": 4.8, "price": "150000", "isActive": true },
    { "id": "2", "title": "Next.js kursi", "students": 42, "rating": 4.5, "price": "0", "isActive": false },
    { "id": "3", "title": "JavaScript Pro", "students": 65, "rating": 4.7, "price": "120000", "isActive": true },
    { "id": "4", "title": "React asoslari", "students": 30, "rating": 4.3, "price": "0", "isActive": true },
    { "id": "5", "title": "TypeScript", "students": 25, "rating": 4.6, "price": "180000", "isActive": false }
  ]
}
```

`src/app/api/exam/courses/[id]/route.ts`:
```typescript
// DELETE — { success: true }
```

---

## Loading Skeleton (Tailwind bilan):

```typescript
// Yuklanayotganda ko'rsating:
{isLoading && (
  <div className="grid grid-cols-4 gap-4">
    {[1,2,3,4].map(i => (
      <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
    ))}
  </div>
)}
```

---

## Minimum kod strukturasi

```typescript
'use client'
import { useState, useEffect } from 'react'

interface Course {
  id: string
  title: string
  students: number
  rating: number
  price: string
  isActive: boolean
}

interface DashboardData {
  stats: {
    courseCount: number
    totalStudents: number
    avgRating: number
    totalRevenue: number
  }
  courses: Course[]
}

type TabFilter = 'all' | 'active' | 'archived'

export default function ExamPage9() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('all')

  useEffect(() => {
    fetch('/api/exam/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setIsLoading(false) })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan o'chirmoqchimisiz?")) return
    await fetch(`/api/exam/courses/${id}`, { method: 'DELETE' })
    setData(prev => prev ? {
      ...prev,
      courses: prev.courses.filter(c => c.id !== id)
    } : null)
  }

  const filteredCourses = data?.courses.filter(c => {
    if (tab === 'active') return c.isActive
    if (tab === 'archived') return !c.isActive
    return true
  }) ?? []

  // ...
}
```

---

## Tekshirish

- `http://localhost:3000/exam-9`
- Loading skeleton ko'rinadi, keyin ma'lumotlar
- Statistika kartalar to'g'ri
- Tab filter ishlaydi
- O'chirish confirm so'raydi va ro'yxatdan o'chiradi
