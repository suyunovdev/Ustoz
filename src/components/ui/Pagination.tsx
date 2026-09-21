'use client';

/**
 * Pagination — offset (sahifa raqamli) sahifalash boshqaruvi.
 * Til-neytral: "X–Y / N" + sahifa o'lchami tanlovi + oldingi/keyingi.
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export interface PaginationProps {
  /** 1-asosli joriy sahifa. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  isFetching?: boolean;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
  isFetching,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const to = Math.min(clampedPage * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2 text-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="tabular-nums">
          {from}–{to} <span className="opacity-60">/</span> {total}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Sahifa hajmi"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s} / sahifa
              </option>
            ))}
          </select>
        )}
        {isFetching && (
          <Icon name="ArrowPathIcon" size={14} className="animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Oldingi sahifa"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(clampedPage - 1)}
          className={cx(
            'inline-flex items-center justify-center h-8 w-8 rounded-md border border-border transition-smooth',
            clampedPage <= 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-muted text-foreground',
          )}
        >
          <Icon name="ChevronLeftIcon" size={16} />
        </button>
        <span className="px-2 tabular-nums text-muted-foreground">
          {clampedPage} <span className="opacity-60">/</span> {totalPages}
        </span>
        <button
          type="button"
          aria-label="Keyingi sahifa"
          disabled={clampedPage >= totalPages}
          onClick={() => onPageChange(clampedPage + 1)}
          className={cx(
            'inline-flex items-center justify-center h-8 w-8 rounded-md border border-border transition-smooth',
            clampedPage >= totalPages
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-muted text-foreground',
          )}
        >
          <Icon name="ChevronRightIcon" size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
