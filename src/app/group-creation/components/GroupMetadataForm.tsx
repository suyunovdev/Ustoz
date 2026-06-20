'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface GroupMetadata {
  name: string;
  description: string;
  courseId: string;
  maxStudents: number;
  balancingStrategy: 'performance' | 'random' | 'manual';
}

interface GroupMetadataFormProps {
  metadata: GroupMetadata;
  onMetadataChange: (metadata: GroupMetadata) => void;
}

const GroupMetadataForm = ({ metadata, onMetadataChange }: GroupMetadataFormProps) => {
  const { t } = useI18n();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mockCourses = [
    { id: '1', name: 'Matematika - 9-sinf' },
    { id: '2', name: 'Fizika - 10-sinf' },
    { id: '3', name: 'Kimyo - 11-sinf' },
    { id: '4', name: 'Ingliz tili - Boshlang\'ich' },
    { id: '5', name: 'Dasturlash - Python' }
  ];

  const handleChange = (field: keyof GroupMetadata, value: any) => {
    onMetadataChange({ ...metadata, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Guruh nomi <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={t('groups.groupName')}
          className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Kurs <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={metadata.courseId}
            onChange={(e) => handleChange('courseId', e.target.value)}
            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer"
          >
            <option value="">{t('groups.selectCourse')}</option>
            {mockCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={20}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Guruh bitta kursga bog'lanadi. O'quvchilar faqat shu kurs materiallariga kirish huquqiga ega bo'ladi.
        </p>
        {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tavsif (ixtiyoriy)
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Guruh haqida qisqacha ma'lumot, maqsad va rejalar..."
          rows={4}
          className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
        />
      </div>

      {/* Max Students */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Maksimal o'quvchilar soni
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={metadata.maxStudents}
            onChange={(e) => handleChange('maxStudents', parseInt(e.target.value))}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="w-20 px-3 py-2 bg-primary/10 border border-primary/30 rounded-md text-center">
            <span className="text-lg font-bold text-primary">{metadata.maxStudents}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Optimal: 20-30 o'quvchi</p>
          <div className="flex items-center space-x-1">
            <Icon name="InformationCircleIcon" size={16} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Katta guruhlar boshqarish qiyin bo'lishi mumkin</p>
          </div>
        </div>
      </div>

      {/* Balancing Strategy */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Guruh muvozanatlash strategiyasi
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleChange('balancingStrategy', 'performance')}
            className={`p-4 rounded-md border-2 transition-smooth text-left ${
              metadata.balancingStrategy === 'performance'
                ? 'bg-primary/10 border-primary' :'bg-card border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="ChartBarIcon" size={20} className="text-primary" />
              <span className="font-semibold text-foreground">{t('groups.byResult')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Yuqori, o'rta va past natijali o'quvchilarni muvozanatli taqsimlash
            </p>
            {metadata.balancingStrategy === 'performance' && (
              <div className="mt-2 flex items-center space-x-1 text-primary">
                <Icon name="CheckCircleIcon" size={16} />
                <span className="text-xs font-medium">{t('groups.selected')}</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleChange('balancingStrategy', 'random')}
            className={`p-4 rounded-md border-2 transition-smooth text-left ${
              metadata.balancingStrategy === 'random'
                ? 'bg-primary/10 border-primary' :'bg-card border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="ArrowPathIcon" size={20} className="text-primary" />
              <span className="font-semibold text-foreground">{t('groups.random')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              O'quvchilarni tasodifiy tarzda taqsimlash
            </p>
            {metadata.balancingStrategy === 'random' && (
              <div className="mt-2 flex items-center space-x-1 text-primary">
                <Icon name="CheckCircleIcon" size={16} />
                <span className="text-xs font-medium">Tanlangan</span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleChange('balancingStrategy', 'manual')}
            className={`p-4 rounded-md border-2 transition-smooth text-left ${
              metadata.balancingStrategy === 'manual' ?'bg-primary/10 border-primary' :'bg-card border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="HandRaisedIcon" size={20} className="text-primary" />
              <span className="font-semibold text-foreground">{t('groups.manual')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              O'zingiz tanlab, qo'lda taqsimlash
            </p>
            {metadata.balancingStrategy === 'manual' && (
              <div className="mt-2 flex items-center space-x-1 text-primary">
                <Icon name="CheckCircleIcon" size={16} />
                <span className="text-xs font-medium">Tanlangan</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 rounded-md p-4 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <Icon name="LightBulbIcon" size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-foreground mb-1">{t('groups.advice')}</h4>
            <p className="text-sm text-muted-foreground">
              "Natijaga ko'ra" strategiyasi eng samarali hisoblanadi. Bu usul guruhda turli darajadagi o'quvchilarni muvozanatli taqsimlaydi va o'zaro yordam ko'rsatishga imkon beradi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMetadataForm;