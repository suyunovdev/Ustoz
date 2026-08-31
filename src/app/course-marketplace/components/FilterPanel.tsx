'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { buildSubjectGroups, buildTargetAudiences, buildGradeLevels } from '@/lib/data/subject-groups';

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

  const difficulties = [
    { value: 'Beginner', label: t('misc.beginner') },
    { value: 'Intermediate', label: t('misc.intermediate') },
    { value: 'Advanced', label: t('misc.advanced') },
  ];
  
  const targetAudiences = buildTargetAudiences(t);
  // Fan guruhlari — kurs yaratish formasi bilan yagona manba (subject-groups.ts).
  const subjectGroups = buildSubjectGroups(t);
  const gradeLevels = buildGradeLevels(t);

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
      priceRange: [0, 5000000],
      currency: 'UZS',
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
              {t('misc.priceRange')}
            </label>
            <div className="space-y-4">
              {/* Valyuta toggle olib tashlandi — platforma to'liq so'mda */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">so'm</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground w-12">{t('marketplace.min')}:</span>
                  <input
                    type="number"
                    value={localFilters.priceRange[0]}
                    onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                    className="flex-1 px-3 py-1 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground w-12">{t('marketplace.max')}:</span>
                  <input
                    type="number"
                    value={localFilters.priceRange[1]}
                    onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                    className="flex-1 px-3 py-1 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
              </div>
              {/* Slayder so'm miqyosida (ilgari max=1000 edi — barcha real kurslarni
                  filtrlab tashlardi). 0–5 mln so'm, 50 ming qadam. */}
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={localFilters.priceRange[1]}
                onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="filter-audience" className="block text-sm font-medium text-foreground mb-3">
              {t('misc.audience')}
            </label>
            <select
              id="filter-audience"
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
              <label htmlFor="filter-subject" className="block text-sm font-medium text-foreground mb-3">
                {t('misc.subjectName')}
              </label>
              <select
                id="filter-subject"
                value={localFilters.subjectCategory}
                onChange={(e) => setLocalFilters({ ...localFilters, subjectCategory: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('misc.all')}</option>
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
              <label htmlFor="filter-grade" className="block text-sm font-medium text-foreground mb-3">
                {t('misc.grade')}
              </label>
              <select
                id="filter-grade"
                value={localFilters.gradeLevel}
                onChange={(e) => setLocalFilters({ ...localFilters, gradeLevel: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('misc.all')}</option>
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
              {t('misc.language')}
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
              {t('misc.difficultyLevelLabel')}
            </label>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <label key={difficulty.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.difficulty.includes(difficulty.value)}
                    onChange={() => handleDifficultyToggle(difficulty.value)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-foreground">{difficulty.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              {t('misc.minimumRating')}
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
              {t('misc.applyFilters')}
            </button>
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-border transition-smooth font-medium"
            >
              {t('misc.resetAll')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;