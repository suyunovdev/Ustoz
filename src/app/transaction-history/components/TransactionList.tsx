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
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  refunded: 'bg-purple-100 text-purple-800'
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
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">To&apos;lovlar topilmadi</h3>
        <p className="mt-1 text-sm text-gray-500">
          Hozircha hech qanday to&apos;lov amalga oshirilmagan
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sana
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kurs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To&apos;lov usuli
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <>
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{transaction.courses.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatAmount(transaction.amount_uzs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => toggleExpand(transaction.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {expandedId === transaction.id ? 'Yopish' : 'Batafsil'}
                    </button>
                  </td>
                </tr>
                {expandedId === transaction.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Tranzaksiya ID:</span>
                            <p className="text-gray-900 mt-1 font-mono text-xs">
                              {transaction.merchant_trans_id}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Kurs ID:</span>
                            <p className="text-gray-900 mt-1 font-mono text-xs">
                              {transaction.course_id}
                            </p>
                          </div>
                        </div>
                        {transaction.completed_at && (
                          <div>
                            <span className="font-medium text-gray-700">Yakunlangan sana:</span>
                            <p className="text-gray-900 mt-1">
                              {formatDate(transaction.completed_at)}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          {transaction.status === 'completed' && (
                            <a
                              href={`/learning-interface?courseId=${transaction.course_id}`}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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