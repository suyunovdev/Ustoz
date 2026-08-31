/**
 * Fan kategoriyalari guruhlari — TARJIMALANGAN (i18n).
 *
 * Yagona manba: marketplace filtri (FilterPanel) ham, kurs yaratish formasi
 * (CourseMetadataForm) ham SHU builder'ni ishlatadi — aks holda ~90 elementli
 * ro'yxat ikki joyda takrorlanib, biri o'zbekchada qotib qolardi (RU/EN buzilardi).
 *
 * Label'lar `categories.<value>` kalitlaridan, guruh nomlari `marketplace.group*`
 * kalitlaridan olinadi (ikkalasi ham barcha 3 tilda mavjud).
 */
import type { TParams } from '@/lib/i18n';

export type Translate = (key: string, params?: TParams) => string;

export interface SubjectOption {
  value: string;
  label: string;
}
export interface SubjectGroup {
  group: string;
  options: SubjectOption[];
}

/** Guruh tarjima kaliti + shu guruhga tegishli SubjectCategory qiymatlari. */
const GROUP_DEFS: ReadonlyArray<{ key: string; values: readonly string[] }> = [
  { key: 'marketplace.groupNaturalSciences', values: ['mathematics', 'physics', 'chemistry', 'biology', 'geometry', 'algebra', 'astronomy', 'ecology'] },
  { key: 'marketplace.groupProgrammingIt', values: ['informatics', 'programming', 'web_development', 'mobile_development', 'data_science', 'artificial_intelligence'] },
  { key: 'marketplace.groupLanguages', values: ['uzbek_language', 'english_language', 'russian_language', 'arabic_language', 'chinese_language', 'korean_language', 'german_language', 'french_language', 'turkish_language', 'spanish_language', 'japanese_language'] },
  { key: 'marketplace.groupHumanities', values: ['history', 'geography', 'philosophy', 'literature', 'sociology'] },
  { key: 'marketplace.groupArtCreativity', values: ['music', 'singing', 'painting', 'drawing', 'photography', 'videography', 'cinema', 'theater', 'dance', 'design'] },
  { key: 'marketplace.groupHandicrafts', values: ['pottery', 'woodworking', 'sewing', 'knitting', 'embroidery', 'handcraft', 'jewelry'] },
  { key: 'marketplace.groupVocational', values: ['cooking', 'confectionery', 'barbering', 'hairstyling', 'makeup', 'manicure', 'tailoring'] },
  { key: 'marketplace.groupSportsHealth', values: ['fitness', 'yoga', 'football', 'basketball', 'martial_arts', 'swimming', 'chess', 'nutrition', 'sports_general'] },
  { key: 'marketplace.groupMedicinePsychology', values: ['pharmacy', 'nursing', 'psychology', 'medicine_general', 'first_aid'] },
  { key: 'marketplace.groupLaw', values: ['law_general', 'civil_law', 'tax_law'] },
  { key: 'marketplace.groupAgriculture', values: ['agriculture', 'gardening', 'livestock', 'beekeeping'] },
  { key: 'marketplace.groupEngineering', values: ['engineering_general', 'electrical', 'mechanics', 'construction', 'automotive', 'plumbing'] },
  { key: 'marketplace.groupBusinessManagement', values: ['business_management', 'entrepreneurship', 'marketing', 'finance', 'accounting', 'logistics', 'project_management', 'hr_management'] },
  { key: 'marketplace.groupPersonalDevelopment', values: ['leadership', 'public_speaking', 'time_management', 'sales', 'negotiation', 'personal_development'] },
  { key: 'marketplace.groupChildrenParents', values: ['early_development', 'parenting', 'child_psychology'] },
  { key: 'marketplace.groupReligionSpirituality', values: ['religion_islam', 'quran_studies', 'arabic_studies', 'religion_general'] },
  { key: 'marketplace.groupOther', values: ['other'] },
];

/** Tarjimalangan fan guruhlari (label -> categories.*, group -> marketplace.group*). */
export function buildSubjectGroups(t: Translate): SubjectGroup[] {
  return GROUP_DEFS.map((g) => ({
    group: t(g.key),
    options: g.values.map((value) => ({ value, label: t('categories.' + value) })),
  }));
}

/** Maqsadli auditoriya ro'yxati (misc.* kalitlari bilan). */
export function buildTargetAudiences(t: Translate): SubjectOption[] {
  return [
    { value: 'preschoolers', label: t('misc.preschoolers') },
    { value: 'primary_school', label: t('misc.primarySchool') },
    { value: 'middle_school', label: t('misc.middleSchool') },
    { value: 'high_school', label: t('misc.highSchool') },
    { value: 'school_students', label: t('misc.schoolStudents') },
    { value: 'university_applicants', label: t('misc.universityApplicants') },
    { value: 'university_students', label: t('misc.universityStudents') },
    { value: 'professionals', label: t('misc.professionals') },
    { value: 'adults', label: t('misc.adults') },
    { value: 'seniors', label: t('misc.seniors') },
    { value: 'independent_learners', label: t('misc.independentLearners') },
    { value: 'all_levels', label: t('misc.allLevels') },
  ];
}

/** Sinf darajalari 1–11 (marketplace.gradeLevel kaliti bilan). */
export function buildGradeLevels(t: Translate): SubjectOption[] {
  return Array.from({ length: 11 }, (_, i) => ({
    value: String(i + 1),
    label: t('marketplace.gradeLevel', { grade: i + 1 }),
  }));
}
