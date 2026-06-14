'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  course_id: string;
  amount_uzs: number;
  payment_method: 'click' | 'payme';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  merchant_trans_id: string;
  created_at: string;
  completed_at: string | null;
  courses: {
    title: string;
    teacher_id: string;
  };
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
  refunded: 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
};

const statusLabels = {
  pending: 'Kutilmoqda',
  processing: 'Jarayonda',
  completed: 'Muvaffaqiyatli',
  failed: 'Muvaffaqiyatsiz',
  cancelled: 'Bekor qilingan',
  refunded: 'Qaytarilgan'
};

const paymentMethodLabels = {
  click: 'Click',
  payme: 'Payme'
};

export default function TransactionList({ transactions }: TransactionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow p-8 text-center">
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
        <h3 className="mt-2 text-sm font-medium text-foreground">To&apos;lovlar topilmadi</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hozircha hech qanday to&apos;lov amalga oshirilmagan
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sana
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Kurs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Summa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                To&apos;lov usuli
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Holat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {transactions.map((transaction) => (
              <>
                <tr key={transaction.id} className="hover:bg-muted">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <div className="max-w-xs truncate">{transaction.courses.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {formatAmount(transaction.amount_uzs)}
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
                      {expandedId === transaction.id ? 'Yopish' : 'Batafsil'}
                    </button>
                  </td>
                </tr>
                {expandedId === transaction.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-muted">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-muted-foreground">Tranzaksiya ID:</span>
                            <p className="text-foreground mt-1 font-mono text-xs">
                              {transaction.merchant_trans_id}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Kurs ID:</span>
                            <p className="text-foreground mt-1 font-mono text-xs">
                              {transaction.course_id}
                            </p>
                          </div>
                        </div>
                        {transaction.completed_at && (
                          <div>
                            <span className="font-medium text-muted-foreground">Yakunlangan sana:</span>
                            <p className="text-foreground mt-1">
                              {formatDate(transaction.completed_at)}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          {transaction.status === 'completed' && (
                            <a
                              href={`/learning-interface?courseId=${transaction.course_id}`}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                              Kursga o&apos;tish
                            </a>
                          )}
                        </div>
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