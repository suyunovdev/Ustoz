'use client';

import { useI18n } from '@/contexts/I18nContext';

interface Transaction {
  id: string;
  amount_uzs: number;
  payment_method: 'click' | 'payme';
  status: string;
  created_at: string;
}

interface PaymentStatsProps {
  transactions: Transaction[];
}

export default function PaymentStats({ transactions }: PaymentStatsProps) {
  const { t } = useI18n();
  const totalSpent = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount_uzs, 0);

  const completedCount = transactions.filter((t) => t.status === 'completed').length;
  const pendingCount = transactions.filter((t) => t.status === 'pending' || t.status === 'processing').length;

  const clickCount = transactions.filter((t) => t.payment_method === 'click' && t.status === 'completed').length;
  const paymeCount = transactions.filter((t) => t.payment_method === 'payme' && t.status === 'completed').length;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Total Spent */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{t('payment.totalSpent')}</dt>
              <dd className="text-lg font-semibold text-foreground">{formatAmount(totalSpent)}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Completed Transactions */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{t('payment.successful')}</dt>
              <dd className="text-lg font-semibold text-foreground">{completedCount} {t('payment.count')}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Pending Transactions */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{t('payment.pending')}</dt>
              <dd className="text-lg font-semibold text-foreground">{pendingCount} {t('payment.count')}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{t('payment.paymentMethods')}</dt>
              <dd className="text-sm font-semibold text-foreground">
                Click: {clickCount} | Payme: {paymeCount}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}