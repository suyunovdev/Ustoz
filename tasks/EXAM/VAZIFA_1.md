# EXAM VAZIFA 1 — Foydalanuvchi Ro'yxati

**Daraja:** Boshlang'ich-O'rta  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-1/page.tsx` faylini yarating va quyidagi sahifani qiling:

### Ko'rinish:
```
[ Qidirish... ]

┌─────────────────────────────────┐
│ 👤 Alisher Navoiy               │
│ Email: alisher@mail.com         │
│ Rol: teacher                    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 👤 Zulfiya Yusupova             │
│ Email: zulfiya@mail.com         │
│ Rol: student                    │
└─────────────────────────────────┘
...
```

### Talablar:

1. **Sahifa ochilganda** `/api/exam/users` dan foydalanuvchilar ro'yxatini oling
2. Ro'yxatni kartalar ko'rinishida chiqaring (yuqoridagi shaklda)
3. Qidiruv maydoniga yozilganda — foydalanuvchilar ismi bo'yicha **filtrlansin** (API ga so'rov emas, frontendda filtrlash)
4. Loading holati bo'lsin: ma'lumot yuklanayotganda **"Yuklanmoqda..."** matni ko'rinsin
5. Xatolik bo'lsa **"Xatolik yuz berdi"** matni ko'rinsin

### Tayyorlab qo'yilgan API:

```
GET /api/exam/users
```

Javob ko'rinishi:
```json
{
  "users": [
    { "id": "1", "fullName": "Alisher Navoiy", "email": "alisher@mail.com", "role": "teacher" },
    { "id": "2", "fullName": "Zulfiya Yusupova", "email": "zulfiya@mail.com", "role": "student" }
  ]
}
```

> **Eslatma:** Bu API yo'q, siz ham yaratishingiz kerak!  
> `src/app/api/exam/users/route.ts` — mock (qo'lda yozilgan) ma'lumotlar bilan.

---

## Bajarish bosqichlari

1. `src/app/api/exam/users/route.ts` — 5-6 ta mock user qaytaradi
2. `src/app/exam-1/page.tsx` — `'use client'`, `useState`, `useEffect`, `fetch`
3. Qidiruv logikasi — `filter()` bilan
4. CSS/Tailwind bilan chiroyli ko'rinish

---

## Minimum kod strukturasi

```typescript
// src/app/exam-1/page.tsx
'use client'
import { useState, useEffect } from 'react'

export default function ExamPage1() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // useEffect bilan fetch qiling...
  // search bilan filter qiling...

  return (
    <div>
      {/* UI shu yerda */}
    </div>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-1` sahifasi ochiladi
- Foydalanuvchilar ko'rinadi
- Qidiruv ishlaydi
