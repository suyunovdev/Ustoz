'use client';

interface Transaction {
  id: string;
  course_id: string;
  amount_uzs: number;
  payment_method: 'click' | 'payme';
  status: string;
  merchant_trans_id: string;
  created_at: string;
  completed_at: string | null;
  courses: {
    title: string;
  };
}

interface ExportControlsProps {
  transactions: Transaction[];
}

export default function ExportControls({ transactions }: ExportControlsProps) {
  const exportToCSV = () => {
    const headers = ['Sana', 'Kurs', 'Summa', "To\'lov usuli", 'Holat', 'Tranzaksiya ID'];
    const rows = transactions.map((t) => [
      new Date(t.created_at).toLocaleDateString('uz-UZ'),
      t.courses.title,
      t.amount_uzs,
      t.payment_method,
      t.status,
      t.merchant_trans_id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportToCSV}
          disabled={transactions.length === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          CSV yuklash
        </button>

        <button
          onClick={printReceipt}
          disabled={transactions.length === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Chop etish
        </button>
      </div>
    </div>
  );
}