/**
 * Sharh shablonlari — reyting bo'yicha guruhlangan.
 * Talaba erkin matn yoza olmaydi — faqat shu shablonlardan birini tanlaydi.
 *
 * ID format: "{rating}-{index}" — masalan "5-1", "3-4"
 * Faqat backend validatsiyasi uchun import qiladi (templateId mavjudligi).
 */

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ReviewTemplate {
  id: string;
  text: string;
}

export const REVIEW_TEMPLATES: Record<ReviewRating, ReviewTemplate[]> = {
  5: [
    { id: '5-1', text: "Ajoyib kurs! Hamma narsa juda tushunarli bayon qilingan." },
    { id: '5-2', text: "O'qituvchi mukammal tushuntiradi, mutlaqo tavsiya qilaman." },
    { id: '5-3', text: "Tezda yangi narsalarni o'rgandim, hayotda foydali bo'ldi." },
    { id: '5-4', text: "Materiallar boy, mashqlar yaxshi tuzilgan. 100% sifatli." },
    { id: '5-5', text: "Eng yaxshi kurslardan biri — yangi boshlovchilar uchun ideal." },
    { id: '5-6', text: "Professional yondashuv, har bir mavzu chuqur ochib berilgan." },
  ],
  4: [
    { id: '4-1', text: "Yaxshi kurs, materiallar foydali. Ba'zi joylar yanada chuqurroq bo'lsa edi." },
    { id: '4-2', text: "Umuman tavsiya qilaman, lekin yana ko'proq amaliy misol kerak." },
    { id: '4-3', text: "Tushunarli darslar, lekin tezligi tezroq bo'lsa edi." },
    { id: '4-4', text: "Kontentdan mamnunman. Kichik kamchiliklar bor, lekin foydali." },
    { id: '4-5', text: "O'qituvchi yaxshi, lekin ba'zi mavzular qisqaroq tushuntirilgan." },
    { id: '4-6', text: "Sifatli kurs, vazifalar ko'proq bo'lsa edi." },
  ],
  3: [
    { id: '3-1', text: "O'rtacha kurs — ba'zi mavzular yaxshi, ba'zilari kuchsiz." },
    { id: '3-2', text: "Kontentni qabul qilish mumkin, lekin yangi tushunchalar yetarli ochilmagan." },
    { id: '3-3', text: "Boshlovchilar uchun yaxshi, lekin kuchli o'rganuvchilar uchun yetarli emas." },
    { id: '3-4', text: "Materiallar bor, ammo tartibsiz tuzilgan." },
    { id: '3-5', text: "Tushuntirish stili menga to'g'ri kelmadi, lekin foydali joylari bor." },
    { id: '3-6', text: "Narxiga arziydi, lekin yanada yaxshilash joylari mavjud." },
  ],
  2: [
    { id: '2-1', text: "Kutgan natijani olmadim — materiallar yetishmaydi." },
    { id: '2-2', text: "Tushuntirishlar yuzaki, chuqurlikni topa olmadim." },
    { id: '2-3', text: "Vazifalar va amaliy mashqlar deyarli yo'q." },
    { id: '2-4', text: "Video sifati past, ovoz ham tushunarsiz." },
    { id: '2-5', text: "Mavzular tartibsiz, bog'lanishlar yo'q." },
    { id: '2-6', text: "Boshqa platformalarda yaxshiroq kurslar bor." },
  ],
  1: [
    { id: '1-1', text: "Kurs umidlarimni oqlamadi, vaqtim isrof bo'ldi." },
    { id: '1-2', text: "Materiallar eski, hozirgi vaqtga to'g'ri kelmaydi." },
    { id: '1-3', text: "Texnik muammolar ko'p — video, audio ishlamaydi." },
    { id: '1-4', text: "O'qituvchi materialni yaxshi bilmasa kerak." },
    { id: '1-5', text: "Kontent juda kam — narxga arzimaydi." },
    { id: '1-6', text: "Tavsiya qilmayman, boshqa joydan izlang." },
  ],
};

/**
 * Template ID bo'yicha matn topish.
 */
export function getTemplateText(templateId: string): string | null {
  const [ratingStr] = templateId.split('-');
  const rating = Number(ratingStr) as ReviewRating;
  if (!REVIEW_TEMPLATES[rating]) return null;
  const tpl = REVIEW_TEMPLATES[rating].find((t) => t.id === templateId);
  return tpl?.text ?? null;
}

/**
 * Template ID rating'iga mos kelishini tekshirish.
 * Yo'q bo'lsa, false — yaroqsiz kombinatsiya.
 */
export function isValidTemplateForRating(
  templateId: string,
  rating: number,
): boolean {
  const [tplRating] = templateId.split('-');
  if (Number(tplRating) !== rating) return false;
  return REVIEW_TEMPLATES[rating as ReviewRating]?.some((t) => t.id === templateId) ?? false;
}

/**
 * Berilgan rating uchun barcha shablonlarni qaytarish.
 */
export function getTemplatesForRating(rating: number): ReviewTemplate[] {
  return REVIEW_TEMPLATES[rating as ReviewRating] ?? [];
}
