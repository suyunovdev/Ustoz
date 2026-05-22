# USTOZ LOYIHASI — TALABALAR UCHUN QO'LLANMA

> Bu qo'llanmani **oxirigacha o'qing**, keyin ishni boshlang.

---

## LOYIHA HAQIDA

**Ustoz** — O'zbek tilidagi online ta'lim platformasi.  
**Stack:** Next.js 15, PostgreSQL, Prisma, JWT auth  
**GitHub:** `https://github.com/suyunovdev/Ustoz.git`

**Vazifangiz:** Frontend komponentlardagi eski Supabase kodlarini yangi API ga ulash.

Backend (server qismi) allaqachon tayyor — siz faqat frontend ni shu API ga ulaysiz.

---

## 1. LOYIHANI O'RNATISH

### Qadam 1 — Reponi oling
```bash
git clone https://github.com/suyunovdev/Ustoz.git
cd Ustoz
```

### Qadam 2 — `.env` faylini yarating
```bash
cp .env.example .env
```
Keyin `.env` ni oching va team lead bergan qiymatlarni yozing. Asosiy keraklilar:
```
DATABASE_URL=postgresql://...   ← team lead beradi
JWT_SECRET=...                  ← team lead beradi
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Muhim:** `.env` faylni hech qachon GitHub'ga push qilmang!

### Qadam 3 — O'rnatish va ishga tushirish
```bash
npm install
npx prisma generate
npm run dev
```

`http://localhost:3000` brauzerda ochilishi kerak.

---

## 2. O'Z BRANCH'INGIZNI YARATING

```bash
git checkout main
git pull origin main
git checkout -b feature/SIZNING-TASK-NOMI
```

**Qaysi branch siz uchun** — team lead aytadi (yoki task faylida yozilgan).

---

## 3. ASOSIY BILIM — SUPABASE O'RNIGA NIMA ISHLATILADI

### Eski kod (O'CHIRISH KERAK):
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data } = await supabase.from('courses').select('*')
```

### Yangi kod (SHU TARZDA YOZISH KERAK):
```typescript
// Frontend (komponentlarda):
const res = await fetch('/api/courses')
const { courses } = await res.json()

// API route'larda (server):
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsonResponse } from '@/lib/json'

const session = await getSessionFromRequest(req)
// session.sub  → foydalanuvchi ID si
// session.role → 'student' | 'teacher' | 'admin'
```

### Eng muhim qoida — `jsonResponse()` ishlatish:
```typescript
// NOTO'G'RI (xato beradi):
return NextResponse.json({ courses })

// TO'G'RI:
import { jsonResponse } from '@/lib/json'
return jsonResponse({ courses })
```

---

## 4. ISHNI BAJARISH TARTIBI

1. O'z task faylingizni oching (`TASK_1.md`, `TASK_2.md` ...)
2. Unda berilgan fayllarni VSCode da oching
3. Har bir faylda `createClient` yoki `supabase` so'zini qidiring
4. Ko'rsatmalarga qarab o'zgartiring
5. Brauzerda tekshiring — ishlayaptimi?
6. Commit qiling

---

## 5. COMMIT VA PUSH

```bash
git add .
git commit -m "feat: auth - LoginForm API ga ulandi"
git push origin feature/BRANCH-NOMI
```

**Commit xabar shakli:** `feat: [task] - nima qilindi`

---

## 6. PULL REQUEST OCHISH

Task tugaganda:
1. `https://github.com/suyunovdev/Ustoz` ga o'ting
2. **"Compare & pull request"** tugmasini bosing
3. Title: `[TASK-N] Nima qilindi`
4. Description da nima o'zgarganini yozing + test qilganingizni belgilang
5. **"Create pull request"** bosing

---

## 7. KO'P UCHRAYDIGAN XATOLAR

**Xato:** `TypeError: Do not know how to serialize a BigInt`  
**Yechim:** `NextResponse.json()` o'rniga `jsonResponse()` ishlatish

**Xato:** `Cannot find module '@/generated/prisma/client'`  
**Yechim:** `npx prisma generate` buyrug'ini ishga tushiring

**Xato:** `useAuth must be used within AuthProvider`  
**Yechim:** Task 1 (Auth) tugaguncha bu xato bo'lishi mumkin — hozircha vaqtinchalik `useState(null)` ishlatib turing

**Xato:** `createClient is not a function`  
**Yechim:** Faylda Supabase import qolgan — hammasini o'chiring

---

## 8. PR OCHISHDAN OLDIN TEKSHIRISH

- [ ] `npm run dev` xatosiz ishga tushadi
- [ ] O'z task sahifasi brauzerda ko'rinadi va ishlaydi
- [ ] Faylda `createClient` yoki `supabase` so'zi qolmagan
- [ ] `jsonResponse()` ishlatilgan

---

## 9. MUROJAAT

Muammo bo'lsa:
1. Bu qo'llanmani qayta o'qing
2. Xato xabarini Google'da qidiring
3. Team lead'ga yozing: **xato screenshot + qaysi fayl**

---

*Har bir talabaning batafsil task ko'rsatmasi: `TASK_1.md` ... `TASK_8.md` fayllarida*
