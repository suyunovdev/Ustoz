# EXAM VAZIFA 7 — Multi-Step Forma

**Daraja:** O'rta-Yuqori  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-7/page.tsx` — 3 qadamli kurs yaratish formasini yasang.

### Ko'rinish:
```
  ●━━━━━━━━━━○━━━━━━━━━━○
  1. Asosiy   2. Narx    3. Tasdiqlash

  ── QADAM 1: ASOSIY MA'LUMOTLAR ──

  Kurs nomi:  [ Python dasturlash      ]
  Kategoriya: [ Dasturlash ▼           ]
  Daraja:     ○ Boshlang'ich
              ● O'rta
              ○ Yuqori

                           [ Keyingi → ]

  ── QADAM 2: NARX ──

  Narx turi:  ○ Bepul  ● Pullik
  Narx (so'm): [ 150000               ]
  Chegirma %:  [ 0                    ]

        [ ← Orqaga ]        [ Keyingi → ]

  ── QADAM 3: TASDIQLASH ──

  Kurs nomi:   Python dasturlash
  Kategoriya:  Dasturlash
  Daraja:      O'rta
  Narx:        150 000 so'm

        [ ← Orqaga ]        [ ✅ Saqlash ]

  ✅ Kurs muvaffaqiyatli yaratildi!
```

### Talablar:

1. **3 ta qadam**, progress indicator yuqorida
2. **Qadam 1:**
   - Kurs nomi (required, min 3 belgi)
   - Kategoriya (select: Dasturlash, Dizayn, Biznes, Til o'rganish)
   - Daraja (radio: Boshlang'ich, O'rta, Yuqori)
3. **Qadam 2:**
   - Narx turi (radio: Bepul / Pullik)
   - Pullik tanlansa — narx input chiqsin
   - Chegirma (0–90 oralig'ida)
4. **Qadam 3 — Preview:**
   - Kiritilgan barcha ma'lumotlar ko'rinadi
   - "Saqlash" bosganda `/api/exam/create-course` ga POST
5. **Validatsiya:** har qadamda "Keyingi" bosganda tekshirilsin
6. **"Orqaga"** bosganda oldingi qadamga qaytilsin, ma'lumotlar saqlanib qolsin

### API:

`src/app/api/exam/create-course/route.ts`:
```typescript
// POST — kurs ma'lumotlarini qabul qiladi, { success: true, courseId: 'exam-123' } qaytaradi
```

---

## Bajarish bosqichlari

1. `step` state (`1 | 2 | 3`)
2. `formData` state — barcha qadam ma'lumotlari
3. Har qadam uchun alohida komponent yoki conditional render
4. Progress indicator
5. Validatsiya funksiyasi
6. API ga yuborish

---

## Minimum kod strukturasi

```typescript
'use client'
import { useState } from 'react'

interface CourseForm {
  title: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  isFree: boolean
  price: string
  discount: string
}

export default function ExamPage7() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    category: '',
    level: 'beginner',
    isFree: true,
    price: '0',
    discount: '0',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateForm = (field: keyof CourseForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (formData.title.length < 3) { alert('Kurs nomi kamida 3 belgi'); return false }
    if (!formData.category) { alert('Kategoriya tanlang'); return false }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    setStep(prev => (prev + 1) as 1 | 2 | 3)
  }

  const handleBack = () => {
    setStep(prev => (prev - 1) as 1 | 2 | 3)
  }

  const handleSubmit = async () => {
    const res = await fetch('/api/exam/create-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) setIsSubmitted(true)
  }

  if (isSubmitted) return <div>✅ Kurs muvaffaqiyatli yaratildi!</div>

  return (
    <div>
      {/* progress indicator */}
      {step === 1 && <Step1 formData={formData} updateForm={updateForm} />}
      {step === 2 && <Step2 formData={formData} updateForm={updateForm} />}
      {step === 3 && <Step3 formData={formData} />}
      {/* tugmalar */}
    </div>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-7`
- 3 qadam to'g'ri ishlaydi
- Orqaga bossangiz ma'lumotlar saqlanib qoladi
- Validatsiya ishlaydi
- Saqlash API ga yuboradi va xabar ko'rsatadi
