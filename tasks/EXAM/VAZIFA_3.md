# EXAM VAZIFA 3 — Kurs Kartalar

**Daraja:** O'rta  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-3/page.tsx` — kurslar marketplace mini versiyasini yasang.

### Ko'rinish:
```
KURSLAR   [ Bepul | Pullik | Barchasi ]

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [rasm]       │  │ [rasm]       │  │ [rasm]       │
│ Python       │  │ Next.js      │  │ Dizayn       │
│ ⭐ 4.8       │  │ ⭐ 4.5       │  │ ⭐ 4.9       │
│ 120 o'quvchi │  │ 85 o'quvchi  │  │ 200 o'quvchi │
│ 150 000 so'm │  │ Bepul        │  │ 200 000 so'm │
│ [Ko'rish]    │  │ [Ko'rish]    │  │ [Ko'rish]    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Talablar:

1. `/api/exam/courses` dan kurslar ro'yxatini oling
2. Grid ko'rinishida (3 ta karta qatorda) ko'rsating
3. Yuqorida **filter tugmalari**: `Barchasi`, `Bepul`, `Pullik`
   - Tugmaga bosganda shu kurslar filtrlansin (frontend da)
4. Har bir kartada: rasm, nom, reyting (⭐), o'quvchilar soni, narx
5. Narx `0` bo'lsa — `"Bepul"` deb ko'rsating, boshqalarda `"XXX 000 so'm"`
6. Loading va error holatlari bo'lsin

### API yarating:

`src/app/api/exam/courses/route.ts` — kamida 6 ta mock kurs:

```typescript
const courses = [
  { id: '1', title: 'Python dasturlash', rating: 4.8, enrollments: 120, priceUzs: '150000', coverImage: null },
  { id: '2', title: 'Next.js', rating: 4.5, enrollments: 85, priceUzs: '0', coverImage: null },
  { id: '3', title: 'Dizayn asoslari', rating: 4.9, enrollments: 200, priceUzs: '200000', coverImage: null },
  { id: '4', title: 'JavaScript', rating: 4.7, enrollments: 310, priceUzs: '0', coverImage: null },
  { id: '5', title: 'React', rating: 4.6, enrollments: 175, priceUzs: '120000', coverImage: null },
  { id: '6', title: 'TypeScript', rating: 4.4, enrollments: 95, priceUzs: '180000', coverImage: null },
]
```

---

## Bajarish bosqichlari

1. `src/app/api/exam/courses/route.ts` — GET, mock data qaytaradi
2. `src/app/exam-3/page.tsx` — asosiy sahifa
3. `fetch` bilan kurslar olish
4. Filter tugmalari logikasi (`filter()` bilan)
5. Karta komponenti (alohida yoki inline)
6. Narxni formatlash funksiyasi

---

## Minimum kod strukturasi

```typescript
'use client'
import { useState, useEffect } from 'react'

type Course = {
  id: string
  title: string
  rating: number
  enrollments: number
  priceUzs: string
  coverImage: string | null
}

type FilterType = 'all' | 'free' | 'paid'

export default function ExamPage3() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)

  // fetch kurslar...

  const filtered = courses.filter(c => {
    if (filter === 'free') return c.priceUzs === '0'
    if (filter === 'paid') return c.priceUzs !== '0'
    return true
  })

  return (
    <div>
      {/* filter tugmalari */}
      {/* kurslar grid */}
    </div>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-3`
- 6 ta kurs ko'rinadi
- "Bepul" bosganda faqat bepul kurslar
- "Pullik" bosganda faqat pullik kurslar
- Narxlar to'g'ri formatda
