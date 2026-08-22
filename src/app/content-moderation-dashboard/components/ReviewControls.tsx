'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useI18n } from '@/contexts/I18nContext';

interface ContentItem {
  id: string;
  type: 'material' | 'link' | 'test';
  title: string;
  status: string;
}

interface ReviewControlsProps {
  item: ContentItem;
  onReview: (itemId: string, itemType: string, decision: 'approved' | 'rejected', notes?: string) => void;
}

const ReviewControls = ({ item, onReview }: ReviewControlsProps) => {
  const { t } = useI18n();
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onReview(item.id, item.type, 'approved');
    setShowApproveConfirm(false);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (isProcessing || !rejectionNotes.trim()) return;
    setIsProcessing(true);
    await onReview(item.id, item.type, 'rejected', rejectionNotes);
    setRejectionNotes('');
    setShowRejectModal(false);
    setIsProcessing(false);
  };

  return (
    <>
      <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
        <h3 className="text-xl font-heading font-semibold text-foreground">{t('moderation.decisionTitle')}</h3>

        {item.status === 'pending' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="primary"
              size="lg"
              iconLeft="CheckCircleIcon"
              disabled={isProcessing}
              onClick={() => setShowApproveConfirm(true)}
            >
              {t('common.confirm')}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              iconLeft="XCircleIcon"
              disabled={isProcessing}
              onClick={() => setShowRejectModal(true)}
            >
              {t('moderation.reject')}
            </Button>
          </div>
        ) : (
          <div className={`flex items-center space-x-3 p-4 rounded-md ${
            item.status === 'approved' ? 'bg-success/10' :
            item.status === 'rejected'? 'bg-destructive/10' : 'bg-warning/10'
          }`}>
            <Icon
              name={item.status === 'approved' ? 'CheckCircleIcon' : 'XCircleIcon'}
              size={24}
              className={item.status === 'approved' ? 'text-success' : 'text-destructive'}
            />
            <p className={`font-medium ${
              item.status === 'approved' ? 'text-success' : 'text-destructive'
            }`}>
              {item.status === 'approved' ? t('moderation.alreadyApproved') : t('moderation.alreadyRejected')}
            </p>
          </div>
        )}

        {/* Guidelines */}
        <div className="p-4 bg-muted/50 rounded-md space-y-2">
          <div className="flex items-start space-x-2">
            <Icon name="InformationCircleIcon" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{t('moderation.guidelines')}</p>
              <ul className="caption text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>{t('moderation.guideline1')}</li>
                <li>{t('moderation.guideline2')}</li>
                <li>{t('moderation.guideline3')}</li>
                <li>{t('moderation.guideline4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Approve — kontentni nashr etadi, tasdiq talab qilinadi */}
      <ConfirmModal
        open={showApproveConfirm}
        title={t('moderation.decisionTitle')}
        message={t('moderation.alreadyApproved')}
        confirmLabel={t('common.confirm')}
        variant="danger"
        isLoading={isProcessing}
        onConfirm={handleApprove}
        onCancel={() => !isProcessing && setShowApproveConfirm(false)}
      />

      {/* Reject — sabab modal ichida */}
      <Modal
        open={showRejectModal}
        onClose={() => { if (!isProcessing) setShowRejectModal(false); }}
        title={t('moderation.rejectReasonTitle')}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={isProcessing}
              disabled={!rejectionNotes.trim()}
              onClick={handleReject}
            >
              {t('moderation.reject')}
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          {t('moderation.rejectReasonLabel')}
        </label>
        <textarea
          value={rejectionNotes}
          onChange={(e) => setRejectionNotes(e.target.value)}
          placeholder={t('moderation.rejectReasonPlaceholder')}
          rows={5}
          className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          required
          autoFocus
        />
      </Modal>
    </>
  );
};

export default ReviewControls;
