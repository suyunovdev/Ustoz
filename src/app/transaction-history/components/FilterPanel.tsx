'use client';

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
  return (
    <div className="bg-card rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Filtrlash</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">
            Qidiruv
          </label>
          <input
            type="text"
            id="search"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Kurs nomi yoki tranzaksiya ID"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          />
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-foreground mb-1">
            Boshlanish sanasi
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
            Tugash sanasi
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
            To&apos;lov usuli
          </label>
          <select
            id="paymentMethod"
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange({ paymentMethod: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            <option value="all">Barchasi</option>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
            Holat
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            <option value="all">Barchasi</option>
            <option value="pending">Kutilmoqda</option>
            <option value="processing">Jarayonda</option>
            <option value="completed">Muvaffaqiyatli</option>
            <option value="failed">Muvaffaqiyatsiz</option>
            <option value="cancelled">Bekor qilingan</option>
            <option value="refunded">Qaytarilgan</option>
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
            Filtrlarni tozalash
          </button>
        </div>
      </div>
    </div>
  );
}