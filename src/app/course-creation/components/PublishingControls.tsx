'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
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

interface Topic {
  id: string;
  order: number;
  title: string;
  duration: string;
  hasQuiz: boolean;
  content: string;
  files: any[];
}

interface PublishingControlsProps {
  status: 'draft' | 'preview' | 'submitted' | 'approved' | 'rejected';
  onSaveDraft: () => void;
  onPreview: () => void;
  onSubmit: () => void;
  isValid: boolean;
  metadata: CourseMetadata;
  topics: Topic[];
  isSaving?: boolean;
  saveError?: string | null;
}

const PublishingControls = ({
  status,
  onSaveDraft,
  onPreview,
  onSubmit,
  isValid,
  metadata,
  topics,
  isSaving = false,
  saveError = null,
}: PublishingControlsProps) => {
  const { t } = useI18n();

  const getStatusBadge = () => {
    const statusConfig = {
      draft: { label: t('courseCreation.statusDraft'), color: 'bg-muted text-muted-foreground', icon: 'DocumentIcon' },
      preview: { label: t('courseCreation.statusPreview'), color: 'bg-secondary/10 text-secondary', icon: 'EyeIcon' },
      submitted: { label: t('courseCreation.statusPendingReview'), color: 'bg-warning/10 text-warning', icon: 'ClockIcon' },
      approved: { label: t('courseCreation.statusApproved'), color: 'bg-success/10 text-success', icon: 'CheckCircleIcon' },
      rejected: { label: t('courseCreation.statusRejected'), color: 'bg-destructive/10 text-destructive', icon: 'XCircleIcon' }
    };

    const config = statusConfig[status];

    return (
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-md ${config.color}`}>
        <Icon name={config.icon as any} size={20} />
        <span className="font-medium">{config.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Summary Card */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">{t('courseCreation.courseSummary')}</h3>
        
        {/* Course Info */}
        <div className="space-y-4">
          {/* Cover Image and Basic Info */}
          <div className="flex flex-col sm:flex-row gap-4">
            {metadata.coverImage && (
              <div className="w-full sm:w-48 h-32 rounded-md overflow-hidden bg-muted border border-border flex-shrink-0">
                <AppImage
                  src={metadata.coverImage}
                  alt={`${metadata.title} course cover image`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h4 className="text-lg font-heading font-semibold text-foreground">
                {metadata.title || t('courseCreation.courseNameNotEntered')}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {metadata.description || t('courseCreation.descriptionNotEntered')}
              </p>
              <div className="flex flex-wrap gap-2">
                {metadata.category && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {metadata.category}
                  </span>
                )}
                {metadata.language && (
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                    {metadata.language === 'uz' ? "O'zbek" : metadata.language === 'ru' ? 'Русский' : 'English'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('courseCreation.priceUSDLabel')}</p>
              <p className="text-lg font-semibold text-foreground">${metadata.priceUSD || '0.00'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('courseCreation.priceUZSLabel')}</p>
              <p className="text-lg font-semibold text-foreground">{metadata.priceUZS || '0'} so'm</p>
            </div>
            {metadata.targetAudience && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('courseCreation.targetAudienceLabel')}</p>
                <p className="text-sm text-foreground">
                  {metadata.targetAudience === 'school_students' ? t('courseCreation.schoolStudents') :
                   metadata.targetAudience === 'university_students'? t('courseCreation.universityStudents') : t('courseCreation.independentLearners')}
                </p>
              </div>
            )}
            {metadata.subjectCategory && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('courseCreation.subject')}</p>
                <p className="text-sm text-foreground capitalize">{metadata.subjectCategory.replace('_', ' ')}</p>
              </div>
            )}
            {metadata.gradeLevel && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('courseCreation.grade')}</p>
                <p className="text-sm text-foreground">{metadata.gradeLevel}-sinf</p>
              </div>
            )}
          </div>
        </div>

        {/* Topics Summary */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium text-foreground mb-3">Mavzular ({topics.length})</h4>
          <div className="space-y-2">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {topic.order}
                  </span>
                  <span className="text-sm text-foreground">{topic.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {topic.content && (
                    <Icon name="DocumentTextIcon" size={16} className="text-success" title={t('courseCreation.textExists')} />
                  )}
                  {topic.files.length > 0 && (
                    <Icon name="FolderIcon" size={16} className="text-secondary" title={t('courseCreation.filesExist')} />
                  )}
                  {topic.hasQuiz ? (
                    <Icon name="CheckCircleIcon" size={16} className="text-success" title={t('courseCreation.testExists')} />
                  ) : (
                    <Icon name="XCircleIcon" size={16} className="text-destructive" title={t('courseCreation.noTest')} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Publishing Controls */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-semibold text-foreground">{t('courseCreation.publishTitle')}</h3>
          {getStatusBadge()}
        </div>

        {/* Validation Checklist */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">{t('courseCreation.checklistTitle')}</h4>
          <div className="space-y-2">
            {[
              { label: t('courseCreation.checkCourseInfo'), checked: !!metadata.title && !!metadata.description },
              { label: t('courseCreation.checkCoverImage'), checked: !!metadata.coverImage },
              { label: t('courseCreation.checkOneTopic'), checked: topics.length > 0 },
              { label: t('courseCreation.checkAllTopicsText'), checked: topics.length > 0 && topics.every(t => t.content && t.content.length > 0) },
              { label: t('courseCreation.checkAllTopicsQuiz'), checked: isValid },
              { label: t('courseCreation.checkPrice'), checked: !!metadata.priceUZS }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Icon
                  name={item.checked ? 'CheckCircleIcon' : 'XCircleIcon'}
                  size={20}
                  className={item.checked ? 'text-success' : 'text-muted-foreground'}
                />
                <span className={`caption ${item.checked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {saveError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <Icon name="ExclamationCircleIcon" size={20} className="text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive mb-1">{t('courseCreation.errorOccurred')}</p>
                <p className="text-xs text-destructive">{saveError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onSaveDraft}
            disabled={isSaving}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="DocumentIcon" size={20} />
            )}
            <span className="font-medium">{t('courseCreation.saveAsDraft')}</span>
          </button>

          <button
            onClick={onPreview}
            disabled={isSaving}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="EyeIcon" size={20} />
            <span className="font-medium">{t('courseCreation.previewCourse')}</span>
          </button>

          <button
            onClick={onSubmit}
            disabled={isSaving || status === 'submitted'}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="PaperAirplaneIcon" size={20} />
            )}
            <span className="font-medium">
              {isSaving ? t('courseCreation.saving') : status === 'submitted' ? t('courseCreation.submitted') + ' ✓' : t('courseCreation.submitAndPublish')}
            </span>
          </button>

          {!isValid && (
            <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <Icon name="ExclamationTriangleIcon" size={20} className="text-warning flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning mb-1">{t('courseCreation.publishWarningTitle')}</p>
                  <ul className="text-xs text-warning space-y-1">
                    <li>• {t('courseCreation.publishWarning1')}</li>
                    <li>• {t('courseCreation.publishWarning2')}</li>
                    <li>• {t('courseCreation.publishWarning3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishingControls;