# Ustoz Loyihasi va Admin Panel — Strategik Tahlil va Yo'l Xaritasi

**Sana:** 2026-05-28
**Maqsad:** Senior dasturchilar va AI'lar bilan maslahatlashish uchun loyiha holati va admin panel kelajak funksionali bo'yicha to'liq brifing.

---

## 1. Loyiha umumiy holati

### Tech stack (production-grade)
| Qatlam | Texnologiya | Holat |
|---|---|---|
| Framework | Next.js 15 (App Router) | ✅ Turbopack (4s startup) |
| UI | React 19 + Tailwind 3.4 + Heroicons | ✅ Dark mode |
| Database | PostgreSQL 15 + Prisma 7.8 | ✅ 27 ta jadval |
| Auth | JWT (jose) + bcrypt | ✅ 3 ta rol |
| State | TanStack Query v5 | ✅ SSR prefetch |
| Charts | Recharts | ⚠️ Faqat mock data |
| Payments | Click, Payme | ⚠️ Schema bor, integratsiya yarim |
| Email | Resend (OTP) | ✅ |
| Testing | Vitest + RTL | ✅ 39 + 15 testlar |

### Modul holati
| Modul | Status | Tafsilot |
|---|---|---|
| 🟢 Auth (login/register/OTP/reset) | Production-ready | JWT, rate limit kerak |
| 🟢 Student dashboard | Production-ready | SSR, real-time progress |
| 🟡 Teacher dashboard | Yarim | Assignments + courses bor, analytics kerak |
| 🟡 Admin dashboard | Phase 1 done | User management + stats real, qolgan 5 ta tab mock |
| 🟡 Course marketplace | Funktsional | Filter, search, kategoriya |
| 🟡 Learning interface | Funktsional | Topic completion, certificate |
| 🟡 Quiz interface | Funktsional | Sequential test |
| 🔴 Payments | Schema bor, flow yo'q | Click/Payme webhook'lar |
| 🔴 Notifications | Schema bor, UI mavjud | Real push yo'q |
| 🔴 Content moderation | Schema bor | UI mock |
| 🔴 Customer support | Yo'q | — |
| 🔴 Marketing tools | Yo'q | Coupon, campaigns |

### DB jadvallari (27 ta) — guruhlangan
```
👤 Foydalanuvchilar:    users, user_profiles, otp_codes
🎓 Kurslar:             courses, categories, course_topics, course_tests, test_questions
📚 O'qish jarayoni:     enrollments, topic_completions, quiz_completions, student_activities
📜 Sertifikatlar:       certificates
👥 Guruhlar:            groups, group_members
📝 Topshiriqlar:        assignments, assignment_submissions
🎬 Kontent:             content_materials, course_materials, external_links
🛡  Moderatsiya:        moderation_queue, moderation_history
⭐ Sharhlar:            course_reviews
💰 To'lovlar:           payment_transactions
🔔 Xabarnomalar:        notifications
📊 Audit:               audit_logs
```

### Performance baseline (Phase 1.1 keyin)
| Metric | Qiymat |
|---|---|
| Dev startup | 4s (Turbopack) |
| `/api/admin/stats` warm | 20-25ms |
| `/admin-dashboard` HTML | 25-42ms |
| Test suite | 39 ta test, 84-100% coverage |

---

## 2. Admin Panel — Hozirgi holat (Phase 1 yakuni)

### ✅ Ishlaydi
| Komponent | Tafsilot |
|---|---|
| Sidebar layout | 240px desktop fixed + mobile drawer |
| Auth guard | Middleware + RSC redirect |
| **Real KPI** | Total users, role breakdown, courses, revenue, growth % |
| **Real user list** | Filter, debounced search, pagination, status |
| Suspend/Activate | Audit log + transaction |
| Role change | Self-action block + last admin protection |
| Audit log (DB) | IP + User-Agent + metadata |
| ConfirmModal | Esc, backdrop, danger variant |
| Toast notifications | Pure React |

### ⚠️ Mock data bilan
| Tab | Holat |
|---|---|
| Moderatsiya | Schema bor (`moderation_queue`), UI bo'sh |
| Kurslar | Faqat `published` ko'rinadi, action yo'q |
| Tahlil | 6 oylik hardcoded mock |
| Tizim | Hardcoded 95% / 145ms |

---

## 3. Admin Panel Kelajak Funksionali — To'liq Roadmap

### 🎯 Categorization framework

**MUST** (3-4 hafta) — Platform ishlashi uchun majburiy
**SHOULD** (1-2 oy) — Scaling uchun zarur
**NICE** (3-6 oy) — Differentiator features

---

### 📦 MODUL A — User Management (qisman done)

#### A.1 Phase 1 ✅ done
- List + filter + search
- Suspend / activate
- Role change
- Audit log

#### A.2 Phase 2 — kerak [MUST]
| Funksiya | Tafsilot | DB o'zgarish |
|---|---|---|
| **User detail page** | `/admin-dashboard/users/[id]` — to'liq profil, enrollment'lar, sertifikatlar, payment history | ❌ yo'q |
| **Login history** | `login_history` jadval — IP, device, success/fail | ✅ yangi jadval |
| **Bulk actions** | Bir nechta user'ni bir vaqtda suspend/notify | — |
| **Filter advanced** | Sana oralig'i, status (faol/blok), email verified | — |
| **Export CSV** | Filtered ro'yxatni eksport | — |
| **Inline edit** | Email, full name | — |

#### A.3 Phase 3 — yaxshi [SHOULD]
- **Impersonation** ("Login as user") — debugging uchun, audit'ga yoziladi
- **Force password reset** — admin majburiy reset
- **Email verification status** — qayta yuborish
- **2FA majburiyligi** — admin'lar uchun
- **Devices ro'yxati** — joriy session'lar, force logout

---

### 📦 MODUL B — Content Moderation (mavjud schema)

#### B.1 Phase 2 [MUST]
| Funksiya | Tafsilot |
|---|---|
| **Moderation queue** | `moderation_queue` jadvaldan to'liq UI |
| **Material preview** | Video, document, audio preview modal'da |
| **Approve / Reject** | Status update + feedback + `moderation_history` |
| **Reviewer assignment** | Bir necha admin → o'zining queue'si |
| **Auto-checks** | Plagiarism score, quality score field'lari schema'da bor |
| **Bulk approve** | Trusted teacher'lar uchun auto-approve |

#### B.2 Phase 3 [SHOULD]
| Funksiya | Tafsilot |
|---|---|
| **Course approval pipeline** | Yangi kurs → draft → submitted → review → approved/rejected |
| **Featured kurs belgilash** | `is_featured` field (yangi) — marketplace'da top'da |
| **Quality scoring** | AI yordamida text/video sifati baholash (OpenAI/Anthropic API) |
| **Plagiarism detection** | Topic content'larini taqqoslash |
| **Trust score** | Teacher'lar uchun (auto-approve threshold) |

---

### 📦 MODUL C — Financial Management [MUST → SHOULD]

#### C.1 Phase 2 [MUST]
| Funksiya | Tafsilot | DB |
|---|---|---|
| **Revenue dashboard** | Real-time: daily/weekly/monthly, by category | Mavjud + materialized view |
| **Transaction list** | Click + Payme tranzaksiyalari, filter, search | Mavjud |
| **Refund flow** | Talaba so'rovi → admin tasdiqlash → Click/Payme API | Mavjud schema, action kerak |
| **Reconciliation** | Payment provider report vs internal data | Cron job + UI |

#### C.2 Phase 3 [SHOULD]
| Funksiya | Tafsilot | DB o'zgarish |
|---|---|---|
| **Teacher payouts** | Har oylik o'qituvchiga to'lov hisoblash + Click/Payme split | ❌ yangi: `teacher_payouts`, `payout_schedule` |
| **Commission settings** | Platform ulushi % (default 20%, lekin VIP teacher uchun farqli) | ❌ `teacher_profiles.commission_rate` |
| **Tax reporting** | Yillik soliq hisobot + 1099-equivalent | View |
| **Coupon / Promo code** | Foiz yoki sum chegirma, ishlatish soni cheklov | ❌ `coupons`, `coupon_uses` |
| **Bulk pricing** | Korporativ chegirma | — |
| **Currency conversion** | UZS ↔ USD rate'larini boshqarish | ❌ `exchange_rates` |

---

### 📦 MODUL D — Analytics & Insights [SHOULD]

#### D.1 Real-time platform metrics
| Funksiya | SQL manba |
|---|---|
| **DAU/WAU/MAU** | `student_activities` + window functions |
| **Cohort retention** | Enrollment date + last activity matrix |
| **Funnel: view → enroll → complete → certificate** | Multiple joins |
| **Conversion rate** | Marketplace view'lar (yangi `page_views` jadval) → enrollment |
| **Top kurslar** | `enrollment_count`, `rating`, `revenue` bo'yicha |
| **Top teachers** | Total revenue, students, avg rating |
| **Search queries** | Yangi `search_logs` jadval kerak |
| **Geographic distribution** | IP → region (MaxMind GeoIP yoki user profile field) |

#### D.2 Per-course analytics
| Funksiya |
|---|
| Drop-off points (qaysi topic'da talabalar to'xtaydi) |
| Average completion time |
| Quiz performance distribution |
| Student feedback sentiment |

#### D.3 Charts library
- **Hozir**: Recharts (50KB+) — overkill
- **Tavsiya**: Tremor (Tailwind-native) yoki visx (custom)

---

### 📦 MODUL E — Marketing & Growth [NICE]

| Funksiya | DB |
|---|---|
| **Featured banners** | Hero section'da rotated banner | ❌ `banners` |
| **Email campaigns** | Resend integration — broadcast | ❌ `campaigns`, `campaign_recipients` |
| **Push notifications** | Web push API | ❌ `push_subscriptions` |
| **A/B testing** | Marketplace variantlari | ❌ `experiments`, `experiment_assignments` |
| **Referral program** | Code-based yoki link-based | ❌ `referrals` |
| **Reviews moderation** | Spam comment'lar | Mavjud + status field |
| **SEO management** | Per-page metadata, sitemap priority | App'da implement |

---

### 📦 MODUL F — Customer Support [SHOULD]

| Funksiya | Approach |
|---|---|
| **Support tickets** | `support_tickets` + `ticket_messages` jadvallar |
| **Live chat (opsional)** | Intercom yoki self-built |
| **FAQ management** | CMS-like: kategoriya + savol/javob |
| **Knowledge base** | Markdown article'lar |
| **User communication** | Direct message: admin → user |
| **Send announcement** | Barcha user'larga banner / email |

---

### 📦 MODUL G — Teacher Management [MUST → SHOULD]

#### G.1 Verification flow [MUST]
- Teacher application → admin review → approve
- Verification badge (Verified Teacher)
- KYC: passport scan upload

#### G.2 Performance dashboard [SHOULD]
- Per-teacher metrics: students count, completion rate, avg rating, revenue
- Teacher payout settings (commission, payout method)
- Communication: warning, suspension, ban

#### G.3 Training [NICE]
- Onboarding flow for new teachers
- Best practices guide
- Course quality checklist

---

### 📦 MODUL H — Platform Settings [SHOULD]

| Sahifa | Funksiyalar |
|---|---|
| **Categories** | CRUD (mavjud schema, UI kerak), order, icon, color |
| **Site config** | Site name, logo, theme color, default language |
| **Email templates** | Welcome, OTP, certificate — editable |
| **Payment providers** | Click/Payme API key'lari, enabled/disabled |
| **Feature flags** | Beta features on/off |
| **Maintenance mode** | Banner + read-only flag |
| **Rate limits** | API endpoints uchun limit'lar |

---

### 📦 MODUL I — Audit & Compliance [SHOULD]

#### I.1 Audit log viewer (DB tayyor)
| Funksiya |
|---|
| Filter: admin, action type, target, date range |
| Search: by IP, user agent |
| Export: CSV, JSON |
| Retention policy: 90 kun (config'da o'zgartirsa bo'ladi) |

#### I.2 Compliance
| Funksiya |
|---|
| **GDPR / data export** | User to'liq ma'lumotni yuklab olish (JSON) |
| **Right to be forgotten** | Soft delete + scheduled hard delete |
| **Privacy policy versioning** | User'lar imzolagan versiya log |
| **Cookie consent** | Yangi user uchun banner |

---

### 📦 MODUL J — System Monitoring [SHOULD]

#### J.1 Real-time health
| Metric | Manba |
|---|---|
| DB connection pool | Prisma metrics endpoint |
| Slow queries | `pg_stat_statements` (extension) |
| Error rate | Sentry yoki custom error log table |
| Active sessions | JWT count (Redis kerak bo'lsa) |
| Storage usage | `pg_database_size`, Cloudflare R2 stats |
| Background jobs | BullMQ dashboard (kelajakda) |

#### J.2 Alerts
- Disk > 85% → email admin
- Error rate > 1% → Slack
- DB latency > 500ms → page

---

### 📦 MODUL K — Developer Tools [NICE]

| Funksiya |
|---|
| **DB explorer** | Read-only query runner |
| **API tester** | Internal Postman-like |
| **Feature flags** | GrowthBook yoki self-built |
| **Background jobs queue** | Pending/processing/failed visualization |
| **Cache management** | Redis keys, invalidate |

---

## 4. Tavsiya etilgan Implementation Order

### Phase 2 (3-4 hafta) — Critical Path
1. **Hafta 1**: Course moderation flow (Module B.1)
2. **Hafta 2**: User detail page + login history (Module A.2)
3. **Hafta 3**: Real analytics (Module D.1) + audit log viewer (Module I.1)
4. **Hafta 4**: Refund flow + transaction list (Module C.1)

### Phase 3 (1-2 oy) — Scaling
1. Teacher payouts + commission (Module C.2)
2. Coupon / promo system (Module C.2)
3. Email campaigns (Module E)
4. Support tickets (Module F)
5. Platform settings UI (Module H)

### Phase 4 (3-6 oy) — Differentiation
1. AI quality scoring (Module B.2)
2. Featured kurs + recommendation algorithm v2
3. Live chat
4. A/B testing infrastructure

---

## 5. Texnik qarorlar — Senior'lar uchun ochiq savollar

| # | Savol | Variantlar |
|---|---|---|
| 1 | **Multi-tenancy?** | Bitta institutsiya vs ko'p maktab/universitet |
| 2 | **Teacher onboarding** | Self-service vs admin majburiy tasdiqlash |
| 3 | **Refund policy** | 7 kun? 30 kun? Faqat boshlanmagan kurs? |
| 4 | **Commission rate** | Yagona 20% vs tier-based |
| 5 | **Audit log retention** | 90 kun vs 1 yil (GDPR talabi) |
| 6 | **Caching layer** | Redis vs Vercel KV vs in-memory |
| 7 | **Background jobs** | BullMQ + Redis vs Vercel Cron vs Inngest |
| 8 | **File storage** | Cloudflare R2 (hozir) vs S3 vs uploadthing |
| 9 | **Video hosting** | Cloudflare Stream (hozir) vs Mux vs self-hosted |
| 10 | **Error monitoring** | Sentry vs custom + LogTail |
| 11 | **Analytics events** | Plausible vs PostHog vs Mixpanel vs self |
| 12 | **Email service** | Resend (hozir) vs SendGrid vs AWS SES |
| 13 | **i18n strategy** | next-intl vs paraglide-js vs custom |
| 14 | **CMS for content** | Headless (Sanity, Strapi) vs DB-only |
| 15 | **Search** | Postgres FTS vs Meilisearch vs Algolia |

---

## 6. Schema o'zgarishlari rejasi

### Phase 2 yangi jadvallar
```prisma
model LoginHistory {
  id        String   @id @default(uuid())
  userId    String
  ipAddress String?
  userAgent String?
  success   Boolean
  failReason String?
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}

model Coupon {
  id          String   @id @default(uuid())
  code        String   @unique
  discountType String   // 'percent' | 'fixed'
  discountValue Decimal
  maxUses     Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  // ...
}

model TeacherPayout {
  id          String   @id @default(uuid())
  teacherId   String
  periodStart DateTime
  periodEnd   DateTime
  amountUzs   BigInt
  commissionRate Decimal
  status      String   // 'pending' | 'processed' | 'failed'
  paidAt      DateTime?
}

model SupportTicket {
  id        String   @id @default(uuid())
  userId    String
  subject   String
  status    String   // 'open' | 'in_progress' | 'resolved' | 'closed'
  priority  String
  assignedTo String?
  createdAt DateTime @default(now())
}
```

### Phase 2 field qo'shish
- `courses.is_featured` Boolean
- `user_profiles.email_verified_at` DateTime?
- `teacher_profiles.commission_rate` Decimal (yangi jadval kerak)

---

## 7. Industry benchmarking

| Platform | Admin features bilim |
|---|---|
| **Coursera** | Teacher payouts, content QA pipeline, AI moderation |
| **Udemy** | Coupon system (heavy), instructor metrics dashboard |
| **Domestika** | Featured kurs editorial, marketing campaigns |
| **Hyperskill** | Project-based learning, peer review |
| **Skillshare** | Subscription model, watch-time analytics |

**Ustoz uchun differentiator:**
- O'zbek tilida birinchi marketplace
- Local payment (Click, Payme) — international platformlarda yo'q
- Teacher community features (kelajakda)
- AI-powered content recommendations (bizda 60/30/10 mavjud)

---

## 8. Xulosa va keyingi qadam

**Hozirgi holat**: Phase 1 admin done — real user management ishlaydi. 90% mock data hali ham 5 ta tab'da.

**Eng katta gap'lar (impact order):**
1. **Moderation flow** — teacher uploaded content uchun zarur
2. **Refund / transaction management** — money flow uchun zarur
3. **Real analytics** — biznes qarorlar uchun zarur
4. **Teacher payouts** — teacher onboarding'ni qulay qilish
5. **Customer support tools** — scale'da kerak

**Tavsiya qiluvchi birinchi qadam**: **Phase 2 = Hafta 1: Course Moderation Flow**.
Sababi:
- Schema allaqachon tayyor (`moderation_queue`, `moderation_history`)
- Teacher onboarding bilan blocked
- 2-3 kunda ishlay boshlaydi
- Visible win admin uchun

Yoki **Refund flow** — agar payment integratsiya allaqachon faol bo'lsa, bu prioritet bo'ladi.

---

## Qo'shimcha resurslar

- [ADMIN_PANEL_AUDIT.md](docs/ADMIN_PANEL_AUDIT.md) — texnik audit (Phase 1 holat)
- [ARCHITECTURE.md](ARCHITECTURE.md) — 3-qatlamli pattern
- [README.md](README.md) — setup va scripts
