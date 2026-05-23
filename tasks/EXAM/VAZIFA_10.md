# EXAM VAZIFA 10 — To'liq Mini Loyiha

**Daraja:** Yuqori (eng qiyin)  
**Vaqt:** 3 soat

---

## Vazifa

`src/app/exam-10/` — kichik "Kitoblar kutubxonasi" ilovasi yasang.

### Ko'rinish:
```
  📚 KITOBLAR KUTUBXONASI

  [ + Kitob qo'shish ]     [ 🔍 Qidirish... ]

  Hammasi (12)  |  O'qilgan (5)  |  O'qilmoqda (4)  |  Rejada (3)

  ┌──────────────────────────────────────────────────┐
  │ 📖 Clean Code              Robert Martin         │
  │ 🟡 O'qilmoqda              Dasturlash            │
  │                            [✅ Tugallandi] [🗑]  │
  └──────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────┐
  │ 📗 The Pragmatic Programmer  Hunt & Thomas       │
  │ ✅ O'qilgan                  Dasturlash          │
  │                              [🗑]                │
  └──────────────────────────────────────────────────┘

  ── KITOB QO'SHISH MODALI ──
  Nomi:    [ ________________________ ]
  Muallif: [ ________________________ ]
  Janr:    [ Dasturlash ▼            ]
  Holat:   ○ Rejada  ● O'qilmoqda  ○ O'qilgan

                    [Bekor]  [Saqlash]
```

### Talablar:

**1. API yarating:**

`src/app/api/exam/books/route.ts`:
- `GET` — kitoblar ro'yxati
- `POST` — yangi kitob qo'shish

`src/app/api/exam/books/[id]/route.ts`:
- `PATCH` — holat o'zgartirish (`status`)
- `DELETE` — o'chirish

**2. Frontend:**

- Kitoblar ro'yxati API dan yuklash
- **Modal** — "Kitob qo'shish" tugmasi bosganda ochilsin, tashqarisini bossang yopilsin
- **Forma validatsiyasi:** nom va muallif bo'sh bo'lsa yubormaslik
- **Tab filter:** Hammasi / O'qilgan / O'qilmoqda / Rejada — raqam soni ham ko'rinsin
- **Qidiruv:** nom yoki muallif bo'yicha real-time filtrlash
- "Tugallandi" tugmasi — `PATCH` bilan `status: 'completed'` ga o'tkazsin
- O'chirish — `DELETE` + confirm + darhol ro'yxatdan chiqarsin

**3. TypeScript:**
- Barcha interfacelar aniq yozilgan bo'lsin (`any` taqiqlangan)

**4. UX:**
- Yangi kitob qo'shilganda modal yopilsin va ro'yxatga darhol qo'shilsin
- Loading holati bo'lsin

---

## Ma'lumot strukturasi

```typescript
interface Book {
  id: string
  title: string
  author: string
  genre: string
  status: 'planned' | 'reading' | 'completed'
  createdAt: string
}
```

---

## API in-memory saqlash (exam uchun yetarli)

```typescript
// src/app/api/exam/books/route.ts
let books: Book[] = [
  { id: '1', title: 'Clean Code', author: 'Robert Martin', genre: 'Dasturlash', status: 'reading', createdAt: '2026-05-01' },
  { id: '2', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', genre: 'Dasturlash', status: 'completed', createdAt: '2026-04-15' },
  { id: '3', title: 'Atomic Habits', author: 'James Clear', genre: 'Shaxsiy rivojlanish', status: 'planned', createdAt: '2026-05-10' },
]
```

---

## Modal komponenti uchun maslahat

```typescript
// Modal ochish/yopish:
const [isModalOpen, setIsModalOpen] = useState(false)

// Tashqarini bosib yopish:
<div
  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  onClick={() => setIsModalOpen(false)}
>
  <div
    className="bg-white rounded-lg p-6 w-96"
    onClick={e => e.stopPropagation()}  // ichini bossang yopilmasin
  >
    {/* modal content */}
  </div>
</div>
```

---

## Baholash (bu vazifada qo'shimcha)

| Nima | Ball |
|------|------|
| Kod ishlaydi | 40 |
| Barcha funksiyalar to'liq | 30 |
| TypeScript (any yo'q) | 15 |
| UX chiroyli | 15 |

---

## Tekshirish

- `http://localhost:3000/exam-10`
- Modal to'g'ri ochiladi/yopiladi
- Kitob qo'shish ishlaydi
- Tab filter raqamlar bilan ko'rinadi
- Qidiruv ishlaydi
- O'chirish va holat o'zgartirish ishlaydi
- `npx tsc --noEmit` — xato yo'q
