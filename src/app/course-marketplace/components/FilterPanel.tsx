'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface FilterOptions {
  priceRange: [number, number];
  currency: 'USD' | 'UZS';
  languages: string[];
  difficulty: string[];
  minRating: number;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

const FilterPanel = ({ filters, onFilterChange, isOpen, onClose }: FilterPanelProps) => {
  const { t } = useI18n();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const languages = [
    { code: 'uz', name: 'O\'zbek' },
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' }
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  
  const targetAudiences = [
    { value: 'preschoolers', label: 'Maktabgacha yoshdagilar' },
    { value: 'primary_school', label: "Boshlang\'ich sinf" },
    { value: 'middle_school', label: "O\'rta sinf" },
    { value: 'high_school', label: 'Yuqori sinf' },
    { value: 'school_students', label: "Maktab o\'quvchilari (umumiy)" },
    { value: 'university_applicants', label: 'Abituriyentlar' },
    { value: 'university_students', label: 'Talabalar' },
    { value: 'professionals', label: 'Mutaxassislar' },
    { value: 'adults', label: 'Kattalar' },
    { value: 'seniors', label: 'Keksalar' },
    { value: 'independent_learners', label: "Mustaqil o\'rganuvchilar" },
    { value: 'all_levels', label: 'Barcha darajalar' },
  ];

  // Universal kategoriya guruhlari
  const subjectGroups: Array<{ group: string; options: { value: string; label: string }[] }> = [
    {
      group: 'Tabiiy fanlar',
      options: [
        { value: 'mathematics', label: 'Matematika' },
        { value: 'physics', label: 'Fizika' },
        { value: 'chemistry', label: 'Kimyo' },
        { value: 'biology', label: 'Biologiya' },
        { value: 'geometry', label: 'Geometriya' },
        { value: 'algebra', label: 'Algebra' },
        { value: 'astronomy', label: 'Astronomiya' },
        { value: 'ecology', label: 'Ekologiya' },
      ],
    },
    {
      group: 'Dasturlash va IT',
      options: [
        { value: 'informatics', label: 'Informatika' },
        { value: 'programming', label: 'Dasturlash' },
        { value: 'web_development', label: 'Web Development' },
        { value: 'mobile_development', label: 'Mobile Development' },
        { value: 'data_science', label: 'Data Science' },
        { value: 'artificial_intelligence', label: "Sun\'iy Intellekt" },
      ],
    },
    {
      group: 'Tillar',
      options: [
        { value: 'uzbek_language', label: "O\'zbek tili" },
        { value: 'english_language', label: 'Ingliz tili' },
        { value: 'russian_language', label: 'Rus tili' },
        { value: 'arabic_language', label: 'Arab tili' },
        { value: 'chinese_language', label: 'Xitoy tili' },
        { value: 'korean_language', label: 'Koreys tili' },
        { value: 'german_language', label: 'Nemis tili' },
        { value: 'french_language', label: 'Fransuz tili' },
        { value: 'turkish_language', label: 'Turk tili' },
        { value: 'spanish_language', label: 'Ispan tili' },
        { value: 'japanese_language', label: 'Yapon tili' },
      ],
    },
    {
      group: 'Gumanitar fanlar',
      options: [
        { value: 'history', label: 'Tarix' },
        { value: 'geography', label: 'Geografiya' },
        { value: 'philosophy', label: 'Falsafa' },
        { value: 'literature', label: 'Adabiyot' },
        { value: 'sociology', label: 'Sotsiologiya' },
      ],
    },
    {
      group: "San\'at va ijodiyot",
      options: [
        { value: 'music', label: 'Musiqa' },
        { value: 'singing', label: 'Ashula' },
        { value: 'painting', label: 'Rangtasvir' },
        { value: 'drawing', label: 'Rasm chizish' },
        { value: 'photography', label: 'Fotografiya' },
        { value: 'videography', label: 'Videografiya' },
        { value: 'cinema', label: 'Kino' },
        { value: 'theater', label: 'Teatr' },
        { value: 'dance', label: 'Raqs' },
        { value: 'design', label: 'Dizayn' },
      ],
    },
    {
      group: 'Hunarmandchilik',
      options: [
        { value: 'pottery', label: 'Kulolchilik' },
        { value: 'woodworking', label: "Yog\'och ustachiligi" },
        { value: 'sewing', label: 'Tikuvchilik' },
        { value: 'knitting', label: "To\'qish" },
        { value: 'embroidery', label: 'Kashtachilik' },
        { value: 'handcraft', label: "Qo\'l hunari" },
        { value: 'jewelry', label: 'Zargarlik' },
      ],
    },
    {
      group: 'Kasb-hunar',
      options: [
        { value: 'cooking', label: 'Pazandachilik' },
        { value: 'confectionery', label: 'Qandolatchilik' },
        { value: 'barbering', label: 'Sartaroshlik' },
        { value: 'hairstyling', label: 'Soch turmaklash' },
        { value: 'makeup', label: 'Vizaj' },
        { value: 'manicure', label: 'Manikyur' },
        { value: 'tailoring', label: 'Bichuv-tikuv' },
      ],
    },
    {
      group: 'Sport va salomatlik',
      options: [
        { value: 'fitness', label: 'Fitnes' },
        { value: 'yoga', label: 'Yoga' },
        { value: 'football', label: 'Futbol' },
        { value: 'basketball', label: 'Basketbol' },
        { value: 'martial_arts', label: "Jang san\'atlari" },
        { value: 'swimming', label: 'Suzish' },
        { value: 'chess', label: 'Shaxmat' },
        { value: 'nutrition', label: "To\'g\'ri ovqatlanish" },
        { value: 'sports_general', label: 'Sport (umumiy)' },
      ],
    },
    {
      group: 'Tibbiyot va psixologiya',
      options: [
        { value: 'pharmacy', label: 'Farmatsevtika' },
        { value: 'nursing', label: 'Hamshiralik' },
        { value: 'psychology', label: 'Psixologiya' },
        { value: 'medicine_general', label: 'Tibbiyot (umumiy)' },
        { value: 'first_aid', label: 'Ilk tibbiy yordam' },
      ],
    },
    {
      group: 'Huquq',
      options: [
        { value: 'law_general', label: 'Huquq (umumiy)' },
        { value: 'civil_law', label: 'Fuqarolik huquqi' },
        { value: 'tax_law', label: 'Soliq huquqi' },
      ],
    },
    {
      group: "Qishloq xo\'jaligi",
      options: [
        { value: 'agriculture', label: 'Dehqonchilik' },
        { value: 'gardening', label: "Bog\'dorchilik" },
        { value: 'livestock', label: 'Chorvachilik' },
        { value: 'beekeeping', label: 'Asalarichilik' },
      ],
    },
    {
      group: 'Texnika va muhandislik',
      options: [
        { value: 'engineering_general', label: 'Muhandislik (umumiy)' },
        { value: 'electrical', label: 'Elektrik' },
        { value: 'mechanics', label: 'Mexanika' },
        { value: 'construction', label: 'Qurilish' },
        { value: 'automotive', label: 'Avto' },
        { value: 'plumbing', label: 'Santexnika' },
      ],
    },
    {
      group: 'Biznes va boshqaruv',
      options: [
        { value: 'business_management', label: 'Biznes boshqaruvi' },
        { value: 'entrepreneurship', label: 'Tadbirkorlik' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'finance', label: 'Moliya' },
        { value: 'accounting', label: 'Buxgalteriya' },
        { value: 'logistics', label: 'Logistika' },
        { value: 'project_management', label: 'Loyiha boshqaruvi' },
        { value: 'hr_management', label: 'HR boshqaruvi' },
      ],
    },
    {
      group: 'Shaxsiy rivojlanish',
      options: [
        { value: 'leadership', label: 'Yetakchilik' },
        { value: 'public_speaking', label: 'Notiqlik' },
        { value: 'time_management', label: 'Vaqt boshqaruvi' },
        { value: 'sales', label: 'Sotuv' },
        { value: 'negotiation', label: 'Muzokara olib borish' },
        { value: 'personal_development', label: 'Shaxsiy rivojlanish' },
      ],
    },
    {
      group: 'Bolalar va ota-onalar',
      options: [
        { value: 'early_development', label: 'Erta rivojlanish' },
        { value: 'parenting', label: 'Ota-onalik' },
        { value: 'child_psychology', label: 'Bola psixologiyasi' },
      ],
    },
    {
      group: "Din va ma\'naviyat",
      options: [
        { value: 'religion_islam', label: 'Islom asoslari' },
        { value: 'quran_studies', label: "Qur\'on ilmlari" },
        { value: 'arabic_studies', label: 'Arab tili (diniy)' },
        { value: 'religion_general', label: 'Din (umumiy)' },
      ],
    },
    {
      group: 'Boshqa',
      options: [{ value: 'other', label: 'Boshqa' }],
    },
  ];

  const gradeLevels = Array.from({ length: 11 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}-sinf`
  }));

  const isSchoolAudience =
    localFilters.targetAudience === 'school_students' ||
    localFilters.targetAudience === 'primary_school' ||
    localFilters.targetAudience === 'middle_school' ||
    localFilters.targetAudience === 'high_school' ||
    localFilters.targetAudience === 'university_applicants';

  const handlePriceChange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...localFilters.priceRange] as [number, number];
    newRange[index] = value;
    setLocalFilters({ ...localFilters, priceRange: newRange });
  };

  const handleLanguageToggle = (langCode: string) => {
    const newLanguages = localFilters.languages.includes(langCode)
      ? localFilters.languages.filter(l => l !== langCode)
      : [...localFilters.languages, langCode];
    setLocalFilters({ ...localFilters, languages: newLanguages });
  };

  const handleDifficultyToggle = (difficulty: string) => {
    const newDifficulty = localFilters.difficulty.includes(difficulty)
      ? localFilters.difficulty.filter(d => d !== difficulty)
      : [...localFilters.difficulty, difficulty];
    setLocalFilters({ ...localFilters, difficulty: newDifficulty });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      priceRange: [0, 1000],
      currency: 'USD',
      languages: [],
      difficulty: [],
      minRating: 0,
      targetAudience: '',
      subjectCategory: '',
      gradeLevel: ''
    };
    setLocalFilters(resetFilters);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Filter Panel */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-auto
          w-80 lg:w-full bg-card rounded-md shadow-warm p-6
          overflow-y-auto z-50 lg:z-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">{t("misc.filters")}</h3>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-muted rounded-md transition-smooth"
          >
            <Icon name="XMarkIcon" size={20} className="text-foreground" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Price Range
            </label>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, currency: 'USD' })}
                  className={`px-3 py-1 rounded-md text-sm transition-smooth ${
                    localFilters.currency === 'USD' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-border'
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setLocalFilters({ ...localFilters, currency: 'UZS' })}
                  className={`px-3 py-1 rounded-md text-sm transition-smooth ${
                    localFilters.currency === 'UZS' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-border'
                  }`}
                >
                  UZS
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground w-12">Min:</span>
                  <input
                    type="number"
                    value={localFilters.priceRange[0]}
                    onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                    className="flex-1 px-3 py-1 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground w-12">Max:</span>
                  <input
                    type="number"
                    value={localFilters.priceRange[1]}
                    onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                    className="flex-1 px-3 py-1 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={localFilters.priceRange[1]}
                onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Auditoriya
            </label>
            <select
              value={localFilters.targetAudience}
              onChange={(e) => setLocalFilters({ ...localFilters, targetAudience: e.target.value, subjectCategory: '', gradeLevel: '' })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t('groups.allLabel')}</option>
              {targetAudiences.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Subject Category */}
          {localFilters.targetAudience && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Fan nomi
              </label>
              <select
                value={localFilters.subjectCategory}
                onChange={(e) => setLocalFilters({ ...localFilters, subjectCategory: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Barchasi</option>
                {subjectGroups.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((subject) => (
                      <option key={subject.value} value={subject.value}>
                        {subject.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          
          {/* Grade Level (only for school students) */}
          {isSchoolAudience && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Sinf
              </label>
              <select
                value={localFilters.gradeLevel}
                onChange={(e) => setLocalFilters({ ...localFilters, gradeLevel: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Barchasi</option>
                {gradeLevels.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Language
            </label>
            <div className="space-y-2">
              {languages.map((lang) => (
                <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.languages.includes(lang.code)}
                    onChange={() => handleLanguageToggle(lang.code)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{lang.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Difficulty Level
            </label>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <label key={difficulty} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.difficulty.includes(difficulty)}
                    onChange={() => handleDifficultyToggle(difficulty)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{difficulty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Minimum Rating
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={localFilters.minRating}
                onChange={(e) => setLocalFilters({ ...localFilters, minRating: Number(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <div className="flex items-center space-x-1 min-w-[60px]">
                <Icon name="StarIcon" size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-foreground">{localFilters.minRating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-border">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-border transition-smooth font-medium"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;