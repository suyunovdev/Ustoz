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
  /** Qator tanlash (bulk amallar) — checkbox ustuni qo'shadi. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (allIds: string[], checked: boolean) => void;
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
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: DataTableProps<T>) {
  if (isLoading) {
    return <SkeletonTable rows={loadingRows} cols={columns.length + (selectable ? 1 : 0)} />;
  }

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDir =
      sort?.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: col.key, dir: nextDir });
  };

  const allIds = rows.map(getRowId);
  const selectedCount = selectedIds ? allIds.filter((id) => selectedIds.has(id)).length : 0;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const colCount = columns.length + (selectable ? 1 : 0);

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
              {selectable && (
                <th scope="col" className="w-10 px-4">
                  <input
                    type="checkbox"
                    aria-label="Hammasini tanlash"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onToggleAll?.(allIds, e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                  />
                </th>
              )}
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
                <td colSpan={colCount}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                const isSelected = selectedIds?.has(id) ?? false;
                return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cx(
                    'border-b border-border last:border-0 transition-smooth',
                    isSelected ? 'bg-primary/5' : onRowClick && 'hover:bg-muted/50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Qatorni tanlash"
                        checked={isSelected}
                        onChange={() => onToggleRow?.(id)}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </td>
                  )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
