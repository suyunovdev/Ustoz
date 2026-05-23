# EXAM VAZIFA 4 — Counter va LocalStorage

**Daraja:** Boshlang'ich-O'rta  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-4/page.tsx` — o'qish progressini kuzatuvchi sahifa yasang.

### Ko'rinish:
```
      KURS PROGRESSI

  Mavzu 1: Python asoslari      [✅ Tugallandi]
  Mavzu 2: O'zgaruvchilar       [✅ Tugallandi]
  Mavzu 3: Funksiyalar          [▶ Boshlash   ]
  Mavzu 4: Sikllar              [🔒 Qulflangan]
  Mavzu 5: OOP                  [🔒 Qulflangan]

  ████████░░░░░░░░  40% tugallandi

  [ Progressni tozalash ]
```

### Talablar:

1. Kamida **5 ta mavzu** bo'lsin
2. Har bir mavzuda holat: `tugallandi`, `joriy`, `qulflangan`
3. **Qoidasi:** faqat `joriy` mavzuni tugatish mumkin → u `tugallandi` bo'ladi, keyingi `joriy` bo'ladi
4. **Progress bar** — tugallangan foizni ko'rsatadi (masalan: 2/5 = 40%)
5. **"Progressni tozalash"** tugmasi — hammasini boshlang'ich holatga qaytaradi
6. Progress **localStorage** da saqlansin — sahifa yangilanganda ham saqlanib qolsin

---

## Bajarish bosqichlari

1. Mavzular massivini aniqlang (state da)
2. `completedCount` ni hisoblang
3. Progress bar uchun foiz hisoblang
4. "Boshlash" bosganda holatni yangilang
5. `useEffect` bilan localStorage ga saqlang
6. Sahifa yuklanganda localStorage dan o'qing

---

## Minimum kod strukturasi

```typescript
'use client'
import { useState, useEffect } from 'react'

type TopicStatus = 'completed' | 'current' | 'locked'

interface Topic {
  id: number
  title: string
  status: TopicStatus
}

const initialTopics: Topic[] = [
  { id: 1, title: 'Python asoslari', status: 'current' },
  { id: 2, title: "O'zgaruvchilar", status: 'locked' },
  { id: 3, title: 'Funksiyalar', status: 'locked' },
  { id: 4, title: 'Sikllar', status: 'locked' },
  { id: 5, title: 'OOP', status: 'locked' },
]

const STORAGE_KEY = 'exam4_progress'

export default function ExamPage4() {
  const [topics, setTopics] = useState<Topic[]>(() => {
    // localStorage dan yuklash (agar bor bo'lsa)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    }
    return initialTopics
  })

  // localStorage ga saqlash:
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics))
  }, [topics])

  const completeTopic = (id: number) => {
    setTopics(prev => prev.map((t, i) => {
      if (t.id === id && t.status === 'current') {
        return { ...t, status: 'completed' }
      }
      // keyingi mavzuni 'current' qiling...
      return t
    }))
  }

  const reset = () => {
    setTopics(initialTopics)
  }

  const completedCount = topics.filter(t => t.status === 'completed').length
  const progress = Math.round((completedCount / topics.length) * 100)

  return (
    <div>
      {/* mavzular ro'yxati */}
      {/* progress bar */}
      {/* reset tugmasi */}
    </div>
  )
}
```

---

## Tekshirish

- `http://localhost:3000/exam-4`
- "Boshlash" bosganda mavzu tugallandi deb belgilanadi
- Faqat joriy mavzu bosilishi mumkin
- Progress foiz ko'rsatadi
- Sahifa yangilanganda progress saqlanib qoladi
- "Tozalash" bosganda hammasi qayta boshlanadi
