'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface CourseMetadata {
  title: string;
  description: string;
  category: string;
  priceUSD: string;
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
  const [imagePreview, setImagePreview] = useState(metadata.coverImage);

  const languages = [
    { code: 'uz', name: "O\'zbek" },
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' }
  ];

  const targetAudiences = [
    { value: 'preschoolers', label: 'Maktabgacha yoshdagi bolalar' },
    { value: 'primary_school', label: 'Boshlang\'ich sinf o\'quvchilari (1–4)' },
    { value: 'middle_school', label: "O\'rta sinf o\'quvchilari (5–9)" },
    { value: 'high_school', label: "Yuqori sinf o\'quvchilari (10–11)" },
    { value: 'school_students', label: "Maktab o\'quvchilari (umumiy)" },
    { value: 'university_applicants', label: 'Abituriyentlar' },
    { value: 'university_students', label: 'Talabalar' },
    { value: 'professionals', label: 'Mutaxassis va kasb egalari' },
    { value: 'adults', label: 'Kattalar' },
    { value: 'seniors', label: 'Keksalar' },
    { value: 'independent_learners', label: 'Mustaqil rivojlanishni istovchilar' },
    { value: 'all_levels', label: 'Barcha darajalar uchun' },
  ];

  // Universal kategoriya guruhlari — barcha ta'lim yo'nalishlari
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
        { value: 'tailoring', label: "Bichuv-tikuv" },
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
        { value: 'arabic_studies', label: "Arab tili (diniy)" },
        { value: 'religion_general', label: "Din (umumiy)" },
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
      <h3 className="text-xl font-heading font-semibold text-foreground">Course Information</h3>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Cover Image
        </label>
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
              <span className="font-medium">Upload Image</span>
            </label>
            <p className="caption text-muted-foreground mt-2">
              Recommended: 1280x720px, Max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Course Title *
        </label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter course title"
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Course Description *
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe what students will learn in this course"
          rows={4}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          required
        />
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Maqsadli auditoriya *
        </label>
        <select
          value={metadata.targetAudience}
          onChange={(e) => handleChange('targetAudience', e.target.value)}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="">Auditoriyani tanlang</option>
          {targetAudiences.map((audience) => (
            <option key={audience.value} value={audience.value}>
              {audience.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Fan nomi *
        </label>
        <select
          value={metadata.subjectCategory}
          onChange={(e) => handleChange('subjectCategory', e.target.value)}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
          disabled={!metadata.targetAudience}
        >
          <option value="">{!metadata.targetAudience ? 'Avval auditoriyani tanlang' : 'Fanni tanlang'}</option>
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
          <label className="block text-sm font-medium text-foreground mb-2">
            Sinf darajasi *
          </label>
          <select
            value={metadata.gradeLevel}
            onChange={(e) => handleChange('gradeLevel', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Sinfni tanlang</option>
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
          <label className="block text-sm font-medium text-foreground mb-2">
            Category *
          </label>
          <select
            value={metadata.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select category</option>
            <option value="Programming">Programming</option>
            <option value="Design">Design</option>
            <option value="Business">Business</option>
            <option value="Marketing">Marketing</option>
            <option value="Science">Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Languages">Languages</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Language *
          </label>
          <select
            value={metadata.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select language</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Price (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              value={metadata.priceUSD}
              onChange={(e) => handleChange('priceUSD', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Price (UZS) *
          </label>
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
        </div>
      </div>
    </div>
  );
};

export default CourseMetadataForm;