/**
 * QA ustoz uchun demo kontent seed — har kategoriyaga ~4 to'liq kurs:
 *   - 3 video mavzu (YouTube, birinchisi bepul preview)
 *   - 1 test (3 savol: single / true_false / multiple)
 *   - 1 amaliy topshiriq
 * Kurslar published + approved — marketplace'da darhol ko'rinadi.
 *
 * Idempotent: kurs (teacher + sarlavha) allaqachon bo'lsa — o'tkazib yuboradi.
 * Ishga tushirish (bundle → node): esbuild bilan .mjs ga bundle qilib node bilan.
 * Muhit: DATABASE_URL (dotenv). Ustoz emaili: TEACHER_EMAIL yoki default qa.ustoz.
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// Tirikligini tasdiqlangan YouTube video ID'lari (oEmbed 200) — mavzular bo'ylab aylantiriladi.
const VIDEO_POOL = [
  'rfscVS0vtbw', 'kqtD5dpn9C8', 'PkZNo7MFNFg', 'W6NZfCO5SIk', '_uQrJ0TkZlc',
  'bMknfKXIFA8', 'zOjov-2OZ0E', 'Uo3cL4nrGOk', '8jLOx1hD3_o', 'eIrMbAQSU34',
  'pTB0EiLXUC8', 'fJ9rUzIMcZQ',
];
const yt = (i: number) => `https://www.youtube.com/watch?v=${VIDEO_POOL[i % VIDEO_POOL.length]}`;

type Spec = {
  slug: string;      // Category.slug
  title: string;
  desc: string;
  subject: string;   // SubjectCategory enum
  label: string;     // savol/mavzu uchun qisqa mavzu so'zi
  price: number;     // UZS (0 = bepul)
  level: string;     // difficultyLevel
};

// Har kategoriyaga ~4 kurs — turli subjectCategory bilan (landing subject-filtrlarini
// ham to'ldiradi). Har guruhning 1-kursi mavjud seed (idempotent skip bo'ladi).
const COURSES: Spec[] = [
  // ── Tabiiy fanlar ──
  { slug: 'tabiiy-fanlar', title: 'Tabiiy fanlar asoslari: matematika va fizika', desc: 'Matematika va fizikaning kundalik hayotdagi asosiy tushunchalari — sodda misollar bilan.', subject: 'mathematics', label: 'tabiiy fanlar', price: 0, level: 'beginner' },
  { slug: 'tabiiy-fanlar', title: 'Fizika: mexanikadan elektrgacha', desc: 'Kuch, energiya, harakat va elektr — fizikaning asosiy bo\'limlari amaliy tajribalar bilan.', subject: 'physics', label: 'fizika', price: 129000, level: 'beginner' },
  { slug: 'tabiiy-fanlar', title: 'Kimyo asoslari: atomlar va reaksiyalar', desc: 'Atom tuzilishi, davriy jadval va kimyoviy reaksiyalar — tushunarli tilda.', subject: 'chemistry', label: 'kimyo', price: 129000, level: 'beginner' },
  { slug: 'tabiiy-fanlar', title: 'Biologiya: hujayradan organizmgacha', desc: 'Tiriklik asoslari — hujayra, genetika va inson organizmi.', subject: 'biology', label: 'biologiya', price: 0, level: 'beginner' },

  // ── Tillar ──
  { slug: 'tillar', title: 'Ingliz tili: noldan suhbatgacha', desc: 'Alifbodan boshlab kundalik suhbatgacha — grammatika, lug\'at va talaffuz.', subject: 'english_language', label: 'ingliz tili', price: 149000, level: 'beginner' },
  { slug: 'tillar', title: 'Rus tili: kundalik muloqot', desc: 'Rus tilida erkin gaplashish uchun asosiy grammatika va so\'z boyligi.', subject: 'russian_language', label: 'rus tili', price: 129000, level: 'beginner' },
  { slug: 'tillar', title: 'Arab tili alifbosidan boshlab', desc: 'Arab yozuvi, o\'qish qoidalari va boshlang\'ich muloqot.', subject: 'arabic_language', label: 'arab tili', price: 149000, level: 'beginner' },
  { slug: 'tillar', title: 'Koreys tili: boshlang\'ich kurs', desc: 'Hangul alifbosi va kundalik koreyscha iboralar.', subject: 'korean_language', label: 'koreys tili', price: 149000, level: 'beginner' },

  // ── Dasturlash va IT ──
  { slug: 'dasturlash', title: 'Python bilan dasturlashga kirish', desc: 'Dasturlash asoslari Python tilida — o\'zgaruvchilar, sikllar, funksiyalar va amaliy loyiha.', subject: 'programming', label: 'dasturlash', price: 199000, level: 'beginner' },
  { slug: 'dasturlash', title: 'Veb-dasturlash: HTML, CSS, JavaScript', desc: 'Zamonaviy vebsayt yaratish — tuzilma, dizayn va interaktivlik.', subject: 'web_development', label: 'veb-dasturlash', price: 249000, level: 'intermediate' },
  { slug: 'dasturlash', title: 'Mobil ilovalar: Flutter asoslari', desc: 'Bitta koddan Android va iOS ilovasi — Flutter va Dart.', subject: 'mobile_development', label: 'mobil dasturlash', price: 249000, level: 'intermediate' },
  { slug: 'dasturlash', title: 'Ma\'lumotlar tahlili va Data Science', desc: 'Ma\'lumotlarni tahlil qilish, vizualizatsiya va asosiy mashinali o\'qitish.', subject: 'data_science', label: 'data science', price: 299000, level: 'intermediate' },

  // ── Biznes va Boshqaruv ──
  { slug: 'biznes', title: 'Biznes asoslari va boshqaruv', desc: 'Biznes g\'oyasidan rejagacha: menejment, moliya va jamoa boshqaruvi asoslari.', subject: 'business_management', label: 'biznes', price: 249000, level: 'intermediate' },
  { slug: 'biznes', title: 'Tadbirkorlik: g\'oyadan startupgacha', desc: 'O\'z biznesingizni boshlash — g\'oya, bozor tahlili va birinchi sotuv.', subject: 'entrepreneurship', label: 'tadbirkorlik', price: 199000, level: 'beginner' },
  { slug: 'biznes', title: 'Moliyaviy savodxonlik', desc: 'Shaxsiy va biznes moliyasi — byudjet, jamg\'arma va investitsiya asoslari.', subject: 'finance', label: 'moliya', price: 149000, level: 'beginner' },
  { slug: 'biznes', title: 'Buxgalteriya asoslari', desc: 'Hisob-kitob, hujjatlar va soliqning boshlang\'ich asoslari.', subject: 'accounting', label: 'buxgalteriya', price: 199000, level: 'beginner' },

  // ── Marketing va Sotuv ──
  { slug: 'marketing', title: 'Raqamli marketing va SMM', desc: 'Ijtimoiy tarmoqlar, kontent strategiyasi va reklama orqali mijoz jalb qilish.', subject: 'marketing', label: 'marketing', price: 199000, level: 'beginner' },
  { slug: 'marketing', title: 'Sotuv san\'ati va mijoz bilan ishlash', desc: 'Sotuv bosqichlari, e\'tirozlar bilan ishlash va mijozni saqlash.', subject: 'sales', label: 'sotuv', price: 179000, level: 'beginner' },
  { slug: 'marketing', title: 'Muzokara olib borish mahorati', desc: 'Foydali kelishuvga erishish texnikalari va psixologiyasi.', subject: 'negotiation', label: 'muzokara', price: 149000, level: 'beginner' },
  { slug: 'marketing', title: 'Kontent marketing va brending', desc: 'Brend ovozi, kontent reja va auditoriya bilan bog\'lanish.', subject: 'marketing', label: 'kontent marketing', price: 179000, level: 'beginner' },

  // ── Dizayn ──
  { slug: 'dizayn', title: 'UI/UX dizayn asoslari', desc: 'Foydalanuvchi interfeysi va tajribasi: prinsiplar, Figma va amaliy maketlar.', subject: 'design', label: 'dizayn', price: 199000, level: 'beginner' },
  { slug: 'dizayn', title: 'Grafik dizayn: Photoshop va Illustrator', desc: 'Rastr va vektor grafikasi, kompozitsiya va ranglar bilan ishlash.', subject: 'design', label: 'grafik dizayn', price: 199000, level: 'beginner' },
  { slug: 'dizayn', title: 'Figma bilan interfeys dizayni', desc: 'Figma\'da maket, komponent va prototip yaratish.', subject: 'design', label: 'figma', price: 179000, level: 'beginner' },
  { slug: 'dizayn', title: 'Brending va logotip dizayni', desc: 'Brend identifikatsiyasi, logotip va uslub qo\'llanmasi.', subject: 'design', label: 'brending', price: 179000, level: 'intermediate' },

  // ── San'at va Ijodiyot ──
  { slug: 'sanat', title: 'Musiqa nazariyasi asoslari', desc: 'Notalar, ritm, akkordlar va kuy tuzish — boshlovchilar uchun musiqa nazariyasi.', subject: 'music', label: 'musiqa', price: 99000, level: 'beginner' },
  { slug: 'sanat', title: 'Vokal va ashula san\'ati', desc: 'Nafas, diapazon va to\'g\'ri kuylash texnikalari.', subject: 'singing', label: 'vokal', price: 129000, level: 'beginner' },
  { slug: 'sanat', title: 'Rangtasvir: akvarel va moybo\'yoq', desc: 'Ranglar, kompozitsiya va manzara chizish asoslari.', subject: 'painting', label: 'rangtasvir', price: 99000, level: 'beginner' },
  { slug: 'sanat', title: 'Akademik rasm asoslari', desc: 'Chiziq, soya-yorug\' va perspektiva — qalamtasvir asoslari.', subject: 'drawing', label: 'rasm', price: 0, level: 'beginner' },

  // ── Foto va Video ──
  { slug: 'media', title: 'Videografiya va montaj asoslari', desc: 'Kamera, kadr, yorug\'lik va montaj — professional video tayyorlash yo\'li.', subject: 'videography', label: 'videografiya', price: 179000, level: 'beginner' },
  { slug: 'media', title: 'Professional fotografiya', desc: 'Ekspozitsiya, kompozitsiya va yorug\'lik bilan ishlash.', subject: 'photography', label: 'fotografiya', price: 179000, level: 'beginner' },
  { slug: 'media', title: 'Kino tili va rejissyorlik', desc: 'Kadr, montaj ritmi va hikoya qilish asoslari.', subject: 'cinema', label: 'kino', price: 199000, level: 'intermediate' },
  { slug: 'media', title: 'Video montaj: Premiere Pro', desc: 'Premiere Pro\'da montaj, rang va ovoz bilan ishlash.', subject: 'videography', label: 'montaj', price: 199000, level: 'intermediate' },

  // ── Hunarmandchilik ──
  { slug: 'hunarmandchilik', title: 'Milliy hunarmandchilik: naqsh va kulolchilik', desc: 'O\'zbek naqshlari va kulolchilik asoslari — an\'anaviy hunar zamonaviy yondashuvda.', subject: 'handcraft', label: 'hunarmandchilik', price: 0, level: 'beginner' },
  { slug: 'hunarmandchilik', title: 'Kulolchilik: loydan buyumgacha', desc: 'Loy tayyorlash, charxda ishlash va buyum pishirish.', subject: 'pottery', label: 'kulolchilik', price: 99000, level: 'beginner' },
  { slug: 'hunarmandchilik', title: 'Yog\'och o\'ymakorligi asoslari', desc: 'Asboblar, naqsh o\'yish va yog\'och buyum tayyorlash.', subject: 'woodworking', label: 'yog\'och o\'ymakorligi', price: 99000, level: 'beginner' },
  { slug: 'hunarmandchilik', title: 'Tikuvchilik va bichuv', desc: 'O\'lchov olish, bichish va tikish asoslari.', subject: 'sewing', label: 'tikuvchilik', price: 129000, level: 'beginner' },

  // ── Kasb-hunar ──
  { slug: 'kasb-hunar', title: 'Pazandachilik va qandolatchilik asoslari', desc: 'Milliy va zamonaviy taomlar, shirinliklar tayyorlash texnologiyasi.', subject: 'cooking', label: 'pazandachilik', price: 129000, level: 'beginner' },
  { slug: 'kasb-hunar', title: 'Qandolatchilik: tort va shirinliklar', desc: 'Xamir, krem va bezash — professional qandolat asoslari.', subject: 'confectionery', label: 'qandolatchilik', price: 149000, level: 'beginner' },
  { slug: 'kasb-hunar', title: 'Sartaroshlik mahorati', desc: 'Soch olish texnikalari, asboblar va mijoz bilan ishlash.', subject: 'barbering', label: 'sartaroshlik', price: 129000, level: 'beginner' },
  { slug: 'kasb-hunar', title: 'Soch turmaklash va styling', desc: 'Turmak, ukladka va zamonaviy soch uslublari.', subject: 'hairstyling', label: 'styling', price: 129000, level: 'beginner' },

  // ── Sport va Salomatlik ──
  { slug: 'sport', title: 'Fitnes va sog\'lom turmush tarzi', desc: 'Mashqlar, to\'g\'ri ovqatlanish va kunlik reja — sog\'lom hayot uchun asoslar.', subject: 'fitness', label: 'fitnes', price: 99000, level: 'beginner' },
  { slug: 'sport', title: 'Yoga va meditatsiya', desc: 'Asana, nafas mashqlari va ong tinchligi.', subject: 'yoga', label: 'yoga', price: 99000, level: 'beginner' },
  { slug: 'sport', title: 'Futbol: texnika va taktika', desc: 'To\'p bilan ishlash, pas va o\'yin taktikasi asoslari.', subject: 'football', label: 'futbol', price: 0, level: 'beginner' },
  { slug: 'sport', title: 'Shaxmat: boshlang\'ichdan razryadgacha', desc: 'Debyut, kombinatsiya va endshpil asoslari.', subject: 'chess', label: 'shaxmat', price: 99000, level: 'beginner' },

  // ── Tibbiyot va Psixologiya ──
  { slug: 'tibbiyot', title: 'Psixologiya asoslari va ilk yordam', desc: 'Inson psixologiyasi, stress boshqaruvi va shoshilinch ilk yordam ko\'nikmalari.', subject: 'psychology', label: 'psixologiya', price: 149000, level: 'beginner' },
  { slug: 'tibbiyot', title: 'Hamshiralik ishi asoslari', desc: 'Bemorni parvarish qilish va tibbiy protseduralar asoslari.', subject: 'nursing', label: 'hamshiralik', price: 149000, level: 'beginner' },
  { slug: 'tibbiyot', title: 'Farmatsevtika asoslari', desc: 'Dori vositalari, ularning ta\'siri va qo\'llanilishi.', subject: 'pharmacy', label: 'farmatsevtika', price: 149000, level: 'intermediate' },
  { slug: 'tibbiyot', title: 'Shoshilinch ilk yordam', desc: 'Favqulodda holatlarda hayot saqlab qolish ko\'nikmalari.', subject: 'first_aid', label: 'ilk yordam', price: 0, level: 'beginner' },

  // ── Huquq ──
  { slug: 'huquq', title: 'Huquq asoslari: fuqarolik va soliq', desc: 'Kundalik hayotda kerak bo\'ladigan fuqarolik va soliq huquqi asoslari.', subject: 'law_general', label: 'huquq', price: 199000, level: 'intermediate' },
  { slug: 'huquq', title: 'Fuqarolik huquqi amaliyoti', desc: 'Shartnomalar, mulk va majburiyatlar bo\'yicha amaliy huquq.', subject: 'civil_law', label: 'fuqarolik huquqi', price: 199000, level: 'intermediate' },
  { slug: 'huquq', title: 'Soliq huquqi va deklaratsiya', desc: 'Soliq turlari, hisobot va deklaratsiya to\'ldirish.', subject: 'tax_law', label: 'soliq huquqi', price: 199000, level: 'intermediate' },
  { slug: 'huquq', title: 'Mehnat huquqi asoslari', desc: 'Mehnat shartnomasi, huquq va majburiyatlar.', subject: 'law_general', label: 'mehnat huquqi', price: 149000, level: 'beginner' },

  // ── Qishloq xo'jaligi ──
  { slug: 'qishloq-xojaligi', title: 'Zamonaviy dehqonchilik va bog\'dorchilik', desc: 'Tuproq, ekin va bog\' parvarishi — hosildorlikni oshirishning zamonaviy usullari.', subject: 'agriculture', label: 'dehqonchilik', price: 0, level: 'beginner' },
  { slug: 'qishloq-xojaligi', title: 'Bog\'dorchilik: mevali daraxtlar', desc: 'Daraxt ekish, parvarish va kasalliklardan himoya.', subject: 'gardening', label: 'bog\'dorchilik', price: 99000, level: 'beginner' },
  { slug: 'qishloq-xojaligi', title: 'Chorvachilik asoslari', desc: 'Mol boqish, ozuqa va veterinariya asoslari.', subject: 'livestock', label: 'chorvachilik', price: 99000, level: 'beginner' },
  { slug: 'qishloq-xojaligi', title: 'Asalarichilik: noldan boshlab', desc: 'Ari oilasi, uy va asal yig\'ish texnologiyasi.', subject: 'beekeeping', label: 'asalarichilik', price: 129000, level: 'beginner' },

  // ── Texnika va Muhandislik ──
  { slug: 'texnika', title: 'Texnika asoslari: elektrika va mexanika', desc: 'Elektr zanjirlari va mexanika asoslari — amaliy muhandislik ko\'nikmalari.', subject: 'engineering_general', label: 'texnika', price: 179000, level: 'beginner' },
  { slug: 'texnika', title: 'Elektrik montaj ishlari', desc: 'Uy elektr tarmog\'i, xavfsizlik va montaj asoslari.', subject: 'electrical', label: 'elektrika', price: 179000, level: 'beginner' },
  { slug: 'texnika', title: 'Avtomobil mexanikasi', desc: 'Dvigatel, uzatma va diagnostika asoslari.', subject: 'mechanics', label: 'avto mexanika', price: 199000, level: 'intermediate' },
  { slug: 'texnika', title: 'Qurilish texnologiyalari', desc: 'Materiallar, poydevor va qurilish bosqichlari.', subject: 'construction', label: 'qurilish', price: 199000, level: 'intermediate' },

  // ── Shaxsiy rivojlanish ──
  { slug: 'rivojlanish', title: 'Shaxsiy rivojlanish va yetakchilik', desc: 'Vaqt boshqaruvi, notiqlik, maqsad qo\'yish va yetakchilik ko\'nikmalari.', subject: 'personal_development', label: 'shaxsiy rivojlanish', price: 129000, level: 'beginner' },
  { slug: 'rivojlanish', title: 'Yetakchilik va jamoa boshqaruvi', desc: 'Jamoani ilhomlantirish, delegatsiya va qaror qabul qilish.', subject: 'leadership', label: 'yetakchilik', price: 149000, level: 'intermediate' },
  { slug: 'rivojlanish', title: 'Notiqlik san\'ati', desc: 'Auditoriya oldida ishonchli va ta\'sirli gapirish.', subject: 'public_speaking', label: 'notiqlik', price: 129000, level: 'beginner' },
  { slug: 'rivojlanish', title: 'Vaqtni boshqarish va samaradorlik', desc: 'Rejalashtirish, ustuvorlik va kechiktirishni yengish.', subject: 'time_management', label: 'vaqt boshqaruvi', price: 99000, level: 'beginner' },

  // ── Bolalar va Ota-onalar ──
  { slug: 'bolalar', title: 'Ota-onalik va bola rivojlanishi', desc: 'Erta rivojlanish, tarbiya va bola psixologiyasi — ota-onalar uchun amaliy yo\'l-yo\'riq.', subject: 'parenting', label: 'ota-onalik', price: 99000, level: 'beginner' },
  { slug: 'bolalar', title: 'Erta rivojlanish: 0-3 yosh', desc: 'Chaqaloq va yosh bola rivojlanishi, o\'yin va muloqot.', subject: 'early_development', label: 'erta rivojlanish', price: 99000, level: 'beginner' },
  { slug: 'bolalar', title: 'Bola psixologiyasi', desc: 'Bola xulqi, his-tuyg\'ulari va rivojlanish bosqichlari.', subject: 'child_psychology', label: 'bola psixologiyasi', price: 129000, level: 'beginner' },
  { slug: 'bolalar', title: 'Ijobiy tarbiya usullari', desc: 'Jazolamasdan chegara qo\'yish va sog\'lom munosabat.', subject: 'parenting', label: 'ijobiy tarbiya', price: 99000, level: 'beginner' },

  // ── Din va Ma'naviyat ──
  { slug: 'din-manaviyat', title: 'Ma\'naviyat asoslari va axloq', desc: 'Umuminsoniy qadriyatlar, axloq va ma\'naviy kamolot asoslari.', subject: 'religion_general', label: 'ma\'naviyat', price: 0, level: 'beginner' },
  { slug: 'din-manaviyat', title: 'Islom asoslari', desc: 'Iymon, ibodat va axloq — islom dinining asoslari.', subject: 'religion_islam', label: 'islom asoslari', price: 0, level: 'beginner' },
  { slug: 'din-manaviyat', title: 'Qur\'on tajvidi asoslari', desc: 'To\'g\'ri o\'qish qoidalari va harflar makhraji.', subject: 'quran_studies', label: 'tajvid', price: 0, level: 'beginner' },
  { slug: 'din-manaviyat', title: 'Arab tili (diniy matnlar)', desc: 'Diniy matnlarni tushunish uchun arab tili asoslari.', subject: 'arabic_studies', label: 'diniy arab tili', price: 99000, level: 'beginner' },

  // ── Gumanitar fanlar ──
  { slug: 'gumanitar', title: 'O\'zbekiston tarixi va gumanitar fanlar', desc: 'Tarix, geografiya va adabiyot — vatanimiz va dunyo merosi bilan tanishuv.', subject: 'history', label: 'tarix', price: 129000, level: 'beginner' },
  { slug: 'gumanitar', title: 'Jahon geografiyasi', desc: 'Materiklar, iqlim va davlatlar — geografiya asoslari.', subject: 'geography', label: 'geografiya', price: 99000, level: 'beginner' },
  { slug: 'gumanitar', title: 'Falsafaga kirish', desc: 'Buyuk mutafakkirlar va asosiy falsafiy savollar.', subject: 'philosophy', label: 'falsafa', price: 99000, level: 'beginner' },
  { slug: 'gumanitar', title: 'O\'zbek adabiyoti durdonalari', desc: 'Mumtoz va zamonaviy o\'zbek adabiyoti namunalari.', subject: 'literature', label: 'adabiyot', price: 99000, level: 'beginner' },
];

function topicsFor(spec: Spec, base: number) {
  return [
    {
      title: `Kirish: ${spec.label} bilan tanishuv`,
      description: `${spec.title} kursining birinchi darsi — asosiy tushunchalar va kurs rejasi.`,
      videoUrl: yt(base),
      orderIndex: 1,
      duration: '12 min',
      content: `# Kirish\n\nUshbu darsda **${spec.label}** yo'nalishi bilan tanishasiz: nima uchun kerakligi, qanday qo'llanilishi va kurs davomida nimalarni o'rganishingiz.\n\n- Kurs maqsadi va natijalari\n- Kimlar uchun mo'ljallangan\n- Qanday tayyorgarlik kerak`,
      hasQuiz: false,
      isFreePreview: true,
      moduleTitle: '1-modul: Asoslar',
    },
    {
      title: 'Asosiy tushunchalar va amaliyot',
      description: 'Nazariy asoslar va birinchi amaliy mashg\'ulotlar.',
      videoUrl: yt(base + 1),
      orderIndex: 2,
      duration: '18 min',
      content: `# Asosiy tushunchalar\n\n${spec.label} bo'yicha eng muhim tushunchalarni ko'rib chiqamiz va ularni amaliyotda qo'llaymiz.\n\n1. Asosiy atamalar\n2. Amaliy misollar\n3. Mustaqil mashq`,
      hasQuiz: true,
      isFreePreview: false,
      moduleTitle: '1-modul: Asoslar',
    },
    {
      title: 'Amaliy loyiha va yakuniy mashg\'ulot',
      description: 'Olingan bilimlarni birlashtirib, amaliy loyiha bajaramiz.',
      videoUrl: yt(base + 2),
      orderIndex: 3,
      duration: '25 min',
      content: `# Amaliy loyiha\n\nKurs yakunida ${spec.label} bo'yicha kichik amaliy loyiha bajarasiz va ko'nikmalaringizni mustahkamlaysiz.\n\n- Loyiha shartlari\n- Bosqichma-bosqich bajarish\n- Natijani baholash`,
      hasQuiz: false,
      isFreePreview: false,
      moduleTitle: '2-modul: Amaliyot',
    },
  ];
}

function questionsFor(spec: Spec) {
  return [
    {
      questionOrder: 1,
      questionText: `${spec.title} kursini muvaffaqiyatli yakunlash uchun eng muhim omil qaysi?`,
      questionType: 'single',
      options: [
        { text: 'Muntazam mashq va amaliyot', isCorrect: true },
        { text: 'Faqat videoni ko\'rib chiqish', isCorrect: false },
        { text: 'Mashqlarni tashlab ketish', isCorrect: false },
        { text: 'Hech narsa qilmaslik', isCorrect: false },
      ],
      correctAnswers: ['Muntazam mashq va amaliyot'],
      points: 1,
      explanation: 'Bilim amaliyot va muntazam mashq orqali mustahkamlanadi.',
    },
    {
      questionOrder: 2,
      questionText: `Ushbu kursda ${spec.label} bo'yicha amaliy mashg'ulotlar mavjud.`,
      questionType: 'true_false',
      options: [
        { text: 'To\'g\'ri', isCorrect: true },
        { text: 'Noto\'g\'ri', isCorrect: false },
      ],
      correctAnswers: ['To\'g\'ri'],
      points: 1,
      explanation: 'Har bir kurs amaliy mashg\'ulot va yakuniy loyihani o\'z ichiga oladi.',
    },
    {
      questionOrder: 3,
      questionText: 'Samarali o\'rganish uchun quyidagilardan qaysilari foydali? (bir nechta javob)',
      questionType: 'multiple',
      options: [
        { text: 'Amaliyot qilish', isCorrect: true },
        { text: 'Takrorlash', isCorrect: true },
        { text: 'E\'tiborsizlik', isCorrect: false },
        { text: 'Sabrsizlik', isCorrect: false },
      ],
      correctAnswers: ['Amaliyot qilish', 'Takrorlash'],
      points: 1,
      explanation: 'Amaliyot va takrorlash — samarali o\'rganishning asosidir.',
    },
  ];
}

async function main() {
  const email = process.env.TEACHER_EMAIL || 'qa.ustoz@ustozedu.uz';
  let teacher = await prisma.user.findFirst({ where: { email }, select: { id: true, profile: { select: { id: true } } } });
  if (!teacher) {
    teacher = await prisma.user.findFirst({ where: { role: 'teacher' }, select: { id: true, profile: { select: { id: true } } } });
  }
  if (!teacher?.profile?.id) throw new Error('QA ustoz (teacher profile) topilmadi');
  const teacherId = teacher.profile.id;
  console.log('Teacher profile id:', teacherId);

  const cats = await prisma.category.findMany({ select: { id: true, slug: true, name: true } });
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  let created = 0, skipped = 0, videoTopics = 0, tests = 0, assignments = 0;
  const now = new Date();

  for (let i = 0; i < COURSES.length; i++) {
    const spec = COURSES[i];
    const cat = catBySlug.get(spec.slug);
    if (!cat) { console.warn(`⚠️  kategoriya topilmadi: ${spec.slug} — o'tkazildi`); continue; }

    const existing = await prisma.course.findFirst({ where: { teacherId, title: spec.title }, select: { id: true } });
    if (existing) { skipped++; console.log(`↷ mavjud: ${spec.title}`); continue; }

    const course = await prisma.course.create({
      data: {
        teacherId,
        title: spec.title,
        description: spec.desc,
        category: cat.name,
        categoryId: cat.id,
        subjectCategory: spec.subject as never,
        targetAudience: 'all_levels' as never,
        priceUsd: 0,
        priceUzs: BigInt(spec.price),
        coverImage: `https://picsum.photos/seed/ustoz-${spec.slug}-${i}/800/450`,
        language: 'uz',
        difficultyLevel: spec.level,
        totalDuration: 55,
        isPublished: true,
        moderationStatus: 'approved' as never,
        publishedAt: now,
        reviewedAt: now,
      },
    });

    // Mavzular (video darslar)
    const topics = topicsFor(spec, i * 3);
    const createdTopics = [] as { id: string }[];
    for (const tp of topics) {
      const ct = await prisma.courseTopic.create({ data: { courseId: course.id, ...tp } });
      createdTopics.push({ id: ct.id });
      videoTopics++;
    }

    // Test (2-mavzuga bog'liq, savollar bilan)
    const qs = questionsFor(spec);
    const total = qs.reduce((s, q) => s + q.points, 0);
    await prisma.courseTest.create({
      data: {
        teacherId,
        courseId: course.id,
        topicId: createdTopics[1]?.id ?? null,
        title: `${spec.title} — yakuniy test`,
        description: 'Kurs bo\'yicha bilimlaringizni tekshiring.',
        passingScore: 60,
        timeLimitSec: 0,
        allowedAttempts: 0,
        status: 'published',
        showCorrectAnswers: true,
        totalPoints: total,
        moderationStatus: 'approved' as never,
        reviewedAt: now,
        questions: {
          create: qs.map((q) => ({
            questionOrder: q.questionOrder,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options as never,
            correctAnswers: q.correctAnswers as never,
            points: q.points,
            explanation: q.explanation,
          })),
        },
      },
    });
    tests++;

    // Amaliy topshiriq (3-mavzuga bog'liq)
    const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    await prisma.assignment.create({
      data: {
        courseId: course.id,
        teacherId,
        topicId: createdTopics[2]?.id ?? null,
        title: `${spec.label.charAt(0).toUpperCase() + spec.label.slice(1)} bo'yicha amaliy topshiriq`,
        description: 'Kursda o\'rganilgan bilimlarni amalda qo\'llang.',
        instructions: `# Topshiriq\n\n${spec.title} kursidagi bilimlaringiz asosida kichik amaliy ish bajaring:\n\n1. Mavzuni tanlang\n2. Amaliy natija tayyorlang (matn, fayl yoki havola)\n3. Izoh bilan topshiring\n\n**Baholash:** to'liqlik, sifat va mustaqillik.`,
        dueDate: due,
        maxScore: 100,
        submissionType: 'any',
        status: 'published',
        allowLateSubmission: true,
        latePenaltyPercent: 10,
      },
    });
    assignments++;

    created++;
    console.log(`✅ ${spec.title}  (${cat.name})`);
  }

  console.log(`\n──────── XULOSA ────────`);
  console.log(`Yaratilgan kurslar : ${created}`);
  console.log(`O'tkazilgan (mavjud): ${skipped}`);
  console.log(`Video mavzular     : ${videoTopics}`);
  console.log(`Testlar            : ${tests}`);
  console.log(`Topshiriqlar       : ${assignments}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
