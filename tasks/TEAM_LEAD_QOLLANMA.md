# TEAM LEAD QO'LLANMASI — ILYOS

---

## 1. LOYIHANI BOSHLASHDAN OLDIN — BIR MARTA BAJARISH

### 1.1 — Bulutli DB sozlash (Railway)

1. `railway.app` ga o'ting → Login/Register
2. **New Project** → **Deploy PostgreSQL**
3. Connect → **Variables** tabidan `DATABASE_URL` ni nusxa oling
4. Shu URL ni barcha talabalar va o'z `.env` ingizga qo'ying

### 1.2 — Migratsiyani ishga tushirish (faqat 1 marta)
```bash
cd /Users/ilyossuyunov/Downloads/ustoz
# .env da DATABASE_URL Railway URL bo'lsin
npx prisma migrate deploy
```

### 1.3 — GitHub repo sozlash
GitHub → `suyunovdev/Ustoz` → Settings → Branches:
- **Branch name:** `main`
- **[x] Require a pull request before merging**
- **[x] Require approvals: 1**
- Save

### 1.4 — `.env` ni talabalar bilan ulashish
Quyidagi qiymatlarni **Telegram** orqali yuboring (faqat ishonchli kanalda):
```
DATABASE_URL=postgresql://... (Railway URL)
JWT_SECRET=ustoz_secret_key_2026_very_long_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_... (agar OTP kerak bo'lsa)
```

---

## 2. TALABALAR BILAN ISHLASH

### Task taqsimlash
| Task | Fayl | Kim |
|------|------|-----|
| TASK_1_AUTH.md | Auth tizimi | Talaba 1 |
| TASK_2_MARKETPLACE.md | Marketplace | Talaba 2 |
| TASK_3_STUDENT.md | Student dashboard | Talaba 3 |
| TASK_4_PAYMENT.md | To'lov tizimi | Talaba 4 |
| TASK_5_COURSE_CREATION.md | Kurs yaratish | Talaba 5 |
| TASK_6_TEACHER_SUPPORT.md | Groups + Upload | Talaba 6 |
| TASK_7_ADMIN.md | Admin panel | Talaba 7 |
| TASK_8_COMMON.md | Notifications | Talaba 8 |

**Har bir talabaga yuboring:** `JAMOA_QOLLANMA.md` + o'z `TASK_N_XXX.md` fayli

### Muhim tartib
**Task 1 (Auth) birinchi tugashi kerak** — boshqa barcha tasklar `useAuth()` ga bog'liq.  
Task 1 tugaguncha talabalar `useAuth` o'rniga vaqtinchalik `useState(null)` ishlatib ishlashlari mumkin.

---

## 3. PR REVIEW JARAYONI

PR kelganda tekshirish tartibi:

### 3.1 — GitHub'da diff ko'rish
`Files changed` tabida o'zgarishlarni ko'ring.

### 3.2 — Tekshirish ro'yxati

**❌ Rad etish (qayta yuborish) sabablari:**
```
- createClient yoki supabase. importi qolgan
- NextResponse.json() ishlatilgan (jsonResponse() kerak)
- .env fayli commit qilingan
- Boshqa task fayllariga tegilgan
- npm run dev ishlamayapti (talabadan screenshot so'rang)
```

**✅ Qabul qilish shartlari:**
```
- Supabase import yo'q
- jsonResponse() ishlatilgan
- API chaqiruvlar ishlaydi
- Sahifa brauzerda ochiladi
```

### 3.3 — PR ni review qilish
```
GitHub → PR → Review changes → 
  - Approve (qabul) yoki
  - Request changes (qayta yuboring, nima xato ekanini yozing)
```

### 3.4 — Merge qilish
```
Approve qilingandan keyin:
"Squash and merge" → confirm
Branch'ni o'chirish → "Delete branch"
```

---

## 4. KUNLIK KUZATUV

### Har kuni tekshirish:
```bash
git log --oneline --all --graph   # Barcha branch'lar holati
```

GitHub → Insights → Network graph — kim nima qilganini vizual ko'rish

### Agar talaba bloklanib qolsa:
1. Qanday xato ekanini so'rang (screenshot)
2. Bu qo'llanmaning "Ko'p uchraydigan xatolar" bo'limiga yo'naltiring
3. Kerak bo'lsa o'zingiz tushuntiring yoki kodni to'g'rilang

---

## 5. MERGE TARTIBI (Ketma-ketlik muhim!)

```
1. TASK 1 (Auth)             ← Birinchi merge — boshqalar bunga bog'liq
2. TASK 8 (Common)           ← NotificationBell, Landing
3. TASK 2 (Marketplace)      ← Kurs sahifalari
4. TASK 3 (Student)          ← Student dashboard
5. TASK 5 (Course Creation)  ← Teacher kurs yaratish
6. TASK 6 (Teacher Support)  ← Groups, Upload
7. TASK 7 (Admin)            ← Admin panel
8. TASK 4 (Payment)          ← To'lov (eng murakkab, oxirida)
```

---

## 6. TOPSHIRISH UCHUN TAYYORLASH

### 6.1 — Deploy qilish (Vercel)
```bash
# Vercel CLI o'rnatish:
npm i -g vercel

# Deploy:
vercel

# Environment variables Vercel dashboard da qo'shing:
# DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, ...
```

### 6.2 — Demo uchun test ma'lumotlar
```sql
-- Admin yaratish (Railway console da):
UPDATE user_profiles SET role = 'admin' WHERE user_id = '...';
UPDATE user_profiles SET role = 'teacher' WHERE user_id = '...';
```

### 6.3 — README.md yangilash
```markdown
## Ishga tushirish
npm install
npx prisma generate
npm run dev

## Stack
- Next.js 15
- PostgreSQL + Prisma 7
- JWT Authentication
- Tailwind CSS
```

---

## 7. DEADLINE NAZORAT

| Hafta | Maqsad |
|-------|--------|
| 1-hafta | Task 1 (Auth) + Task 8 (Common) tugaydi |
| 2-hafta | Task 2, 3, 5 tugaydi |
| 3-hafta | Task 4, 6, 7 tugaydi |
| 4-hafta | Testing, bug fix, deploy |

---

## 8. MUAMMO BO'LSA

### Talaba "merge conflict" desa:
```bash
# Talabaga aytasiz:
git checkout main
git pull origin main
git checkout feature/o'z-branch
git merge main
# Conflictlarni hal qiling
git add .
git commit -m "fix: merge conflicts hal qilindi"
git push
```

### DB xatosi bo'lsa:
```bash
# Railway console da yoki o'z terminalda:
npx prisma migrate deploy
npx prisma generate
```

### Biror task juda kechiksa:
- O'sha taskni o'zingiz qiling yoki 2 talabaga bo'ling
- PR review ni tezlashtiring

---

*Omad!*
