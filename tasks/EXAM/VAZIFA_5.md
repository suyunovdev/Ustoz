# EXAM VAZIFA 5 — CRUD: Sharhlar

**Daraja:** O'rta  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-5/page.tsx` — kursga sharh yozish va o'chirish sahifasi yasang.

### Ko'rinish:
```
KURS SHARHLARI  (3 ta sharh)

┌─────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐  Alisher N.         [🗑 O'chir] │
│ "Juda yaxshi kurs, ko'p narsani         │
│  o'rgandim!"                            │
│ 2026-05-21                              │
└─────────────────────────────────────────┘

Reyting:  ⭐ ⭐ ⭐ ⭐ ☆  (4 tanlangan)
Sharh:    [ Fikringizni yozing...        ]

                          [ Sharh qo'shish ]
```

### Talablar:

1. Mavjud sharhlarni `/api/exam/reviews` GET dan oling
2. Yulduzcha reyting tanlash (1–5, bosib tanlanadi)
3. Matn kiritish maydoni
4. **"Sharh qo'shish"** bosganda `/api/exam/reviews` ga POST yuboring
5. Yangi sharh ro'yxatga **darhol qo'shilsin** (sahifani yangilamasdan)
6. **"O'chir"** tugmasi bosganda `/api/exam/reviews/[id]` ga DELETE yuboring → ro'yxatdan o'chsin
7. Validatsiya: reyting tanlanmagan yoki matn bo'sh bo'lsa — yubormaslik

### API yarating:

**`src/app/api/exam/reviews/route.ts`:**
```typescript
// In-memory saqlash (server restart da tozalanadi — bu exam uchun yetarli)
let reviews = [
  { id: '1', rating: 5, comment: 'Juda yaxshi kurs!', author: 'Alisher N.', createdAt: '2026-05-21' },
  { id: '2', rating: 4, comment: 'Foydali, lekin ba\'zi mavzular qisqa', author: 'Zulfiya Y.', createdAt: '2026-05-20' },
]

// GET — ro'yxat
// POST — yangi sharh qo'shish (body: { rating, comment, author })
```

**`src/app/api/exam/reviews/[id]/route.ts`:**
```typescript
// DELETE — o'chirish
```

---

## Bajarish bosqichlari

1. `GET /api/exam/reviews` — mock data qaytaradi
2. `POST /api/exam/reviews` — yangi sharh qo'shadi
3. `DELETE /api/exam/reviews/[id]` — o'chiradi
4. Frontend: sharhlar ro'yxati
5. Yulduzcha tanlash komponenti
6. Forma + submit logikasi
7. O'chirish logikasi

---

## Minimum kod strukturasi

```typescript
'use client'
import { useState, useEffect } from 'react'

interface Review {
  id: string
  rating: number
  comment: string
  author: string
  createdAt: string
}

export default function ExamPage5() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // GET sharhlar
  useEffect(() => {
    fetch('/api/exam/reviews')
      .then(r => r.json())
      .then(({ reviews }) => { setReviews(reviews); setIsLoading(false) })
  }, [])

  // POST — yangi sharh
  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) return
    setIsSubmitting(true)
    const res = await fetch('/api/exam/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment, author: 'Siz' }),
    })
    const { review } = await res.json()
    setReviews(prev => [review, ...prev])  // darhol qo'shish
    setRating(0)
    setComment('')
    setIsSubmitting(false)
  }

  // DELETE
  const handleDelete = async (id: string) => {
    await fetch(`/api/exam/reviews/${id}`, { method: 'DELETE' })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      {/* sharhlar ro'yxati */}
      {/* yulduzcha tanlash */}
      {/* textarea */}
      {/* submit tugmasi */}
    </div>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-5`
- Mavjud sharhlar ko'rinadi
- Yangi sharh qo'shiladi (sahifani yangilamasdan)
- O'chirish ishlaydi
- Bo'sh yuborilmaydi
