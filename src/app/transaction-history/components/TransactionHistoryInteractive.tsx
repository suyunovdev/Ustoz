'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
      const supabase = createClient();

      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          id,
          course_id,
          amount_uzs,
          payment_method,
          status,
          merchant_trans_id,
          created_at,
          completed_at,
          courses (
            title,
            teacher_id
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || "To'lovlar tarixini yuklashda xatolik");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">To&apos;lov Tarixi</h1>
          <p className="mt-2 text-gray-600">
            Barcha to&apos;lovlar va kurs sotib olishlar haqida ma&apos;lumot
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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