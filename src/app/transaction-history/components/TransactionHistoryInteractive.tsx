'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TransactionList from './TransactionList';
import FilterPanel from './FilterPanel';
import ExportControls from './ExportControls';
import PaymentStats from './PaymentStats';

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

interface FilterState {
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
  status: string;
  searchQuery: string;
}

export default function TransactionHistoryInteractive() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    status: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments/my', { credentials: 'include' });
      if (!res.ok) throw new Error('To\'lovlar tarixini yuklashda xatolik');
      const data = await res.json();
      setTransactions(
        (data.transactions || []).map((t: Record<string, unknown>) => ({
          ...t,
          amount_uzs: Number(t.amount_uzs),
        }))
      );
      setError('');
    } catch (err: unknown) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : "To'lovlar tarixini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.created_at) <= new Date(filters.dateTo)
      );
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter((t) => t.payment_method === filters.paymentMethod);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.courses.title.toLowerCase().includes(query) ||
          t.merchant_trans_id.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">To&apos;lov Tarixi</h1>
          <p className="mt-2 text-muted-foreground">
            Barcha to&apos;lovlar va kurs sotib olishlar haqida ma&apos;lumot
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Payment Stats */}
        <PaymentStats transactions={transactions} />

        {/* Filter Panel */}
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

        {/* Export Controls */}
        <ExportControls transactions={filteredTransactions} />

        {/* Transaction List */}
        <TransactionList transactions={filteredTransactions} />
      </div>
    </div>
  );
}