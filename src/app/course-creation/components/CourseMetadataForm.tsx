'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { buildSubjectGroups, buildTargetAudiences, buildGradeLevels } from '@/lib/data/subject-groups';
import AppImage from '@/components/ui/AppImage';
import NumberInput from '@/components/ui/NumberInput';
import FormField, { fieldClasses } from '@/components/ui/FormField';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface CourseMetadata {
  title: string;
  description: string;
  category: string;
  priceUZS: string;
  coverImage: string;
  language: string;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
  difficultyLevel: string;
}

interface CourseMetadataFormProps {
  metadata: CourseMetadata;
  onMetadataChange: (metadata: CourseMetadata) => void;
}

/**
 * Kurs metadatasi formasi — YAGONA MUHARRIRdagi "Kurs sozlamalari" panelida ishlatiladi
 * (muqova, tavsif, narx, daraja...). Tashqi karta/sarlavhani ota-komponent beradi, shuning
 * uchun bu yerda faqat maydonlar (bare field group). Nom/tavsif/muqova "nashr uchun kerak"
 * deb belgilanadi (submit blokerlari); qolganlar ixtiyoriy — soxta `required` yo'q.
 */
const CourseMetadataForm = ({ metadata, onMetadataChange }: CourseMetadataFormProps) => {
  const { t } = useI18n();
  const [imagePreview, setImagePreview] = useState(metadata.coverImage);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Tashqaridan (masalan kurs yuklangach) coverImage o'zgarsa preview'ni sinxronlaymiz.
  useEffect(() => {
    setImagePreview(metadata.coverImage);
  }, [metadata.coverImage]);

  useEffect(() => {
    let alive = true;
    fetch('/api/categories', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.categories) {
          setCategories(data.categories.map((c: CategoryOption) => ({ id: c.id, name: c.name, slug: c.slug })));
        }
      })
      .catch(() => { /* tarmoq xatosi — bo'sh ro'yxat, placeholder ko'rinadi */ });
    return () => { alive = false; };
  }, []);

  const languages = [
    { code: 'uz', name: "O\'zbek" },
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' }
  ];

  const targetAudiences = buildTargetAudiences(t);
  const subjectGroups = buildSubjectGroups(t);
  const gradeLevels = buildGradeLevels(t);

  const isSchoolAudience =
    metadata.targetAudience === 'school_students' ||
    metadata.targetAudience === 'primary_school' ||
    metadata.targetAudience === 'middle_school' ||
    metadata.targetAudience === 'high_school' ||
    metadata.targetAudience === 'university_applicants';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const src = reader.result as string;
      // Muqova base64 (data URL) sifatida saqlanadi — katta rasm DB limitidan
      // oshib ketmasligi va sahifa tez yuklanishi uchun canvas bilan ixchamlaymiz
      // (max 1280px, JPEG). Natijada base64 ~10x kichrayadi.
      const img = new window.Image();
      img.onload = () => {
        const MAX_W = 1280;
        const scale = Math.min(1, MAX_W / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        let out = src;
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          out = canvas.toDataURL('image/jpeg', 0.82);
        }
        setImagePreview(out);
        onMetadataChange({ ...metadata, coverImage: out });
      };
      img.onerror = () => {
        setImagePreview(src);
        onMetadataChange({ ...metadata, coverImage: src });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field: keyof CourseMetadata, value: string) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Cover Image — nashr uchun kerak */}
      <FormField label={t('courseCreation.coverImage')} required hint={t('teacher.requiredToPublish')}>
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-48 h-32 rounded-md overflow-hidden bg-muted border border-border">
            {imagePreview ? (
              <AppImage
                src={imagePreview}
                alt={t('courseCreation.coverAlt')}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="PhotoIcon" size={48} className="text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="cover-image-upload"
            />
            <label
              htmlFor="cover-image-upload"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth cursor-pointer"
            >
              <Icon name="ArrowUpTrayIcon" size={20} />
              <span className="font-medium">{t('courseCreation.uploadImage')}</span>
            </label>
            <p className="caption text-muted-foreground mt-2">{t('courseCreation.imageRecommendation')}</p>
          </div>
        </div>
      </FormField>

      {/* Title — nashr uchun kerak */}
      <FormField label={t('courseCreation.courseTitle')} htmlFor="cmf-title" required hint={t('teacher.requiredToPublish')}>
        <input
          id="cmf-title"
          type="text"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={t('courseCreation.courseTitlePlaceholder')}
          className={fieldClasses()}
        />
      </FormField>

      {/* Description — nashr uchun kerak */}
      <FormField label={t('courseCreation.courseDescription')} htmlFor="cmf-desc" required hint={t('teacher.requiredToPublish')}>
        <textarea
          id="cmf-desc"
          value={metadata.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('courseCreation.courseDescriptionPlaceholder')}
          rows={4}
          className={`${fieldClasses()} resize-none`}
        />
      </FormField>

      {/* Target Audience */}
      <FormField label={t('courseCreation.targetAudience')} htmlFor="cmf-audience">
        <select
          id="cmf-audience"
          value={metadata.targetAudience}
          onChange={(e) => handleChange('targetAudience', e.target.value)}
          className={fieldClasses()}
        >
          <option value="">{t('courseCreation.selectAudience')}</option>
          {targetAudiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </select>
      </FormField>

      {/* Subject Category */}
      <FormField
        label={t('courseCreation.subjectName')}
        htmlFor="cmf-subject"
        hint={!metadata.targetAudience ? t('courseCreation.selectSubjectFirst') : undefined}
      >
        <select
          id="cmf-subject"
          value={metadata.subjectCategory}
          onChange={(e) => handleChange('subjectCategory', e.target.value)}
          className={`${fieldClasses()} disabled:opacity-60 disabled:cursor-not-allowed`}
          disabled={!metadata.targetAudience}
        >
          <option value="">{!metadata.targetAudience ? t('courseCreation.selectSubjectFirst') : t('courseCreation.selectSubject')}</option>
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
      </FormField>

      {/* Grade Level (only for school students) */}
      {isSchoolAudience && (
        <FormField label={t('courseCreation.gradeLevel')} htmlFor="cmf-grade">
          <select
            id="cmf-grade"
            value={metadata.gradeLevel}
            onChange={(e) => handleChange('gradeLevel', e.target.value)}
            className={fieldClasses()}
          >
            <option value="">{t('courseCreation.selectGrade')}</option>
            {gradeLevels.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </FormField>
      )}

      {/* Category and Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('courseCreation.category')} htmlFor="cmf-category">
          <select
            id="cmf-category"
            value={metadata.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className={fieldClasses()}
          >
            <option value="">{t('courseCreation.selectCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('courseCreation.language')} htmlFor="cmf-language">
          <select
            id="cmf-language"
            value={metadata.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className={fieldClasses()}
          >
            <option value="">{t('courseCreation.selectLanguage')}</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Difficulty level — bozorda daraja filtriga tushishi uchun */}
      <FormField label={t('courseCreation.difficultyLevel')} htmlFor="cmf-difficulty">
        <select
          id="cmf-difficulty"
          value={metadata.difficultyLevel}
          onChange={(e) => handleChange('difficultyLevel', e.target.value)}
          className={fieldClasses()}
        >
          <option value="">{t('courseCreation.selectDifficulty')}</option>
          <option value="Beginner">{t('misc.beginner')}</option>
          <option value="Intermediate">{t('misc.intermediate')}</option>
          <option value="Advanced">{t('misc.advanced')}</option>
        </select>
      </FormField>

      {/* Pricing — faqat so'mda (platforma to'liq so'mda) */}
      <FormField label={t('courseCreation.priceUZS')} htmlFor="cmf-price" hint={t('courseCreation.freeHint')}>
        <div className="relative">
          <NumberInput
            id="cmf-price"
            value={parseInt(metadata.priceUZS) || 0}
            onValueChange={(n) => handleChange('priceUZS', String(n))}
            placeholder="0"
            min={0}
            step={1000}
            className={`${fieldClasses()} pr-14`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground caption pointer-events-none">
            {t('courseCreation.som')}
          </span>
        </div>
      </FormField>
    </div>
  );
};

export default CourseMetadataForm;
