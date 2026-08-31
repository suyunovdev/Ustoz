'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { buildSubjectGroups, buildTargetAudiences, buildGradeLevels } from '@/lib/data/subject-groups';
import AppImage from '@/components/ui/AppImage';

interface CourseMetadata {
  title: string;
  description: string;
  category: string;
  priceUZS: string;
  coverImage: string;
  language: string;
  targetAudience: string;
  subjectCategory: string;
  gradeLevel: string;
}

interface CourseMetadataFormProps {
  metadata: CourseMetadata;
  onMetadataChange: (metadata: CourseMetadata) => void;
}

const CourseMetadataForm = ({ metadata, onMetadataChange }: CourseMetadataFormProps) => {
  const { t } = useI18n();
  const [imagePreview, setImagePreview] = useState(metadata.coverImage);

  const languages = [
    { code: 'uz', name: "O\'zbek" },
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' }
  ];

  const targetAudiences = buildTargetAudiences(t);
  // Fan guruhlari — marketplace filtri bilan yagona manba (subject-groups.ts).
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        onMetadataChange({ ...metadata, coverImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof CourseMetadata, value: string) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      <h3 className="text-xl font-heading font-semibold text-foreground">{t('courseCreation.courseInfo')}</h3>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.coverImage')}</label>
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-48 h-32 rounded-md overflow-hidden bg-muted border border-border">
            {imagePreview ? (
              <AppImage
                src={imagePreview}
                alt="Course cover preview showing uploaded image"
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
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.courseTitle')}</label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={t('courseCreation.courseTitlePlaceholder')}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.courseDescription')}</label>
        <textarea
          value={metadata.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('courseCreation.courseDescriptionPlaceholder')}
          rows={4}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          required
        />
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.targetAudience')}</label>
        <select
          value={metadata.targetAudience}
          onChange={(e) => handleChange('targetAudience', e.target.value)}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="">{t('courseCreation.selectAudience')}</option>
          {targetAudiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.subjectName')}</label>
        <select
          value={metadata.subjectCategory}
          onChange={(e) => handleChange('subjectCategory', e.target.value)}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
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
      </div>

      {/* Grade Level (only for school students) */}
      {isSchoolAudience && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.gradeLevel')}</label>
          <select
            value={metadata.gradeLevel}
            onChange={(e) => handleChange('gradeLevel', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">{t('courseCreation.selectGrade')}</option>
            {gradeLevels.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category and Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.category')}</label>
          <select
            value={metadata.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">{t('courseCreation.selectCategory')}</option>
            <option value="Programming">{t('categories.programming')}</option>
            <option value="Design">{t('categories.design')}</option>
            <option value="Business">{t('categories.business')}</option>
            <option value="Marketing">{t('categories.marketing')}</option>
            <option value="Science">{t('categories.science')}</option>
            <option value="Mathematics">{t('categories.mathematics')}</option>
            <option value="Languages">{t('categories.languages')}</option>
            <option value="Other">{t('categories.other')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.language')}</label>
          <select
            value={metadata.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">{t('courseCreation.selectLanguage')}</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing — faqat so'mda (platforma to'liq so'mda) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{t('courseCreation.priceUZS')}</label>
        <div className="relative">
          <input
            type="number"
            value={metadata.priceUZS}
            onChange={(e) => handleChange('priceUZS', e.target.value)}
            placeholder="0"
            min="0"
            step="1000"
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground caption">so'm</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Bepul kurs uchun 0 kiriting.</p>
      </div>
    </div>
  );
};

export default CourseMetadataForm;