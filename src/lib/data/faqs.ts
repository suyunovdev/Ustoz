/**
 * FAQ — yordam markazi uchun static dataset.
 * Categories: getting_started | account | courses | payments | teaching | technical
 */

export type FaqCategory =
  | 'getting_started'
  | 'account'
  | 'courses'
  | 'payments'
  | 'teaching'
  | 'technical';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  /** Qidiruv uchun qo'shimcha kalit so'zlar */
  keywords?: string[];
}

export const CATEGORY_LABEL: Record<FaqCategory, { label: string; icon: string }> = {
  getting_started: { label: "Boshlash", icon: 'RocketLaunchIcon' },
  account: { label: 'Hisob', icon: 'UserCircleIcon' },
  courses: { label: 'Kurslar', icon: 'BookOpenIcon' },
  payments: { label: "To'lovlar", icon: 'CurrencyDollarIcon' },
  teaching: { label: "O'qituvchilik", icon: 'AcademicCapIcon' },
  technical: { label: "Texnik", icon: 'Cog6ToothIcon' },
};

export const FAQS: FaqItem[] = [
  // ─── Getting Started ──────────────────────────────────────────
  {
    id: 'gs-1',
    category: 'getting_started',
    question: "Ustoz.uz nima va u qanday ishlaydi?",
    answer:
      "Ustoz.uz — o'zbek tilidagi onlayn ta'lim platformasi. Talabalar kurslarga yoziladi, video darslarni ko'radi, vazifa va testlarni bajaradi. O'qituvchilar esa o'z kurslarini yaratib, daromad oladi.",
    keywords: ['nima', 'tushuncha', 'qanday'],
  },
  {
    id: 'gs-2',
    category: 'getting_started',
    question: 'Hisob qanday ochiladi?',
    answer:
      "Ro'yxatdan o'tish uchun bosh sahifadagi \"Ro'yxatdan o'tish\" tugmasini bosing. Email manzilingizni kiriting va OTP kod orqali tasdiqlang. Profilni to'ldirib, dars olishni boshlashingiz mumkin.",
    keywords: ['signup', 'register', 'royxat'],
  },
  {
    id: 'gs-3',
    category: 'getting_started',
    question: "Birinchi kursni qanday tanlash kerak?",
    answer:
      "Marketplace sahifasiga o'tib, sizni qiziqtiradigan mavzuni qidiring. Har kurs sahifasida o'qituvchi haqida ma'lumot, sharhlar, mavzular ro'yxati va narx ko'rsatilgan. Bepul kurslarni tanlab, platformani sinab ko'rishingiz mumkin.",
    keywords: ['boshlash', 'first', 'tanlash'],
  },

  // ─── Account ─────────────────────────────────────────────────
  {
    id: 'acc-1',
    category: 'account',
    question: "Parolni qanday o'zgartirish kerak?",
    answer:
      "Profil sozlamalariga kirib (yuqori o'ng burchakdagi menyu → Profil), \"Parol\" tab'ini tanlang. Eski parolni va yangi parolni kiriting (kamida 6 belgi). Yangi parol darhol faollashadi.",
    keywords: ['parol', 'password', 'change'],
  },
  {
    id: 'acc-2',
    category: 'account',
    question: "Parolni unutsam, qanday tiklash mumkin?",
    answer:
      "Login sahifasida \"Parolni unutdingizmi?\" tugmasini bosing. Email manzilingizni kiriting — OTP kod yuboriladi. Kodni kiritib, yangi parol o'rnating.",
    keywords: ['unutish', 'reset', 'tiklash'],
  },
  {
    id: 'acc-3',
    category: 'account',
    question: "Hisobimni qanday o'chirishim mumkin?",
    answer:
      "Profil → Hisob tab'iga o'ting. \"Hisobni o'chirishni so'rash\" tugmasi orqali sabab bilan birga so'rov yuboring. Admin ko'rib chiqadi va tasdiqlaydi. Tasdiqlanmaguncha bekor qilish mumkin.",
    keywords: ["o'chirish", 'delete', 'remove'],
  },
  {
    id: 'acc-4',
    category: 'account',
    question: "Email manzilini o'zgartira olamanmi?",
    answer:
      "Hozircha email manzilini o'zingiz o'zgartira olmaysiz. Buning uchun support'ga murojaat qiling — biz tasdiqlash bilan o'zgartiramiz.",
    keywords: ['email', "o'zgartirish"],
  },

  // ─── Courses ─────────────────────────────────────────────────
  {
    id: 'crs-1',
    category: 'courses',
    question: "Kursga qanday yoziladi?",
    answer:
      "Marketplace'da kerakli kursni tanlang va \"Yozilish\" tugmasini bosing. Bepul kurs bo'lsa darhol mavjud bo'ladi. Pulli bo'lsa to'lov sahifasiga yo'naltirilasiz (Click yoki Payme).",
    keywords: ['yozilish', 'enroll'],
  },
  {
    id: 'crs-2',
    category: 'courses',
    question: 'Kursni tugatgandan keyin sertifikat olamizmi?',
    answer:
      "Ha. Kurs 100% tugatilganda yoki ohirgi imtihon o'tilganda avtomatik ravishda sertifikat beriladi. Profil > Sertifikatlar bo'limidan ko'rishingiz mumkin. Har sertifikatning ommaviy QR-link mavjud.",
    keywords: ['sertifikat', 'certificate'],
  },
  {
    id: 'crs-3',
    category: 'courses',
    question: "Yozilgan kursni qaytarib pulini olish mumkinmi?",
    answer:
      "Yozilganidan keyin 7 kun ichida va kurs 10%dan kam ko'rilgan bo'lsa, qaytarish so'rovini yuborishingiz mumkin. Support tickets bo'limidan murojaat qiling.",
    keywords: ['refund', 'qaytarish'],
  },
  {
    id: 'crs-4',
    category: 'courses',
    question: "Testdan o'tib bo'lmasam nima qilaman?",
    answer:
      "Har test cheklangan urinishlarga ega (odatda 3 ta). Urinishlar tugagan bo'lsa, o'qituvchi bilan bog'lanib qo'shimcha urinish so'rashingiz mumkin. Test natijalaringizni qayta ko'rib chiqib, xato joylarni o'rganib chiqing.",
    keywords: ['test', 'imtihon'],
  },

  // ─── Payments ────────────────────────────────────────────────
  {
    id: 'pay-1',
    category: 'payments',
    question: "Qaysi to'lov usullari qabul qilinadi?",
    answer:
      "Hozirda Click va Payme orqali to'lov qabul qilamiz. UzCard, Humo va Visa kartalari ham qo'llab-quvvatlanadi (Click orqali).",
    keywords: ['click', 'payme', "to'lov"],
  },
  {
    id: 'pay-2',
    category: 'payments',
    question: "To'lovni amalga oshirdim, lekin kursga yozilmadi",
    answer:
      "1-2 daqiqa kutib turing — gateway javobi vaqt olishi mumkin. Agar 5 daqiqadan ko'p vaqt o'tsa, support'ga to'lov ID bilan murojaat qiling.",
    keywords: ['muammo', 'failed'],
  },
  {
    id: 'pay-3',
    category: 'payments',
    question: "Chek (kvitansiya) qayerdan olaman?",
    answer:
      "Profil → To'lovlar (yoki Daromad → To'lovlar) bo'limida har to'lovning to'liq ma'lumotini ko'rishingiz mumkin. PDF chek hozircha qo'llab-quvvatlanmaydi, lekin tez orada qo'shamiz.",
    keywords: ['chek', 'kvitansiya', 'receipt'],
  },

  // ─── Teaching ────────────────────────────────────────────────
  {
    id: 'tch-1',
    category: 'teaching',
    question: "Qanday qilib o'qituvchi bo'lish mumkin?",
    answer:
      "Profil > Hisob > \"O'qituvchi bo'lish\" linkini bosing. Ariza to'ldiring (CV, mutaxassislik, qisqacha so'z). Admin 1-3 ish kuni ichida ko'rib chiqadi.",
    keywords: ['teacher', 'apply', 'ariza'],
  },
  {
    id: 'tch-2',
    category: 'teaching',
    question: "Kursdan qancha daromad olaman?",
    answer:
      "Platforma komissiyasi har kurs daromadidan 15% ushlab qoladi (rebate refund'lar ushlangandan keyin). Qolgan summa sizning 'mavjud balans'ingizga qo'shiladi va istalgan vaqtda yechib olishingiz mumkin (min 100,000 UZS).",
    keywords: ['daromad', 'foiz', 'pul', "ushlash"],
  },
  {
    id: 'tch-3',
    category: 'teaching',
    question: "Pul qanday yechib olinadi?",
    answer:
      "Teacher dashboard → Daromad → \"Pul yechib olish\" tugmasini bosing. Bank ma'lumotlari yoki karta raqamingizni kiritib so'rov yuboring. Admin 1-3 ish kuni ichida amalga oshiradi.",
    keywords: ['withdraw', 'yechish'],
  },
  {
    id: 'tch-4',
    category: 'teaching',
    question: "Kursni qanday e'lon qilaman?",
    answer:
      "Avval kursni yaratib, mavzular va materiallar qo'shing. Tayyor bo'lganda \"Tasdiqlashga yuborish\" tugmasini bosing. Admin moderator kurs sifatini tekshirib chiqadi. Tasdiqlangan kurslar marketplace'da paydo bo'ladi.",
    keywords: ["e'lon", 'publish', 'tasdiq'],
  },

  // ─── Technical ───────────────────────────────────────────────
  {
    id: 'tec-1',
    category: 'technical',
    question: "Video ochilmayapti, nima qilish kerak?",
    answer:
      "Avval brauzerni yangilang (Ctrl+F5). Ishlamasa, boshqa brauzerda (Chrome/Firefox) sinab ko'ring. Internetingiz tezligini tekshiring. Agar muammo davom etsa, support'ga URL va xato matni bilan murojaat qiling.",
    keywords: ['video', 'ishlamayapti'],
  },
  {
    id: 'tec-2',
    category: 'technical',
    question: "Mobil ilovasi bormi?",
    answer:
      "Hozircha mobil ilovasi yo'q, lekin sayt mobile-first dizaynda — telefonda ham qulay ishlaydi. Android va iOS ilovalari 2026-yilning ikkinchi yarmida chiqariladi.",
    keywords: ['mobile', 'ios', 'android'],
  },
  {
    id: 'tec-3',
    category: 'technical',
    question: "Bildirishnomalar kelmayapti",
    answer:
      "Profil → Bildirishnomalar tab'idan tekshiring — kerakli email turlari yoqilganmi? Spam papkani ham tekshiring. Brauzerda block bo'lgan bo'lsa, sayt URL'i uchun bildirishnoma ruxsatini bering.",
    keywords: ['notification', 'kelmayapti'],
  },
];

export function searchFaqs(query: string, category?: FaqCategory | null): FaqItem[] {
  const q = query.trim().toLowerCase();
  return FAQS.filter((f) => {
    if (category && f.category !== category) return false;
    if (!q) return true;
    const hay = [
      f.question.toLowerCase(),
      f.answer.toLowerCase(),
      ...(f.keywords ?? []).map((k) => k.toLowerCase()),
    ].join(' ');
    return hay.includes(q);
  });
}
