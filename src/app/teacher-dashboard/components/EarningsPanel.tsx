'use client';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency } from '@/lib/i18n/format';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  courseName: string;
}

interface EarningsPanelProps {
  currentBalance: number;
  totalEarnings: number;
  pendingPayouts: number;
  transactions: Transaction[];
  onWithdraw: () => void;
}

const EarningsPanel = ({ 
  currentBalance, 
  totalEarnings, 
  pendingPayouts, 
  transactions,
  onWithdraw
}: EarningsPanelProps) => {
  const { t, locale } = useI18n();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'processing':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('teacher.txStatusCompleted');
      case 'pending':
        return t('teacher.earningsPaymentPending');
      case 'processing':
        return t('teacher.earningsPaymentProcessing');
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary text-primary-foreground rounded-md shadow-warm p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Icon name="WalletIcon" size={24} />
            <p className="text-sm opacity-90">{t('teacher.earningsCurrentBalance')}</p>
          </div>
          <h3 className="text-3xl font-heading font-bold">{formatCurrency(currentBalance, locale, 'USD')}</h3>
          <button
            onClick={onWithdraw}
            className="mt-4 w-full px-4 py-2 bg-primary-foreground text-primary rounded-md font-medium transition-smooth hover:bg-primary-foreground/90"
          >
            {t('teacher.earningsWithdrawShort')}
          </button>
        </div>

        <div className="bg-card rounded-md shadow-warm p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Icon name="CurrencyDollarIcon" size={24} className="text-success" />
            <p className="text-sm text-muted-foreground">{t('teacher.overviewTotalRevenue')}</p>
          </div>
          <h3 className="text-3xl font-heading font-bold text-foreground">{formatCurrency(totalEarnings, locale, 'USD')}</h3>
          <p className="text-sm text-muted-foreground mt-2">{t('teacher.earningsAllTime')}</p>
        </div>

        <div className="bg-card rounded-md shadow-warm p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Icon name="ClockIcon" size={24} className="text-warning" />
            <p className="text-sm text-muted-foreground">{t('teacher.earningsPendingPayouts')}</p>
          </div>
          <h3 className="text-3xl font-heading font-bold text-foreground">{formatCurrency(pendingPayouts, locale, 'USD')}</h3>
          <p className="text-sm text-muted-foreground mt-2">{t('teacher.earningsPaymentProcessing')}</p>
        </div>
      </div>

      {/* Revenue Split Info */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">{t('teacher.earningsRevenueSplit')}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span className="text-foreground">{t('teacher.earningsYourShare')}</span>
            </div>
            <span className="font-heading font-semibold text-foreground">70%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <span className="text-foreground">{t('teacher.earningsPlatformFee')}</span>
            </div>
            <span className="font-heading font-semibold text-foreground">30%</span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            {t('teacher.earningsSplitNote')}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">{t('teacher.earningsPaymentHistory')}</h3>
          <button className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-smooth">
            <span className="text-sm font-medium">{t('teacher.earningsViewAll')}</span>
            <Icon name="ArrowRightIcon" size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted transition-smooth"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">{transaction.courseName}</p>
                <p className="text-sm text-muted-foreground">{transaction.date}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-heading font-semibold text-foreground">
                  {formatCurrency(transaction.amount, locale, 'USD')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium caption ${getStatusColor(transaction.status)}`}>
                  {getStatusLabel(transaction.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsPanel;