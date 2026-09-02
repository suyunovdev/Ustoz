'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface GroupMetadata {
  name: string;
  description: string;
  courseId: string;
  maxStudents: number;
  balancingStrategy: 'performance' | 'random' | 'manual';
  meetingUrl: string;
  scheduleNote: string;
}

interface TeacherCourseOption {
  id: string;
  title: string;
}

interface GroupMetadataFormProps {
  metadata: GroupMetadata;
  onMetadataChange: (metadata: GroupMetadata) => void;
  courses: TeacherCourseOption[];
  coursesLoading?: boolean;
}

// Server bilan bir xil chegaralar (group.service.ts): nom 2-100, tavsif ≤2000,
// jadval izohi ≤200, meetingUrl yaroqli URL bo'lishi kerak.
const isValidUrl = (v: string) => {
  try { new URL(v); return true; } catch { return false; }
};

const GroupMetadataForm = ({ metadata, onMetadataChange, courses, coursesLoading }: GroupMetadataFormProps) => {
  const { t } = useI18n();

  const handleChange = (field: keyof GroupMetadata, value: string | number) => {
    onMetadataChange({ ...metadata, [field]: value });
  };

  // Real-vaqt validatsiya — foydalanuvchi kiritayotganda ko'rsatiladi
  const trimmedName = metadata.name.trim();
  const nameError = trimmedName.length > 0 && (trimmedName.length < 2 || trimmedName.length > 100);
  const descError = metadata.description.length > 2000;
  const scheduleError = metadata.scheduleNote.trim().length > 200;
  const urlError = metadata.meetingUrl.trim().length > 0 && !isValidUrl(metadata.meetingUrl.trim());

  return (
    <div className="space-y-6">
      {/* Group Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('groups.groupName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder={t('groups.groupName')}
          maxLength={100}
          className={`w-full px-4 py-3 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground ${nameError ? 'border-red-500' : 'border-input'}`}
        />
        {nameError && <p className="text-red-500 text-sm mt-1">{t('groups.nameError')}</p>}
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('groups.courseLabel')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={metadata.courseId}
            onChange={(e) => handleChange('courseId', e.target.value)}
            disabled={coursesLoading}
            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer disabled:opacity-60"
          >
            <option value="">
              {coursesLoading ? t('common.loading') : t('groups.selectCourse')}
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <Icon
            name="ChevronDownIcon"
            size={20}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t('groups.courseBindingHelp')}</p>
        {!coursesLoading && courses.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('groups.noCourseWarning')}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('groups.descriptionOptional')}
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('groups.descriptionPlaceholder')}
          rows={4}
          maxLength={2000}
          className={`w-full px-4 py-3 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none ${descError ? 'border-red-500' : 'border-input'}`}
        />
        <div className="flex items-center justify-between mt-1">
          {descError ? (
            <p className="text-red-500 text-sm">{t('groups.descError')}</p>
          ) : <span />}
          <span className="text-xs text-muted-foreground">{metadata.description.length}/2000</span>
        </div>
      </div>

      {/* Live lesson link (ixtiyoriy) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('groups.meetingUrl')}
        </label>
        <input
          type="url"
          value={metadata.meetingUrl}
          onChange={(e) => handleChange('meetingUrl', e.target.value)}
          placeholder={t('groups.meetingUrlPlaceholder')}
          className={`w-full px-4 py-3 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground ${urlError ? 'border-red-500' : 'border-input'}`}
        />
        {urlError && <p className="text-red-500 text-sm mt-1">{t('groups.urlError')}</p>}
      </div>

      {/* Schedule note (ixtiyoriy) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('groups.scheduleNote')}
        </label>
        <input
          type="text"
          value={metadata.scheduleNote}
          onChange={(e) => handleChange('scheduleNote', e.target.value)}
          placeholder={t('groups.scheduleNotePlaceholder')}
          maxLength={200}
          className={`w-full px-4 py-3 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground ${scheduleError ? 'border-red-500' : 'border-input'}`}
        />
        {scheduleError && <p className="text-red-500 text-sm mt-1">{t('groups.scheduleError')}</p>}
      </div>

      {/* Max Students */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('groups.maxStudents')}
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={metadata.maxStudents}
            onChange={(e) => handleChange('maxStudents', parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="w-20 px-3 py-2 bg-primary/10 border border-primary/30 rounded-md text-center">
            <span className="text-lg font-bold text-primary">{metadata.maxStudents}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{t('groups.maxStudentsOptimal')}</p>
          <div className="flex items-center space-x-1">
            <Icon name="InformationCircleIcon" size={16} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t('groups.maxStudentsHint')}</p>
          </div>
        </div>
      </div>

      {/* Balancing Strategy — yaratish paytida talabalarni taqsimlash usuli */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {t('groups.balancingStrategyLabel')}
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
            <p className="text-xs text-muted-foreground">{t('groups.byResultDesc')}</p>
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
            <p className="text-xs text-muted-foreground">{t('groups.randomDesc')}</p>
            {metadata.balancingStrategy === 'random' && (
              <div className="mt-2 flex items-center space-x-1 text-primary">
                <Icon name="CheckCircleIcon" size={16} />
                <span className="text-xs font-medium">{t('groups.selected')}</span>
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
            <p className="text-xs text-muted-foreground">{t('groups.manualDesc')}</p>
            {metadata.balancingStrategy === 'manual' && (
              <div className="mt-2 flex items-center space-x-1 text-primary">
                <Icon name="CheckCircleIcon" size={16} />
                <span className="text-xs font-medium">{t('groups.selected')}</span>
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
            <p className="text-sm text-muted-foreground">{t('groups.adviceBody')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMetadataForm;
