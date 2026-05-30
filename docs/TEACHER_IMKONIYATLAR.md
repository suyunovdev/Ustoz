# 👨‍🏫 Teacher akkauntda bo'lishi kerak imkoniyatlar

## 📚 1. Kurs yaratish va boshqarish

**Hozir bor:**
- ✅ Yangi kurs yaratish
- ✅ Kurslarni ko'rish (ro'yxat)
- ✅ Arxivlash / o'chirish

**Bo'lishi kerak:**
- 📋 **Kurs nusxalash (duplicate)** — mavjud kursdan nusxa olib yangi yaratish
- 👁️ **"Talaba ko'zi bilan" preview** — kurs talabaga qanday ko'rinishini ko'rish
- 🎯 **Targetlash** — qaysi guruh/yoshga mo'ljallangan
- 💰 **Narx va chegirma** — sotuv narxi, promo narx, chegirma muddati
- 🏷️ **Kategoriya va teglar** — kurs qaysi kategoriyaga tegishli
- 🌐 **Til** — uzbek / rus / ingliz, hatto 2-3 tilda
- 📜 **Sertifikat shabloni** — kurs tugaganda qanday sertifikat beriladi
- 🎬 **Kurs trailer** — qisqa promo video
- 📅 **Boshlash/tugash sanasi** — cohort-based kurs uchun
- 👥 **Maksimum talabalar soni** — cheklov
- 🔗 **Talabalar uchun maxsus link** — invitatsiya
- 📊 **SEO meta** — google'da qanday ko'rinishi
- ⚠️ **Status va moderation izoh** — admin rad etgan bo'lsa, sababini ko'rish

---

## 📖 2. Mavzular va darslar (course topics)

**Bo'lishi kerak:**
- ➕ **Mavzu qo'shish** — title, description, video, document, audio
- 🔢 **Tartiblash (drag & drop)** — mavzular ketma-ketligi
- 🔒 **"Oldingisi tugagandan keyin"** — talaba tartib bilan o'tishi
- ⏱️ **Mavzu davomiyligi** — qancha vaqt oladi
- 📝 **Mavzu testi** — har mavzu uchun mini-quiz
- 📂 **Sub-bo'limlar (modules)** — kurs bo'limlarga bo'linishi
- 🎁 **Bepul preview mavzular** — bir-ikkitasini bepul ko'rsatish (lead magnet)
- 🔄 **Bulk import** — Excel'dan mavzular ro'yxati
- 🤖 **AI'dan mavzu tavsifi yaratish** — title bering, opisaniye AI yozadi

---

## 🎬 3. Materiallar yuklash

**Hozir bor:**
- ⚠️ `/content-upload-center` mavjud, lekin yarim ishlaydi

**Bo'lishi kerak:**
- 📹 **Video yuklash** — Cloudflare Stream'ga (bizda integratsiya bor)
- 📄 **Hujjat (PDF, DOCX)** — sahifalab ko'rish
- 🎵 **Audio fayl** — pleer bilan
- 🔗 **Tashqi havola** — YouTube, Vimeo
- 🖼️ **Rasmlar va slaydlar** — sequence ko'rsatish
- 💧 **Watermark** — fayllarda ism/logo
- 📦 **ZIP / arxiv yuklash** — bir vaqtda ko'p fayl
- 🔄 **Qayta yuklash (replace)** — eski faylni yangisi bilan
- 🛡️ **Moderation status** — material admin ko'rib chiqyaptimi
- 📊 **Tomosha statistikasi** — har video necha foiz tomosha qilingan

---

## ✅ 4. Testlar va quiz'lar

**Hozir bor:**
- ⚠️ `/sequential-test-builder` mavjud

**Bo'lishi kerak:**
- 🆕 **Test yaratish** — title, qoidalar (vaqt, urinish soni)
- ❓ **Savol turlari** — bitta to'g'ri, ko'p to'g'ri, true/false, ochiq matn, drag&drop
- 🎲 **Savollar tartibsizligi (shuffle)** — har talaba uchun
- ⏰ **Vaqt cheklovi** — savol uchun yoki butun test uchun
- 📊 **Avtomatik baholash** — multiple choice uchun
- 🧮 **Savol "og'irligi"** — har savol necha ball
- 💡 **Tushuntirish** — noto'g'ri javob keyin ko'rsatish
- 🏆 **O'tish bali** — necha foiz to'g'ri bo'lsa o'tdi
- 🔁 **Qayta urinish** — N marta urinish mumkin
- 📋 **Savollar banki** — eski savollardan tanlash
- 📊 **Test natijalari** — qaysi savol qiyin (low success rate)
- 🤖 **AI'dan savol generatsiyasi** — kurs mavzusi asosida

---

## 📝 5. Uy vazifalar (assignments)

**Hozir bor:**
- ⚠️ `/assignment-management` mavjud (`@ts-nocheck`)

**Bo'lishi kerak:**
- ➕ **Vazifa yaratish** — title, tasvir, qoidalar
- 📅 **Deadline** — soat va sana
- 📂 **Fayl yuklash imkoniyati** — talaba topshirish uchun
- ✍️ **Matn yozish** — yoki kod yozish (syntax highlight)
- 🏅 **Ball tizimi** — maksimum ball
- 📚 **Rubrik** — baholash mezonlari (X uchun N ball)
- 🔍 **Plagiat tekshiruvi** — talabalar bir-biridan ko'chirgan
- 💬 **Vazifaga izoh berish** — har talaba uchun feedback
- 🔁 **Qaytarib berish** — "qayta topshiring" deb yuborish
- 📊 **Submission stats** — kim topshirdi, kim topshirmadi
- ⚡ **Bulk grading** — ko'p talabani bir vaqtda baholash
- 🤝 **Peer review** — talaba bir-birini baholasin

---

## 👥 6. Talabalar boshqaruvi

**Hozir bor:**
- ✅ Talabalar ro'yxati ko'rinadi

**Bo'lishi kerak:**
- 👤 **Bitta talaba profili** — kim, qanday progress, qaysi kurslarga yozilgan
- 📈 **Progress kuzatish** — har talaba qaysi mavzuda
- 🚩 **Qiyinchilik belgilari** — kim drop-off bo'lyapti, kim ortda qolyapti
- 📧 **To'g'ridan-to'g'ri xabar** — bitta talabaga shaxsiy email
- 📨 **Broadcast** — barcha talabalarga e'lon (yangi mavzu, deadline)
- 🚫 **Talaba'ni kursdan chiqarish** — agar qoidabuzar bo'lsa
- 🎓 **Sertifikat tasdiqlash** — talaba tugatdi, teacher tasdiqlasin
- 📤 **Talabalar bazasi eksport** — CSV/Excel
- 🏆 **"Eng zo'r talabalar"** — top performer'lar
- 🤝 **Note yozish** — "Aziz juda yaxshi savollar so'raydi"
- 📊 **Quiz natijalar** — har talaba quiz'larda qanday baho oldi
- 🔄 **Refund qilingan talabalar** — qaysi talabalar pul qaytarib oldi (sabab bilan)

---

## 👨‍👩‍👧 7. Guruhlar (groups)

**Hozir bor:**
- ✅ `/group-creation` sahifasi mavjud

**Bo'lishi kerak:**
- ➕ **Guruh yaratish** — talabalarni gruppaga ajratish
- 📚 **Guruhga kurs biriktirish** — bir kurs ko'p guruhga
- 📅 **Guruh jadvali** — qachon dars
- 💬 **Guruh chat** — talabalar va teacher
- 👥 **Roli — assistant** — teacher yordamchisi (TA)
- 📊 **Guruh statistikasi** — qaysi guruh yaxshi natija
- 🏆 **Guruh musobaqasi** — guruhlararo

---

## 📊 8. Statistika va tahlil

**Hozir bor:**
- ⚠️ 6 oylik daromad grafik (lekin /100 xato)
- ⚠️ studentEngagement [0,0,0,0,0] hardcoded

**Bo'lishi kerak:**
- 📈 **Kurs bo'yicha daromad** — qaysi kurs qancha keltirgan (hozir 0)
- 👥 **Yangi yozilishlar** — kunlik/oylik trend
- 🎯 **Conversion** — sahifa ko'rdi → yozildi → tugatdi
- 📉 **Drop-off** — qaysi mavzuda talabalar to'xtaydi
- ⏱️ **O'rtacha tugatish vaqti** — kursni qancha vaqtda tugatishadi
- ⭐ **Reyting tendentsiyasi** — vaqt o'tishi bilan reyting o'zgarishi
- 🌍 **Geografiya** — qaysi viloyatdan talabalar
- 📅 **Faollik soati** — qaysi vaqtda talabalar ko'p o'qiydi
- 🔍 **Qidiruv** — talabalar nima qidirgan (admin'da bo'ladi)
- 📊 **Funnel** — preview ko'rdi → yozildi → birinchi mavzu → 50% → tugatdi
- 🏆 **Sertifikatlar** — necha talaba sertifikat oldi

---

## 💰 9. Daromad va to'lovlar

**Hozir bor:**
- ⚠️ Withdraw modal mavjud, lekin **real API yo'q** (fake!)
- ⚠️ Per-course revenue = 0 hardcoded

**Bo'lishi kerak:**
- 💵 **Joriy balans** — qancha pul to'plagan
- 📤 **Pulni yechib olish (withdraw)** — bank kartaga so'rov
- 📊 **Komissiya** — platformaga qancha, teacher'ga qancha (masalan 80/20)
- 📅 **To'lov tarixi** — har payout qachon, qancha
- ⏱️ **Kutilayotgan to'lov** — qancha hisoblanmoqda
- 💳 **Bank ma'lumotlari** — qayerga pul tushadi
- 🧾 **Soliq hisobot** — yillik daromad
- 💸 **Refund hisobi** — qaytarilgan to'lovlar daromadga ta'siri
- 📈 **Daromad prognozi** — joriy trend asosida keyingi oy taxmini
- 🎟️ **Promo-kod** — o'z kursi uchun chegirma kodi yaratish
- 🌟 **Sponsorlik** — kurs uchun sponsor topish (kelajakda)

---

## 💬 10. Aloqa (talabalar bilan)

**Hozir butunlay yo'q.**

**Bo'lishi kerak:**
- 📧 **Bitta talabaga xabar** — to'g'ridan-to'g'ri email
- 📨 **Barcha talabalarga e'lon** — broadcast (yangi mavzu, deadline)
- 💬 **Q&A bo'limi** — talabalar savol berishi, teacher javob berishi
- 📺 **Live session e'lon qilish** — Zoom/Meet havolasi
- 📅 **Kelishuv (office hours)** — talabalar maslahat olishi
- 🔔 **Notifications** — yangi savol/yangi enrollment/yangi sharh
- 🎉 **Tabriklash** — talaba sertifikat olganida tabrik xabari
- ⚠️ **Eslatma** — "Sizning vazifangiz kechikadi" deb avtomatik

---

## ⭐ 11. Sharhlar va reyting

**Bo'lishi kerak:**
- 👁️ **Sharhlarni ko'rish** — har kurs uchun
- 💬 **Sharhga javob yozish** — public reply (boshqa talabalar ko'radi)
- 🚩 **Spam/haqorat sharh haqida admin'ga shikoyat** — moderatsiyaga yuborish
- 📊 **Reyting tendentsiyasi** — vaqt o'tishi bilan
- 🌟 **"Eng yaxshi" sharhlar** — top voted
- 📈 **Feedback so'rov** — anketa yuborish

---

## 🎓 12. Sertifikatlar

**Bo'lishi kerak:**
- 🎨 **Sertifikat shabloni tanlash** — har kurs uchun
- ✏️ **Maxsus matn qo'shish** — teacher'dan tabrik
- ✅ **Tasdiqlash** — talaba tugatdi, teacher ruxsat bersa berildi
- 📜 **Berilgan sertifikatlar** — kim, qachon
- 🔍 **Tekshirish havolasi** — public verify URL
- 🏆 **"Eng zo'r" sertifikat** — alohida belgi

---

## 🔔 13. Bildirishnomalar (notifications)

**Hozir bor:**
- ⚠️ `notifications` jadval mavjud, lekin teacher integratsiya yo'q

**Bo'lishi kerak:**
- 🆕 **Yangi talaba yozilishi** — har enrollment haqida
- 💵 **Yangi to'lov** — kurs sotildi
- 💸 **Refund qilindi** — talaba pul qaytardi
- ⭐ **Yangi sharh** — kurs sharh oldi
- ❓ **Yangi savol** — talaba savol berdi
- ✅ **Admin tasdiqladi** — kurs publish bo'ldi
- ❌ **Admin rad etdi** — kursingiz rad etildi (sabab bilan)
- 📥 **Yangi vazifa topshirilgan** — talaba uy vazifa yubordi
- 💰 **Payout o'tdi** — pul kartangizga tushdi
- 🎯 **Maqsadga yetdi** — "Birinchi 100 talaba!" deb tabrik

---

## 👤 14. Teacher profili va sozlamalar

**Bo'lishi kerak:**
- 📝 **Bio / haqida** — o'zi haqida ma'lumot (public page'da ko'rinadi)
- 🖼️ **Avatar** — surat yuklash
- 🏅 **Verified badge** — admin tasdiqlagan
- 🎓 **Diplomalar/sertifikatlar** — o'zining sertifikatlari
- 🔗 **Social links** — LinkedIn, YouTube, GitHub
- 🌐 **Public profile sahifa** — `/teachers/<username>`
- 💼 **Tajriba va ish joyi**
- 📞 **Aloqa ma'lumotlari** — email, telefon (ixtiyoriy public)
- 🔐 **Parol o'zgartirish + 2FA**
- 🌍 **Til va vaqt mintaqasi**
- 🔕 **Notification sozlamalari** — qaysi xabarlar email'ga, qaysi push
- 💳 **Bank ma'lumotlari** (xavfsiz saqlanadi)
- 🚪 **Hisobni o'chirish** — agar tark etmoqchi bo'lsa

---

## 🆘 15. Yordam va support

**Bo'lishi kerak:**
- 🎫 **Admin'ga ticket yozish** — texnik muammo, savol
- 📚 **Yordam markazi** — qanday qilib kurs yaratish, video yuklash, va h.k.
- 📞 **Live chat** — admin bilan tezkor aloqa (kelajakda)
- 💡 **Best practices guide** — sifatli kurs qanday yaratiladi
- 🎥 **Onboarding video** — birinchi marta uchun
- 🏆 **Teacher community** — boshqa o'qituvchilar bilan tajriba almashish (kelajakda)

---

## 📊 16. Affiliate va referral (kelajakda)

**Bo'lishi kerak:**
- 🔗 **O'z referral link** — boshqalarni jalb qilsa, komissiya
- 👥 **Boshqa teacher'larni taklif qilish** — bonus
- 📈 **Referral statistikasi**
- 💰 **Komissiya tarixi**

---

## 🎯 Eng muhim 10 ta (Top Priority)

Teacher uchun **eng zarur** narsalar:

1. ❌ **Withdraw flow (pulni yechib olish)** — eng kritik, hozir mock
2. ❌ **Per-course revenue ko'rsatish** — qaysi kurs qancha keltirgan
3. ❌ **Moderation feedback ko'rish** — kurs rad etilgan bo'lsa, sabab
4. ❌ **Talabalar bilan aloqa** — broadcast email + individual xabar
5. ❌ **Notifications** — yangi enrollment, sharh, payment haqida
6. ❌ **Material upload UI** — kurs ichidan video/PDF yuklash
7. ❌ **Quiz/test natijalar overview** — kim qanday baho oldi
8. ❌ **Talaba profili (drilldown)** — bitta talabani batafsil
9. ❌ **Public teacher page** — `/teachers/<username>` boshqa odamlar ko'radigan
10. ❌ **Admin support tikket yaratish** — teacher ham yordam so'rasin
