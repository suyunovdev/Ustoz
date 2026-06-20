'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onReview(item.id, item.type, 'approved');
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
        <h3 className="text-xl font-heading font-semibold text-foreground">Qaror qabul qilish</h3>

        {item.status === 'pending' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-success text-success-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="CheckCircleIcon" size={24} />
              <span className="font-medium">{t('common.confirm')}</span>
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="XCircleIcon" size={24} />
              <span className="font-medium">Rad etish</span>
            </button>
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
              Bu kontent allaqachon {item.status === 'approved' ? 'tasdiqlangan' : 'rad etilgan'}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Tezkor harakatlar</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="flex items-center space-x-2 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth">
              <Icon name="FlagIcon" size={20} />
              <span className="text-sm font-medium">Shikoyat qilish</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth">
              <Icon name="ChatBubbleLeftIcon" size={20} />
              <span className="text-sm font-medium">O'qituvchiga xabar</span>
            </button>
          </div>
        </div>

        {/* Guidelines */}
        <div className="p-4 bg-muted/50 rounded-md space-y-2">
          <div className="flex items-start space-x-2">
            <Icon name="InformationCircleIcon" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Moderatsiya qoidalari</p>
              <ul className="caption text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Kontent sifati va aniqligini tekshiring</li>
                <li>Mualliflik huquqlarini hurmat qiling</li>
                <li>Nomaqbul yoki haqoratli kontent yo'qligini tasdiqlang</li>
                <li>Watermark himoyasi to'g'ri qo'llanganligini tekshiring</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-xl border border-border w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-heading font-semibold text-foreground">Rad etish sababi</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 rounded-md hover:bg-muted transition-smooth"
                aria-label="Close modal"
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sabab (o'qituvchiga ko'rsatiladi) *
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Nima uchun bu kontent rad etilayotganini tushuntiring..."
                  rows={5}
                  className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  required
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReject}
                  disabled={!rejectionNotes.trim() || isProcessing}
                  className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Rad etilmoqda...' : 'Rad etish'}
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth font-medium"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewControls;