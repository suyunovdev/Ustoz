# EXAM VAZIFA 2 — Login Forma

**Daraja:** O'rta  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-2/page.tsx` faylini yarating — oddiy login forma yasang.

### Ko'rinish:
```
         USTOZ GA KIRISH

  Email:    [ example@mail.com ]
  Parol:    [ ••••••••         ]

            [ KIRISH ]

  ❌ Email yoki parol noto'g'ri    ← xato bo'lsa
  ✅ Muvaffaqiyatli kirdingiz!     ← to'g'ri bo'lsa
```

### Talablar:

1. **Email va parol** input maydonlari bo'lsin
2. **Validatsiya** (yuborish tugmasiga bosishdan oldin):
   - Email bo'sh bo'lsa: `"Email kiriting"`
   - Email `@` belgisi yo'q bo'lsa: `"Email noto'g'ri"`
   - Parol 6 belgidan kam bo'lsa: `"Parol kamida 6 ta belgi"`
3. Forma yuborilganda `/api/exam/login` ga **POST** so'rov yuboring
4. API `{ success: true }` qaytarsa → yashil xabar: `"Muvaffaqiyatli kirdingiz!"`
5. API `{ success: false, error: "..." }` qaytarsa → qizil xabar ko'rinsin
6. Yuborilayotganda tugma **"Yuklanmoqda..."** deb o'zgarsin va disabled bo'lsin

### Tayyorlab qo'yilgan API:

```
POST /api/exam/login
Body: { "email": "...", "password": "..." }
```

Siz ham bu API ni yaratasiz: `src/app/api/exam/login/route.ts`

Logika:
- email: `admin@ustoz.uz`, parol: `123456` → `{ success: true }`
- boshqasi → `{ success: false, error: "Email yoki parol noto'g'ri" }`

---

## Bajarish bosqichlari

1. `src/app/api/exam/login/route.ts` — POST handler
2. `src/app/exam-2/page.tsx` — forma komponenti
3. Validatsiya logikasi
4. fetch bilan API ga so'rov
5. Natijani ko'rsatish

---

## Minimum kod strukturasi

```typescript
// src/app/exam-2/page.tsx
'use client'
import { useState } from 'react'

export default function ExamPage2() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    // validatsiya qiling...
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // fetch qiling...
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* forma shu yerda */}
    </form>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-2`
- Bo'sh yuborilsa — xatolar chiqadi
- `admin@ustoz.uz` / `123456` → muvaffaqiyat xabari
- Boshqa ma'lumot → xato xabari
