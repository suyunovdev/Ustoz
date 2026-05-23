# EXAM VAZIFA 8 — Test (Quiz) Interfeysi

**Daraja:** O'rta  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-8/page.tsx` — oddiy test (quiz) interfeysi yasang.

### Ko'rinish:
```
  Savol 3 / 5          ⏱ 01:23

  ┌────────────────────────────────────────┐
  │  Python da ro'yxat yaratish uchun      │
  │  qaysi belgi ishlatiladi?              │
  └────────────────────────────────────────┘

  ○  A) { }
  ● B) [ ]       ← tanlangan
  ○  C) ( )
  ○  D) < >

  [ ← Oldingi ]              [ Keyingi → ]

  ━━━━━━━━━━━━━━━━━━━━━░░░░░░  60%

  ── NATIJALAR (5/5 tugaganda) ──

  To'g'ri javoblar: 4 / 5
  Ball: 80 / 100
  Baho: ✅ O'tdingiz!

  [ Qayta boshlash ]
```

### Talablar:

1. `/api/exam/quiz` dan savollar oling
2. Bir vaqtda **1 ta savol** ko'rinsin
3. Savol raqami va jami: `3 / 5`
4. **Taymer:** 30 sekund har savol uchun. Vaqt tugasa → avtomatik keyingi savolga o'tsin
5. Variantni tanlash — ranglanib belgilansin
6. "Keyingi" — keyingi savolga o'tadi. Oxirgi savoldan keyin **natijalar** chiqadi
7. Natijalar: to'g'ri javoblar soni, ball, "O'tdingiz" (60%+) yoki "O'tmadingiz"
8. **"Qayta boshlash"** — hammasi reset bo'ladi, taymer ham

### API:

`src/app/api/exam/quiz/route.ts`:
```typescript
const questions = [
  {
    id: 1,
    question: "Python da ro'yxat yaratish uchun qaysi belgi ishlatiladi?",
    options: ['{ }', '[ ]', '( )', '< >'],
    correct: 1  // index (0 dan boshlanadi)
  },
  {
    id: 2,
    question: "React da state yangilash uchun nima ishlatiladi?",
    options: ['this.state', 'useState', 'setState', 'useReducer'],
    correct: 1
  },
  {
    id: 3,
    question: "CSS da element markazga olish uchun?",
    options: ['float: center', 'margin: center', 'display: flex; justify-content: center', 'align: center'],
    correct: 2
  },
  {
    id: 4,
    question: "JavaScript da massiv uzunligini olish?",
    options: ['.size()', '.length', '.count()', '.total'],
    correct: 1
  },
  {
    id: 5,
    question: "TypeScript da ixtiyoriy parametr qanday belgilanadi?",
    options: ['param?', 'param!', 'param*', 'optional param'],
    correct: 0
  }
]
```

---

## Taymer logikasi

```typescript
const [timeLeft, setTimeLeft] = useState(30)

useEffect(() => {
  if (isFinished) return
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        // Keyingi savolga o'tish
        handleNext()
        return 30  // reset
      }
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(timer)
}, [currentQuestion, isFinished])
```

---

## Minimum kod strukturasi

```typescript
'use client'
import { useState, useEffect } from 'react'

interface Question {
  id: number
  question: string
  options: string[]
  correct: number
}

export default function ExamPage8() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [isFinished, setIsFinished] = useState(false)

  // savollar yuklash...
  // taymer...

  const handleNext = () => {
    const newAnswers = [...answers, selected]
    if (current + 1 >= questions.length) {
      setAnswers(newAnswers)
      setIsFinished(true)
    } else {
      setAnswers(newAnswers)
      setCurrent(c => c + 1)
      setSelected(null)
      setTimeLeft(30)
    }
  }

  const correctCount = answers.filter(
    (a, i) => a === questions[i]?.correct
  ).length

  if (isFinished) {
    // Natijalar...
  }

  return (
    <div>
      {/* savol + variantlar */}
      {/* taymer */}
      {/* progress */}
    </div>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-8`
- Savollar birin-ketin ko'rinadi
- Taymer ishlaydi (30 sekund)
- Vaqt tugasa avtomatik o'tadi
- Oxirida natijalar ko'rinadi
- Qayta boshlash ishlaydi
