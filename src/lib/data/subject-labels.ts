/**
 * Universal SubjectCategory va TargetAudience uchun o'zbekcha label'lar.
 * UI komponentlari shu yagona manbadan label oladi.
 */

export const SUBJECT_LABELS: Record<string, string> = {
  // Tabiiy fanlar
  mathematics: 'Matematika',
  physics: 'Fizika',
  chemistry: 'Kimyo',
  biology: 'Biologiya',
  geometry: 'Geometriya',
  algebra: 'Algebra',
  astronomy: 'Astronomiya',
  ecology: 'Ekologiya',
  // Dasturlash va IT
  informatics: 'Informatika',
  programming: 'Dasturlash',
  web_development: 'Web Development',
  mobile_development: 'Mobile Development',
  data_science: 'Data Science',
  artificial_intelligence: "Sun'iy Intellekt",
  // Tillar
  uzbek_language: "O'zbek tili",
  english_language: 'Ingliz tili',
  russian_language: 'Rus tili',
  arabic_language: 'Arab tili',
  chinese_language: 'Xitoy tili',
  korean_language: 'Koreys tili',
  german_language: 'Nemis tili',
  french_language: 'Fransuz tili',
  turkish_language: 'Turk tili',
  spanish_language: 'Ispan tili',
  japanese_language: 'Yapon tili',
  // Gumanitar
  history: 'Tarix',
  geography: 'Geografiya',
  philosophy: 'Falsafa',
  literature: 'Adabiyot',
  sociology: 'Sotsiologiya',
  // San'at va ijodiyot
  music: 'Musiqa',
  singing: 'Ashula',
  painting: 'Rangtasvir',
  drawing: 'Rasm chizish',
  photography: 'Fotografiya',
  videography: 'Videografiya',
  cinema: 'Kino',
  theater: 'Teatr',
  dance: 'Raqs',
  design: 'Dizayn',
  // Hunarmandchilik
  pottery: 'Kulolchilik',
  woodworking: "Yog'och ustachiligi",
  sewing: 'Tikuvchilik',
  knitting: "To'qish",
  embroidery: 'Kashtachilik',
  handcraft: "Qo'l hunari",
  jewelry: 'Zargarlik',
  // Kasb-hunar
  cooking: 'Pazandachilik',
  confectionery: 'Qandolatchilik',
  barbering: 'Sartaroshlik',
  hairstyling: 'Soch turmaklash',
  makeup: 'Vizaj',
  manicure: 'Manikyur',
  tailoring: 'Bichuv-tikuv',
  // Sport
  fitness: 'Fitnes',
  yoga: 'Yoga',
  football: 'Futbol',
  basketball: 'Basketbol',
  martial_arts: "Jang san'atlari",
  swimming: 'Suzish',
  chess: 'Shaxmat',
  nutrition: "To'g'ri ovqatlanish",
  sports_general: 'Sport',
  // Tibbiyot
  pharmacy: 'Farmatsevtika',
  nursing: 'Hamshiralik',
  psychology: 'Psixologiya',
  medicine_general: 'Tibbiyot',
  first_aid: 'Ilk tibbiy yordam',
  // Huquq
  law_general: 'Huquq',
  civil_law: 'Fuqarolik huquqi',
  tax_law: 'Soliq huquqi',
  // Qishloq xo'jaligi
  agriculture: 'Dehqonchilik',
  gardening: "Bog'dorchilik",
  livestock: 'Chorvachilik',
  beekeeping: 'Asalarichilik',
  // Texnika
  engineering_general: 'Muhandislik',
  electrical: 'Elektrik',
  mechanics: 'Mexanika',
  construction: 'Qurilish',
  automotive: 'Avto',
  plumbing: 'Santexnika',
  // Soft skills
  leadership: 'Yetakchilik',
  public_speaking: 'Notiqlik',
  time_management: 'Vaqt boshqaruvi',
  sales: 'Sotuv',
  negotiation: 'Muzokara',
  personal_development: 'Shaxsiy rivojlanish',
  // Bolalar
  early_development: 'Erta rivojlanish',
  parenting: 'Ota-onalik',
  child_psychology: 'Bola psixologiyasi',
  // Din
  religion_islam: 'Islom asoslari',
  quran_studies: "Qur'on ilmlari",
  arabic_studies: 'Arab tili (diniy)',
  religion_general: 'Din',
  // Biznes
  business_management: 'Biznes boshqaruvi',
  entrepreneurship: 'Tadbirkorlik',
  marketing: 'Marketing',
  finance: 'Moliya',
  accounting: 'Buxgalteriya',
  logistics: 'Logistika',
  project_management: 'Loyiha boshqaruvi',
  hr_management: 'HR boshqaruvi',
  // Boshqa
  other: 'Boshqa',
};

export const AUDIENCE_LABELS: Record<string, string> = {
  preschoolers: 'Maktabgacha yoshdagilar',
  primary_school: "Boshlang'ich sinf",
  middle_school: "O'rta sinf",
  high_school: 'Yuqori sinf',
  school_students: "Maktab o'quvchilari",
  university_applicants: 'Abituriyentlar',
  university_students: 'Talabalar',
  professionals: 'Mutaxassislar',
  adults: 'Kattalar',
  seniors: 'Keksalar',
  independent_learners: 'Mustaqil',
  all_levels: 'Barcha darajalar',
};

export function getSubjectLabel(value: string | null | undefined): string {
  if (!value) return '';
  return SUBJECT_LABELS[value] ?? value;
}

export function getAudienceLabel(value: string | null | undefined): string {
  if (!value) return '';
  return AUDIENCE_LABELS[value] ?? value;
}
