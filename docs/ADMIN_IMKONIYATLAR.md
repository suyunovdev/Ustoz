# 👑 Admin akkauntda bo'lishi kerak imkoniyatlar

## 👥 1. Foydalanuvchilar boshqaruvi

**Hozir bor:**
- ✅ Ro'yxat ko'rish (filter: rol, qidirish)
- ✅ Bloklash / Faollashtirish
- ✅ Rol o'zgartirish (student ⇄ teacher ⇄ admin)

**Bo'lishi kerak:**
- 👁️ **Profil sahifasi** — bitta foydalanuvchini batafsil ko'rish (qaysi kurslarga yozilgan, sertifikatlari, to'lovlari, oxirgi kirish, IP'lari)
- 📜 **Kirish tarixi** — har user qachon va qayerdan kirgan (xavfsizlik tahlili uchun)
- ✏️ **Ma'lumotni o'zgartirish** — admin user'ning ism/email'ini to'g'rilash
- 🔑 **Parolni majburiy reset qilish** — user parol unutgan deb so'rasa
- 📤 **Eksport (CSV/Excel)** — foydalanuvchilar bazasini yuklab olish
- 🎭 **"User sifatida kirish"** — debug uchun (audit log'ga yoziladi)
- 📧 **To'g'ridan-to'g'ri xabar yuborish** — bitta user'ga yoki bir guruhga
- 🚫 **Ko'p user'ni bir vaqtda bloklash** — spam akkauntlar uchun

---

## 📚 2. Kurslar boshqaruvi

**Hozir yo'q:**
- 👁️ **Hammasini ko'rish** — published + draft + rejected (hozir faqat published)
- ✅ **Tasdiqlash / Rad etish** — yangi kursni admin ko'radi, OK bersa publish bo'ladi
- ⭐ **"Featured" belgilash** — marketplace'da yuqorida turishi uchun
- 🏷️ **Kategoriyani o'zgartirish** — noto'g'ri kategoriyaga kiritilgan kurs
- 🔒 **Vaqtincha to'xtatish** — kurs sifati past bo'lsa
- 🗑️ **O'chirish** — buzilgan/dublicate kurs
- 💬 **Sharhlarni nazorat qilish** — spam/haqorat sharhlarni o'chirish
- 📊 **Har kurs uchun statistika** — nechta talaba, qancha tugatgan, o'rtacha reyting

---

## 🛡️ 3. Mazmun moderatsiyasi

**Bo'lishi kerak:**
- 📥 **Kutilayotgan kontent navbati** — teacher'lar yangi material yuklaganda
- 👀 **Preview** — video tomosha qilish, hujjat ochish, audio tinglash
- ✅/❌ **Tasdiqlash yoki rad etish** + sabab yozish
- 🤖 **Avtomatik tekshiruv** — plagiat, sifat, mavzuga moslik (AI bilan)
- 📜 **Moderatsiya tarixi** — kim qachon nimani tasdiqlagan
- 🚩 **Talaba shikoyatlari** — "bu kontent yaroqsiz" — to'planib admin'ga keladi

---

## 💰 4. To'lovlar va daromad

**Bo'lishi kerak:**
- 📋 **Barcha tranzaksiyalar** — Click/Payme orqali to'lovlar ro'yxati
- 🔍 **Filter** — status (muvaffaqiyatli, bekor, kutilmoqda), kurs, talaba, sana
- 💸 **Pulni qaytarish (refund)** — talaba so'rasa, admin tasdiqlasa avtomatik
- ⚠️ **Muammoli to'lovlar** — to'lov tushgan lekin kurs ochilmagan holatlar
- 👨‍🏫 **Teacher payout** — har oy qaysi o'qituvchi qancha pul olishi kerak
- 📊 **Daromad statistikasi** — kunlik/oylik trend, kategoriyalar bo'yicha
- 🎟️ **Promo-kodlar (chegirma)** — yaratish, taqsimlash, kim ishlatganini ko'rish
- 🧾 **Soliq hisobot** — yillik daromad summasi

---

## 📊 5. Tahlil va statistika

**Bo'lishi kerak:**
- 📈 **Foydalanuvchilar o'sishi** — kunlik/oylik (mock o'rniga real)
- 🎯 **Faollik** — DAU / WAU / MAU (kun/hafta/oy ichida nechta faol user)
- 🔥 **Eng mashhur kurslar** — yozilish, tugatish, reyting bo'yicha
- 👨‍🏫 **Eng yaxshi o'qituvchilar** — daromad, talaba, reyting
- 📉 **Drop-off** — talabalar qaysi mavzuda to'xtab qolayotgani
- 🌍 **Geografiya** — qaysi viloyatdan ko'p kiradi
- 🔎 **Qidiruv so'rovlari** — talabalar nimani qidirayotgani (yangi kurs g'oyasi uchun)
- 🛒 **Konversiya** — marketplace'ni ko'rgan → yozilgan → tugatgan voronka

---

## 📣 6. Marketing va xabarlar

**Bo'lishi kerak:**
- 📧 **Email yuborish** — barcha user'larga yoki guruhga (yangiliklar, promo)
- 🔔 **Push xabarnoma** — brauzer push notification
- 🎯 **Banner** — bosh sahifa hero'sida e'lon ("Qishki chegirma — 50%!")
- 👋 **Yangi user xush kelibsiz xabari** — avtomatik
- 📢 **Tizim e'loni** — "Texnik ishlar bo'ladi soat 22:00 dan"
- 🔄 **A/B test** — bir guruhga yangi marketplace dizayn, ikkinchisiga eski — qaysi yaxshi

---

## 👨‍🏫 7. O'qituvchilar boshqaruvi

**Bo'lishi kerak:**
- ✅ **Yangi teacher tasdiqlash** — kim ham o'qituvchi bo'la olmaydi, admin ruxsat berishi kerak
- 🆔 **Hujjat tekshirish (KYC)** — passport scan, diplom
- 🏅 **"Verified Teacher" belgisi**
- 📊 **Teacher reytingi** — talaba reytingi, daromad, tugatish foizi
- ⚠️ **Ogohlantirish berish** — past sifat haqida
- 💼 **Komissiya foizi sozlash** — default 20%, VIP teacher uchun 15%

---

## 🎓 8. Sertifikatlar boshqaruvi

**Bo'lishi kerak:**
- 📜 **Berilgan sertifikatlar** — kim qachon olgan
- ✏️ **Sertifikatni qaytarib chaqirish** — agar hisob soxta bo'lsa
- 🎨 **Sertifikat shabloni** — dizayn o'zgartirish (logo, rang, matn)
- 🔍 **Tekshirish sahifasi** — boshqalar sertifikat haqiqiyligini tekshirsin

---

## 💬 9. Mijozlarga yordam

**Bo'lishi kerak:**
- 🎫 **Yordam so'rovlari (tickets)** — talaba "bu menga kerak" deb yozadi, admin javob beradi
- ❓ **FAQ boshqaruvi** — tez-tez so'raladigan savollar ro'yxati (CMS-like)
- 📚 **Yordam maqolalari** — "Kurs qanday yoziladi?", "To'lovni qanday qaytarish?"
- 💬 **Live chat (kelajakda)** — real-time aloqa

---

## ⚙️ 10. Tizim sozlamalari

**Bo'lishi kerak:**
- 🏷️ **Kategoriyalar** — qo'shish, o'zgartirish, o'chirish
- 🎨 **Sayt sozlamalari** — logo, rang, default til
- 📧 **Email shabloni** — xush kelibsiz xabari, OTP, sertifikat — qayta yozish
- 💳 **To'lov sozlamalari** — Click/Payme API key'lar
- 🚧 **Texnik ishlar rejimi** — sayt vaqtincha yopiq + banner ko'rsatish
- 🚩 **Feature flag** — yangi funksiyani faqat 10% user'ga ko'rsatish

---

## 🛡️ 11. Xavfsizlik va audit

**Bo'lishi kerak:**
- 📜 **Audit log ko'rish** — kim qachon nimani o'zgartirgan (admin actions journal)
- 🚨 **Shubhali faollik** — ko'p login fail, IP block, brute force urinishlar
- 🔐 **2FA majburiyligi** — admin'lar uchun
- 💻 **Joriy session'lar** — kim hozir tizimda
- 🚪 **Majburiy chiqarish** — user'ni hamma joydan logout qilish

---

## 🛠️ 12. Tizim holati

**Bo'lishi kerak:**
- 🟢 **Server holati** — online/offline, response time
- 🗄️ **DB holati** — connection, query speed
- 📊 **Storage** — fayl saqlash limiti necha foiz to'lgan
- 🐛 **Xato loglari** — bugun nechta crash bo'ldi
- 📈 **API tezligi** — endpoint'lar kuni qancha vaqtda javob berayotgani

---

## 🎯 Eng muhim 10 ta (Top Priority)

Hammasidan eng birinchi navbatda admin'ga zarur narsalar:

1. ✅ **Foydalanuvchini bloklash** (bor)
2. ✅ **Statistika ko'rish — real KPI** (bor)
3. ❌ **Kursni tasdiqlash / rad etish**
4. ❌ **To'lovni qaytarish (refund)**
5. ❌ **Sharhlarni o'chirish (spam)**
6. ❌ **Email yuborish (broadcast)**
7. ❌ **Yangi o'qituvchini tasdiqlash**
8. ❌ **Kontent moderatsiyasi**
9. ❌ **Yordam so'rovlariga javob**
10. ❌ **Audit log ko'rish**
