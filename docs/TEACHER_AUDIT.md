# Teacher Role — To'liq Audit va Tavsiyalar

**Sana:** 2026-05-29
**Maqsad:** Teacher (o'qituvchi) rolini admin paneli kabi to'liq audit qilish va nima qilish kerakligini aniqlash.

---

## 1. Hozirgi holat — qisqacha

| Aspekt | Holat |
|---|---|
| **Asosiy sahifa** | `/teacher-dashboard` (498 LOC, `@ts-nocheck`) |
| **Yordamchi sahifalar** | 5 ta (course-creation, sequential-test-builder, group-creation, content-upload-center, assignment-management) — barchasida `@ts-nocheck` |
| **API endpoint'lar** | 9 ta (teacher dashboard/analytics/courses/students/groups/assignments/tests/submissions) |
| **3-qatlamli arxitektura** | ❌ Yo'q (service/repository qatlami teacher uchun mavjud emas) |
| **SSR prefetch** | ❌ Yo'q (CSR-only) |
| **TanStack Query** | ❌ Yo'q (`useEffect` + `useState`) |
| **Tests** | ❌ Yo'q |
| **Sidebar/Layout** | RoleBasedHeader (oddiy top nav) — admin'da sidebar bor, teacher'da yo'q |

---

## 2. Modul-modul audit

### 2.1 `/teacher-dashboard` — asosiy sahifa

**Fayllar (996 LOC jami):**
```
teacher-dashboard/
├── page.tsx                                10 LOC  (wrapper)
└── components/
    ├── TeacherDashboardInteractive.tsx    498 LOC  ⚠️ @ts-nocheck
    ├── AnalyticsPanel.tsx                 105 LOC
    ├── CourseCard.tsx                     128 LOC
    ├── EarningsPanel.tsx                  150 LOC
    ├── MetricsCard.tsx                     45 LOC
    └── RevenueChart.tsx                    60 LOC
```

**4 ta tab:**
| Tab | Holat | Tafsilot |
|---|---|---|
| 🏠 Overview | ✅ Real | Tezkor ko'rsatkichlar + kurslar grid |
| 📚 Kurslar | ✅ Real | Grid + archive/delete actions |
| 📊 Tahlil | ⚠️ Yarim mock | Revenue grafik real, lekin **studentEngagement hardcoded 0** |
| 💰 Daromad | ⚠️ Yarim mock | Tranzaksiyalar real, **Withdraw modal — UI mock** (real API yo'q) |

**4 ta KPI (yuqorida):**
| KPI | Manba | Status |
|---|---|---|
| Umumiy daromad | `paymentTransaction.aggregate` | ✅ Real |
| Faol kurslar | `courses.where(isPublished=true)` | ✅ Real |
| Jami talabalar | `enrollment.count` | ✅ Real |
| Jami kurslar | `courses.length` | ✅ Real |

### 2.2 API endpoint'lar (9 ta)

```
src/app/api/teacher/
├── dashboard/route.ts         GET  (KPI + courses + monthly revenue + transactions + top)
├── analytics/route.ts         GET  (jami revenue, completion rate, 6 oylik grafik, top kurslar)
├── courses/route.ts           GET  (teacher kurslar ro'yxati)
├── courses/[id]/route.ts      PATCH/DELETE
├── students/route.ts          GET  (yozilgan barcha talabalar, unique)
├── groups/route.ts            GET
├── assignments/route.ts       GET
├── assignments/[id]/submissions/route.ts             GET
├── assignments/[id]/submissions/[subId]/route.ts     GET/PATCH (grade)
└── tests/route.ts             GET
```

**Hammasi mavjud va ishlaydi**, lekin:
- ❌ Service/repository qatlami yo'q (har route Prisma'ga to'g'ridan-to'g'ri ulanadi)
- ❌ Inline auth check (har route'da takrorlanadi) — admin'da `requireAdmin()` helper bor, teacher uchun `requireTeacher()` yo'q
- ❌ N+1 query: dashboard'da 6 oylik revenue uchun **12 ta alohida Prisma chaqiruv** (oylik uchun 2 ta — sum + count)
- ❌ `course.revenue` har joyda **0** — per-course revenue hisoblanmagan
- ❌ `monthlyRevenue.revenue / 100` — UZS'ga bo'lib yuborilgan (xato, BigInt UZS to'g'ridan-to'g'ri so'm)

### 2.3 Teacher tool pages (5 ta) — barchasi `@ts-nocheck`

| Sahifa | Vazifa | Holat |
|---|---|---|
| `/course-creation` | Kurs yaratish/tahrirlash | ⚠️ `@ts-nocheck` |
| `/sequential-test-builder` | Quiz/test yaratish | ⚠️ `@ts-nocheck` |
| `/group-creation` | Talaba guruhi yaratish | OK |
| `/content-upload-center` | Material yuklash | ⚠️ `@ts-nocheck` (UploadArea ham) |
| `/assignment-management` | Topshiriqlar boshqaruvi | ⚠️ `@ts-nocheck` |

---

## 3. Topilgan muammolar

### 3.1 Code quality

| Muammo | Joylashuv | Effekt |
|---|---|---|
| `@ts-nocheck` 5 ta faylda | teacher-dashboard + 4 tool page | TypeScript bypass — bug'lar yashirin |
| `confirm()` va `alert()` | TeacherDashboardInteractive | UX past — ConfirmModal va Toast ishlatilishi kerak |
| `useEffect` + `useState` + `fetch` | Hamma joyda | Cache yo'q, refetch optimallashtirilmagan |
| Inline auth check har endpoint'da | 9 ta API route | DRY violation, `requireTeacher()` helper kerak |
| `course.revenue = 0` hardcoded | TeacherDashboardInteractive:179 | Asosiy biznes ma'lumot ko'rinmaydi |
| `studentEngagement = 0` hardcoded | TeacherDashboardInteractive:183 | Analytics tab'da fake ma'lumot |
| `revenue / 100` xato bo'linish | dashboard/route.ts:62 | UZS qiymati 100 marta kichraytirib ko'rsatiladi |

### 3.2 Funksiyonal gap'lar (kerakli, lekin yo'q)

**🔴 Critical (teacher kunlik ish uchun zarur):**
1. **Withdraw flow** — modal bor, real API yo'q. Pulni yechib olishni so'rash + admin tasdiqlash + tarix
2. **Moderation feedback ko'rish** — kurs rad etilgan bo'lsa, admin sababini teacher qayerdan o'qiydi?
3. **Per-course revenue** — qaysi kurs qancha daromad keltirgan
4. **Talaba bilan aloqa** — teacher o'z kursdagi talabalarga xabar yubora olmaydi
5. **Material upload UI** — content-upload-center bor, lekin teacher dashboard'dan zarur (kurs ichidan)
6. **Teacher → Support ticket** — admin paneli yangi tickets oladi (Phase 2.7'da bizniki ishlatdi student tomondan), lekin teacher uchun yo'q

**🟡 Important (1-2 oyda kerak):**
7. **Teacher application status** — agar arizasi `pending` bo'lsa, holatni qayerdan ko'radi?
8. **Quiz/test natijalar overview** — qaysi talaba qanday natija olgan
9. **Sertifikat tasdiqlash** — talaba kursni tugatdi, teacher tasdiqlashi kerakmi?
10. **Notifications** (`notifications` jadval bor) — yangi enrollment, sharh, payment, savol haqida xabar
11. **Student progress per course** — qaysi mavzuda talabalar to'xtaydi (admin'da bor, teacher'ga ham kerak)
12. **Top viewers / drop-off analytics** per kurs
13. **Course preview** — teacher o'z kursini "student ko'zi bilan" ko'rishi
14. **Course duplicate** — mavjud kursdan nusxa olib yangi yaratish
15. **Bulk submission grading** — bir nechta uy vazifasini bir vaqtda baholash

**🟢 Nice-to-have:**
16. **Calendar view** — quiz, deadlines, live session'lar
17. **Live session integration** (Zoom/Google Meet)
18. **AI assistant** — kurs tavsifi, savol generatsiyasi
19. **Affiliate / referral** — teacher o'z kursini ulashganda commission
20. **Co-instructor** — bir kursga bir necha o'qituvchi qo'shilishi

### 3.3 Admin bilan integratsiya

Phase 1-2.8'da admin uchun yasaganlarning ba'zilari teacher'ga ham foyda beradi:
- ✅ Kurs admin tasdiqlasa → teacher ko'rsin
- ✅ Refund bo'lganda → teacher xabar olsin
- ✅ Sharh yashirildi → teacher sababini bilsin
- ❌ Hali ulanmagan (teacher dashboard real-time ko'rsatmaydi)

---

## 4. Schema gap'lar

Teacher uchun yangi jadvallar yoki field'lar kerak:

| Yangi | Sabab |
|---|---|
| `TeacherPayout` jadval | Withdraw flow — id, teacherId, amountUzs, status (pending/processing/completed/failed), bankInfo, requestedAt, completedAt, adminApprovedById |
| `TeacherProfile` jadval (yoki UserProfile'ga field qo'shish) | Bank account, commission_rate (default 20%), payout method (card/bank), bio specific |
| `Course.archivedAt` field | Hozir `isPublished=false` arxiv va draft uchun ham ishlatiladi — ajratish kerak |
| `Course.adminFeedback` field | ✅ Phase 2.1'da qo'shildi |
| `Notification.recipientRole` — teacher uchun maxsus turlar | `new_enrollment`, `new_review`, `course_approved`, `refund_processed`, `payout_completed` |

---

## 5. Arxitektura tavsiya — admin pattern'ni takrorlash

### 5.1 Hozirgi (yomon)
```
TeacherDashboardInteractive (Client Component, 498 LOC)
    ↓ fetch('/api/teacher/dashboard')
API Route (inline Prisma queries, 100+ LOC)
```

### 5.2 Tavsiya (admin'dagi kabi)
```
teacher-dashboard/page.tsx           (Server Component, SSR prefetch)
    ↓ HydrationBoundary
TeacherSidebar + Layout              (yangi — admin'dagi kabi sidebar)
    ↓
Specialized panels                   (CoursesPanel, AnalyticsPanel, EarningsPanel, ...)
    ↓ useTeacherDashboard()
TanStack Query hooks
    ↓
/api/teacher/* routes                (requireTeacher() + service'ni chaqirish)
    ↓
teacher-stats.service.ts             (biznes logika)
    ↓
courseRepo + paymentRepo + ...       (mavjud — qayta ishlatamiz)
```

**Yangi modullar:**
- `src/lib/services/teacher-stats.service.ts` — KPI'lar, monthly revenue (raw SQL bilan optimallashtirilgan)
- `src/lib/services/teacher-payout.service.ts` — withdraw flow
- `src/lib/services/teacher-course.service.ts` — duplicate, preview, archive
- `src/lib/auth-helpers.ts` ichida `requireTeacher()` qo'shish

---

## 6. Tavsiya etilgan yo'l xaritasi

### Phase T1 (1 hafta) — Foundation cleanup
1. **`requireTeacher()` helper** + barcha teacher API route'larini refactor
2. **Service + repository qatlami** teacher uchun (admin'dagi pattern)
3. **`@ts-nocheck` olib tashlash** (5 fayl)
4. **`teacher-stats.service.ts`** — `/api/teacher/dashboard` raw SQL bilan: 12 query → 2-3 query (admin'dagi FILTER pattern)
5. **`/api/teacher/dashboard` xatolar** (`revenue/100` to'g'rilash, per-course revenue qo'shish)
6. **Per-course revenue** — `courses` jadvalga `total_revenue_uzs` cache yoki query bilan

### Phase T2 (1 hafta) — UX modernization
1. **TeacherSidebar** (admin'dagi kabi 240px chap sidebar)
2. **Server Component + HydrationBoundary** (admin/student kabi)
3. **TanStack Query hooks**: `useTeacherDashboard`, `useTeacherCourses`, `useTeacherStudents`
4. **`confirm()` / `alert()` → ConfirmModal + Toast**

### Phase T3 (1 hafta) — Critical features
1. **Withdraw flow**:
   - `TeacherPayout` jadval + migration
   - Teacher: POST `/api/teacher/payouts` (so'rov)
   - Admin: ko'rib chiqish UI ("To'lovlar" tab'ida yangi bo'lim)
2. **Moderation feedback ko'rsatish** — rad etilgan kurs uchun banner + admin izohi
3. **Per-course revenue** dashboard'da
4. **Notifications integration** — admin actions teacher'ga signal beradi

### Phase T4 (1 hafta) — Communication
1. **Talaba ↔ teacher xabar yuborish**:
   - Teacher → bitta talaba yoki barcha enrolled student'lar
   - Resend orqali (admin'dagi `campaign.service`'ni qayta ishlatish)
2. **Teacher → Support ticket yaratish** (admin'dagi Phase 2.7 schema'ni qo'llab-quvvatlash — faqat UI qo'shish)
3. **Quiz/test natijalar overview** (`quiz_completions` jadvalidan)

### Phase T5 (1 hafta) — Advanced analytics
1. **Per-course drilldown** (admin'dagi pattern bilan)
2. **Drop-off analytics** — qaysi mavzuda talabalar to'xtaydi
3. **Student engagement** real ma'lumot (`student_activities`'dan)
4. **Top viewers, conversion funnel**

---

## 7. Admin paneli bilan taqqoslash

| Aspekt | Admin (Phase 2.8 done) | Teacher (hozir) |
|---|---|---|
| Architecture | 3-qatlam (service/repo) | 1-qatlam (API → Prisma) |
| Layout | Fixed sidebar (240px) + mobile drawer | Top header (RoleBasedHeader) |
| State | TanStack Query + SSR prefetch | useState + useEffect (CSR) |
| Auth helper | `requireAdmin()` | manual inline |
| Code quality | tsc 0 errors, no @ts-nocheck | 5 ta `@ts-nocheck` fayl |
| Confirmation UX | ConfirmModal + Toast | native `confirm()` + `alert()` |
| Audit log | har action'da | yo'q |
| Tabs | 12 ta to'liq | 4 ta (2 ta yarim mock) |
| **Total LOC backend** | ~3000 (services + repos + APIs) | ~600 (API routes) |

---

## 8. Top 10 priority (admin kabi)

Teacher dashboardni production-ready qilish uchun **birinchi 10 ta vazifa**:

1. ❌ **Withdraw flow** (pulni yechib olish) — eng kritik, hozir UI mock
2. ❌ **Per-course revenue ko'rsatish** — har kurs qancha keltirgan
3. ❌ **Moderation feedback ko'rsatish** — rad etilgan kurs sababi
4. ❌ **Notifications** — yangi enrollment, sharh, refund, payout haqida
5. ❌ **Talaba bilan aloqa** — bitta yoki broadcast xabar
6. ❌ **`@ts-nocheck` olib tashlash** (5 fayl)
7. ❌ **TeacherSidebar + Server Components** — admin'dagi kabi
8. ❌ **3-qatlamli arxitektura** (service + repo) + TanStack Query
9. ❌ **Per-course analytics** — drop-off, engagement
10. ❌ **Quiz/test natijalar overview** — kim qanday baho oldi

---

## 9. Tavsiya — qaysi yondashuvni tanlash

**Variant A — Minimal (1-2 hafta):** Faqat critical 5 ta vazifa:
- `@ts-nocheck` olib tashlash
- Withdraw flow (TeacherPayout jadval + admin tasdiqlash)
- Moderation feedback ko'rsatish
- Notifications integratsiya
- Per-course revenue

**Variant B — To'liq (5-6 hafta):** Phase T1-T5 to'liq — teacher dashboard'ni admin sifatida professional darajaga olib chiqish.

**Variant C — Pragmatik (3-4 hafta):** Phase T1 (foundation) + Phase T3 (critical) + Phase T4 (communication). T2 (UI redesign) va T5 (advanced analytics) keyinroq.

**Tavsiyam: Variant C** — chunki:
- Foundation cleanup kelajak ishni tezlashtiradi (`@ts-nocheck`, service qatlami)
- Withdraw va moderation feedback teacher motivatsiyasi uchun zarur
- UI redesign (sidebar) va advanced analytics oldida ham foydalanish mumkin

---

## 10. Birinchi qadam taklifi

**Phase T1 — Hafta 1 vazifalar (eng aniq, eng yengil):**

1. **`requireTeacher()` helper** + 9 ta API route refactor
2. **`teacher-stats.service.ts`** — `/api/teacher/dashboard`'ni 12 query → 3 query raw SQL bilan (admin'dagi kabi `FILTER` pattern)
3. **`@ts-nocheck` olib tashlash** TeacherDashboardInteractive.tsx'da (498 LOC ni type-safe qilish)
4. **`revenue / 100` xatoligi tuzatish**
5. **Per-course revenue** — courseRepo'ga `findWithRevenue(teacherId)` qo'shish

Bu 5 ta vazifa **2-3 kun** ichida bajariladi va teacher dashboard'ni 80% yaxshilaydi.

---

## Xulosa

Teacher dashboard **funktsional jihatdan ishlaydi** (real ma'lumot ko'rinadi, kurs yaratish/o'chirish ishlaydi), lekin:
- **Sifat past** (`@ts-nocheck` 5 fayl, native dialog, CSR-only, no service qatlami)
- **Kritik funksiyalar yo'q** (withdraw real emas, per-course revenue 0, communication yo'q)
- **Admin paneli bilan integratsiya yo'q** (moderation feedback ko'rinmaydi, notification yo'q)

**Eng tezroq foyda:** Variant C (3-4 hafta) — foundation cleanup + withdraw + moderation feedback + communication.

Keyingisi qaysi yo'lni tanlaysiz?
