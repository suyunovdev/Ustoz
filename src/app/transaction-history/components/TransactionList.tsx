'use client';

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate, formatCurrency } from '@/lib/i18n/format';

interface Transaction {
  id: string;
  course_id: string | null;
  amount_uzs: number;
  payment_method: 'click' | 'payme';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  merchant_trans_id: string;
  created_at: string;
  completed_at: string | null;
  kind?: string; // 'course' | 'subscription'
  plan_name?: string | null;
  courses: {
    title: string;
    teacher_id: string;
  } | null;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const statusColors = {
  pending: 'bg-warning/15 text-warning dark:text-warning',
  processing: 'bg-primary/15 text-primary dark:text-primary',
  completed: 'bg-success/15 text-success dark:text-success',
  failed: 'bg-error/15 text-error dark:text-error',
  cancelled: 'bg-muted text-muted-foreground',
  refunded: 'bg-secondary/15 text-secondary'
};

export default function TransactionList({ transactions }: TransactionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t, locale } = useI18n();

  const statusLabels = {
    pending: t('payment.statusPending'),
    processing: t('payment.statusProcessing'),
    completed: t('payment.statusCompleted'),
    failed: t('payment.statusFailed'),
    cancelled: t('payment.statusCancelled'),
    refunded: t('payment.statusRefunded')
  };

  const paymentMethodLabels = {
    click: 'Click',
    payme: 'Payme'
  };

  const dateOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-foreground">{t('payment.noPaymentsFound')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('payment.noPaymentsYet')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('payment.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('payment.courseName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('payment.amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('payment.paymentMethod')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('payment.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('payment.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {transactions.map((transaction) => (
              <>
                <tr key={transaction.id} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(transaction.created_at, locale, dateOpts)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <div className="max-w-xs truncate">
                      {transaction.courses?.title
                        ?? (transaction.plan_name
                          ? `${t('payment.subscription')}: ${transaction.plan_name}`
                          : t('payment.subscription'))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {formatCurrency(transaction.amount_uzs, locale, 'UZS')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {paymentMethodLabels[transaction.payment_method]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[transaction.status]
                      }`}
                    >
                      {statusLabels[transaction.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <button
                      onClick={() => toggleExpand(transaction.id)}
                      className="text-primary hover:text-primary/80"
                    >
                      {expandedId === transaction.id ? t('payment.collapse') : t('payment.details')}
                    </button>
                  </td>
                </tr>
                {expandedId === transaction.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-muted">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-muted-foreground">{t('payment.transactionId')}:</span>
                            <p className="text-foreground mt-1 font-mono text-xs">
                              {transaction.merchant_trans_id}
                            </p>
                          </div>
                          {transaction.course_id ? (
                            <div>
                              <span className="font-medium text-muted-foreground">{t('payment.courseId')}:</span>
                              <p className="text-foreground mt-1 font-mono text-xs">
                                {transaction.course_id}
                              </p>
                            </div>
                          ) : transaction.plan_name ? (
                            <div>
                              <span className="font-medium text-muted-foreground">{t('payment.subscription')}:</span>
                              <p className="text-foreground mt-1">{transaction.plan_name}</p>
                            </div>
                          ) : null}
                        </div>
                        {transaction.completed_at && (
                          <div>
                            <span className="font-medium text-muted-foreground">{t('payment.completedDate')}:</span>
                            <p className="text-foreground mt-1">
                              {formatDate(transaction.completed_at, locale, dateOpts)}
                            </p>
                          </div>
                        )}
                        {transaction.status === 'completed' && transaction.course_id && (
                          <div className="flex gap-2 mt-4">
                            <a
                              href={`/learning-interface?courseId=${transaction.course_id}`}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                              {t('payment.goToCourse')}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}