# EXAM VAZIFA 6 — API Route + TypeScript

**Daraja:** O'rta-Yuqori  
**Vaqt:** 3 soat

---

## Vazifa

Kurs statistika API va uni ko'rsatuvchi sahifa yasang.

### Ko'rinish:
```
        KURS STATISTIKASI

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  247          │  │  4.8 ⭐      │  │  89%         │
  │  O'quvchilar  │  │  Reyting     │  │  Yakunlagan  │
  └──────────────┘  └──────────────┘  └──────────────┘

  Oylik o'quvchilar:
  Yan ████████ 40
  Feb ██████   30
  Mar ██████████ 50
  Apr ████████████ 60
  May ██████████████ 67

  So'nggi o'quvchilar:
  • Alisher Navoiy    — 2 kun oldin
  • Zulfiya Yusupova  — 5 kun oldin
  • Bobur Mirzo       — 1 hafta oldin
```

### Talablar:

**API (`src/app/api/exam/stats/route.ts`):**
```typescript
// GET /api/exam/stats
// Response:
{
  "stats": {
    "totalStudents": 247,
    "rating": 4.8,
    "completionRate": 89,
    "monthlyData": [
      { "month": "Yanvar", "count": 40 },
      { "month": "Fevral", "count": 30 },
      { "month": "Mart", "count": 50 },
      { "month": "Aprel", "count": 60 },
      { "month": "May", "count": 67 }
    ],
    "recentStudents": [
      { "name": "Alisher Navoiy", "joinedAgo": "2 kun oldin" },
      { "name": "Zulfiya Yusupova", "joinedAgo": "5 kun oldin" },
      { "name": "Bobur Mirzo", "joinedAgo": "1 hafta oldin" }
    ]
  }
}
```

**Frontend (`src/app/exam-6/page.tsx`):**
1. API dan statistikani oling
2. **3 ta statistika karti** (o'quvchilar, reyting, yakunlagan %)
3. **Gorizontal bar chart** — CSS width bilan (kutubxonasiz!)
   - Eng katta qiymat = 100% kenglik
   - Boshqalar nisbatan hisoblang
4. **So'nggi o'quvchilar** ro'yxati
5. **TypeScript Interface** yozing (any ishlatmang!)

---

## Muhim: TypeScript Interface yozish shart

```typescript
// any ishlatish taqiqlangan!
// Barcha tiplari aniq bo'lsin:

interface MonthlyData {
  month: string
  count: number
}

interface Stats {
  totalStudents: number
  rating: number
  completionRate: number
  monthlyData: MonthlyData[]
  recentStudents: Array<{ name: string; joinedAgo: string }>
}
```

---

## Bar chart CSS bilan (kutubxonasiz):

```typescript
// Eng katta qiymatni topib, nisbat hisoblash:
const maxCount = Math.max(...stats.monthlyData.map(d => d.count))

// Har bir bar uchun:
<div
  style={{ width: `${(item.count / maxCount) * 100}%` }}
  className="bg-blue-500 h-6 rounded"
/>
```

---

## Tekshirish

- `http://localhost:3000/exam-6`
- 3 ta statistika kartasi ko'rinadi
- Bar chart to'g'ri nisbatda ko'rsatadi
- TypeScript xatosi yo'q (`npx tsc --noEmit`)
