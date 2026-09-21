'use client';

/**
 * DataTable — CRM uslubidagi zich, saralanadigan jadval.
 * Haqiqiy <table> semantikasi, sticky header, ustun-sort, row-click,
 * yuklanish (SkeletonTable) va bo'sh holat (EmptyState) bilan.
 * Gorizontal skroll — mobil uchun overflow-x-auto.
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDir;
}

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Tailwind kengligi, masalan 'w-40'. */
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: SortState | null;
  onSortChange?: (s: SortState) => void;
  isLoading?: boolean;
  loadingRows?: number;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: string;
  className?: string;
}

const alignCls = (a?: 'left' | 'center' | 'right') =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  sort,
  onSortChange,
  isLoading,
  loadingRows = 8,
  emptyTitle,
  emptyDescription,
  emptyIcon = 'InboxIcon',
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <SkeletonTable rows={loadingRows} cols={columns.length} />;
  }

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDir =
      sort?.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: col.key, dir: nextDir });
  };

  return (
    <div
      className={cx(
        'bg-card border border-border rounded-lg overflow-hidden',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cx(
                      'h-11 px-4 font-medium text-muted-foreground whitespace-nowrap',
                      alignCls(col.align),
                      col.width,
                      col.headerClassName,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className={cx(
                          'inline-flex items-center gap-1 hover:text-foreground transition-smooth',
                          active && 'text-foreground',
                        )}
                      >
                        <span>{col.header}</span>
                        <Icon
                          name={
                            active
                              ? sort!.dir === 'asc'
                                ? 'ChevronUpIcon'
                                : 'ChevronDownIcon'
                              : 'ChevronUpDownIcon'
                          }
                          size={14}
                          className={active ? 'text-primary' : 'text-muted-foreground/50'}
                        />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cx(
                    'border-b border-border last:border-0 transition-smooth',
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cx(
                        'px-4 py-3 align-middle',
                        alignCls(col.align),
                        col.cellClassName,
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
