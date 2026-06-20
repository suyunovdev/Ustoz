'use client';

import { useI18n } from '@/contexts/I18nContext';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
  status: string;
  searchQuery: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { t } = useI18n();

  return (
    <div className="bg-card rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('payment.filtering')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">
            {t('payment.search')}
          </label>
          <input
            type="text"
            id="search"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder={t('payment.searchPlaceholder')}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          />
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-foreground mb-1">
            {t('payment.startDate')}
          </label>
          <input
            type="date"
            id="dateFrom"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-foreground mb-1">
            {t('payment.endDate')}
          </label>
          <input
            type="date"
            id="dateTo"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ dateTo: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-foreground mb-1">
            {t('payment.paymentMethod')}
          </label>
          <select
            id="paymentMethod"
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ paymentMethod: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            <option value="all">{t('payment.allMethods')}</option>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
            {t('payment.status')}
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            <option value="all">{t('payment.allStatuses')}</option>
            <option value="pending">{t('payment.statusPending')}</option>
            <option value="processing">{t('payment.statusProcessing')}</option>
            <option value="completed">{t('payment.statusCompleted')}</option>
            <option value="failed">{t('payment.statusFailed')}</option>
            <option value="cancelled">{t('payment.statusCancelled')}</option>
            <option value="refunded">{t('payment.statusRefunded')}</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="lg:col-span-5 flex justify-end">
          <button
            onClick={() =>
              onFilterChange({
                dateFrom: '',
                dateTo: '',
                paymentMethod: 'all',
                status: 'all',
                searchQuery: ''
              })
            }
            className="px-4 py-2 text-sm text-foreground bg-muted rounded-md hover:bg-muted/80"
          >
            {t('payment.clearFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}