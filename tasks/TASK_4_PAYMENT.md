# TASK 4 — PAYMENT SYSTEM
**Branch:** `feature/payment-system`  
**Daraja:** O'rta-Qiyin (to'lov logikasi murakkab)

---

## Nima qilasiz?

To'lov tizimi (Click, Payme) va to'lov sahifalarini Supabase dan yangi auth + Prisma ga o'tasiz.

---

## Qaysi fayllarni o'zgartirasiz?

**Frontend:**
1. `src/app/payment-method-selection/components/PaymentMethodSelectionInteractive.tsx`
2. `src/app/payment-processing/components/PaymentProcessingInteractive.tsx`
3. `src/app/payment-success-confirmation/components/PaymentSuccessInteractive.tsx`
4. `src/app/transaction-history/components/TransactionHistoryInteractive.tsx`

**API:**
5. `src/app/api/payment/initiate/route.ts`
6. `src/app/api/payment/click/prepare/route.ts`
7. `src/app/api/payment/click/complete/route.ts`
8. `src/app/api/payment/payme/route.ts`

---

## API ROUTE'LARDA ASOSIY O'ZGARISH

Har bir payment API route'ni oching. Quyidagi pattern bo'yicha o'zgartiring:

### O'chirish kerak (Supabase):
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: '...' }, { status: 401 })
```

### Yozish kerak (JWT):
```typescript
import { getSessionFromRequest } from '@/lib/auth'
import { jsonResponse } from '@/lib/json'

const session = await getSessionFromRequest(req)
if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 })
// Eski: user.id → Yangi: session.sub
```

---

## FAYL 5: `src/app/api/payment/initiate/route.ts`

To'lov boshlash API. Asosiy o'zgarish pattern:

```typescript
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 })

  const { courseId, provider } = await req.json()

  // Kursni tekshirish
  const course = await prisma.course.findFirst({
    where: { id: courseId, isPublished: true },
  })
  if (!course) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 })

  // Allaqachon enrolled ekanini tekshirish
  const existing = await prisma.enrollment.findFirst({
    where: { studentId: session.sub, courseId },
  })
  if (existing) return jsonResponse({ error: 'Allaqachon yozilgansiz' }, { status: 400 })

  // To'lov tranzaksiyasi yaratish
  const transaction = await prisma.paymentTransaction.create({
    data: {
      studentId: session.sub,
      courseId,
      amount: course.priceUzs,    // Bu allaqachon BigInt
      provider: provider || 'click',
      status: 'pending',
    },
  })

  return jsonResponse({ transaction: { ...transaction, amount: transaction.amount.toString() } }, { status: 201 })
}
```

---

## FAYL 6 va 7: Click API Routes

Click API route'larida ham xuddi shu pattern:
- `supabase.auth.getUser()` → `getSessionFromRequest(req)`
- `user.id` → `session.sub`
- `NextResponse.json()` → `jsonResponse()`
- `supabase.from(...).update()` → `prisma.paymentTransaction.update(...)`

```typescript
// Misol: to'lov holatini yangilash
await prisma.paymentTransaction.update({
  where: { id: transactionId },
  data: { status: 'completed' },
})

// Enrollment yaratish (to'lov muvaffaqiyatli bo'lganda):
await prisma.enrollment.create({
  data: { studentId: session.sub, courseId },
})
```

---

## FAYL 8: `src/app/api/payment/payme/route.ts`

Payme webhook route'da session kerak emas (webhook Payme serveridan keladi):

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

// Payme webhook — faqat Prisma ga o'tkazing, Supabase ni o'chiring
// supabase.from(...) → prisma...
```

---

## FRONTEND KOMPONENTLAR

To'lov sahifalarida Supabase o'rniga `useAuth` dan foydalaning:

```typescript
import { useAuth } from '@/contexts/AuthContext'
const { user } = useAuth()

// supabase.auth.getUser() o'rniga:
// user.id → mavjud
```

**TransactionHistoryInteractive.tsx** — tranzaksiyalar tarixi:
```typescript
const [transactions, setTransactions] = useState<any[]>([])

useEffect(() => {
  fetch('/api/payment/history', { credentials: 'include' })
    .then(r => r.json())
    .then(({ transactions }) => setTransactions(transactions || []))
}, [])
```

Agar `/api/payment/history` yo'q bo'lsa, yangi fayl yarating:
```typescript
// src/app/api/payment/history/route.ts
import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 })

  const transactions = await prisma.paymentTransaction.findMany({
    where: { studentId: session.sub },
    include: { course: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return jsonResponse({
    transactions: transactions.map(t => ({
      ...t,
      amount: t.amount.toString(),
    })),
  })
}
```

---

## MUHIM ESLATMA — BigInt

To'lov summasi (`amount`, `priceUzs`) ma'lumot bazasida `BigInt` tipida.

```typescript
// DB ga yozishda:
amount: BigInt(150000)   // yoki course.priceUzs (allaqachon BigInt)

// Javob qaytarishda — jsonResponse() ishlatilsa avtomatik string bo'ladi
// Lekin manual qilishingiz kerak bo'lsa:
amount: transaction.amount.toString()
```

---

## TEST QILISH

1. `/payment-method-selection?courseId=XXX` — sahifa ochilsinmi?
2. To'lov initiate: `POST /api/payment/initiate` — tranzaksiya yaratilsinmi?
3. `/transaction-history` — tranzaksiyalar ro'yxati ko'rinsinmi?
4. `/api/payment/history` — JSON javob kelsinmi?

---

## COMMIT NAMUNASI

```bash
git commit -m "feat: payment - initiate API Prisma + JWT ga o'tkazildi"
git commit -m "feat: payment - click routes o'zgartirildi"
git commit -m "feat: payment - transaction history API yaratildi"
```
