'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import {
  useAdminAuditLog,
  useAdminAuditLogMeta,
  type AuditLogEntryDTO,
} from '@/hooks/queries/useAdminAuditLog';

// Action prefiks bo'yicha rang
const ACTION_COLOR: Record<string, string> = {
  user: 'text-warning',
  course: 'text-primary',
  payment: 'text-success',
  review: 'text-secondary',
  campaign: 'text-primary',
  material: 'text-secondary',
  ticket: 'text-primary',
  teacher_application: 'text-success',
};

// Action prefiks bo'yicha icon
const ACTION_ICON: Record<string, string> = {
  user: 'UserIcon',
  course: 'BookOpenIcon',
  payment: 'CreditCardIcon',
  review: 'ChatBubbleLeftRightIcon',
  campaign: 'EnvelopeIcon',
  material: 'DocumentTextIcon',
  ticket: 'LifebuoyIcon',
  teacher_application: 'AcademicCapIcon',
};

function getActionInfo(action: string) {
  const prefix = action.split('.')[0];
  return {
    color: ACTION_COLOR[prefix] ?? 'text-foreground',
    icon: ACTION_ICON[prefix] ?? 'BookmarkIcon',
  };
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.round((now - t) / 1000);
  if (diffSec < 60) return `${diffSec}s oldin`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m oldin`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}s oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const AuditLogPanel = () => {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useAdminAuditLog({
    action: action || undefined,
    targetType: targetType || undefined,
    search: search || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const { data: meta } = useAdminAuditLogMeta();

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Amal turi</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            >
              <option value="">Barchasi</option>
              {meta?.actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Maqsad turi</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            >
              <option value="">Barchasi</option>
              {meta?.targetTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Dan</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Gacha</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Qidirish (IP, admin)</label>
            <div className="relative">
              <Icon
                name="MagnifyingGlassIcon"
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="admin@..., 192.168..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {(action || targetType || search || fromDate || toDate) && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Faol filterlar:</span>
            <button
              onClick={() => {
                setAction('');
                setTargetType('');
                setSearchInput('');
                setSearch('');
                setFromDate('');
                setToDate('');
              }}
              className="text-xs text-primary hover:underline"
            >
              Tozalash
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Amallar tarixi ({data?.total ?? 0})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4 text-sm text-destructive flex items-center justify-between">
            <span>Xato: {error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              Qayta urinish
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded-md" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Icon
              name="ClipboardDocumentListIcon"
              size={48}
              className="text-muted-foreground mx-auto mb-4"
            />
            <p className="text-muted-foreground">Yozuvlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                isOpen={expanded === log.id}
                onToggle={() => setExpanded(expanded === log.id ? null : log.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function LogRow({
  log,
  isOpen,
  onToggle,
}: {
  log: AuditLogEntryDTO;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { color, icon } = getActionInfo(log.action);
  return (
    <div className="border border-border rounded-md hover:bg-muted/30 transition-smooth">
      <button onClick={onToggle} className="w-full text-left p-3 flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-muted/50 rounded-md shrink-0">
          <Icon name={icon} size={18} className={color} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <code className={`text-xs font-mono font-semibold ${color}`}>{log.action}</code>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-foreground">{log.admin.fullName}</span>
            {log.ipAddress && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground font-mono">{log.ipAddress}</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {log.targetType}
            {log.targetId && ` · ${log.targetId.slice(0, 8)}...`}
            <span className="mx-2">·</span>
            {formatRelativeTime(log.createdAt)}
          </p>
        </div>
        <Icon
          name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'}
          size={16}
          className="text-muted-foreground shrink-0"
        />
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-0 border-t border-border space-y-2 text-sm">
          <Field label="Vaqt" value={formatDateTime(log.createdAt)} />
          <Field label="Admin" value={`${log.admin.fullName} <${log.admin.email}>`} />
          <Field label="Action" value={log.action} mono />
          <Field label="Target" value={`${log.targetType}${log.targetId ? ` / ${log.targetId}` : ''}`} mono />
          {log.ipAddress && <Field label="IP" value={log.ipAddress} mono />}
          {log.userAgent && (
            <Field label="User Agent" value={log.userAgent} mono small />
          )}
          {log.metadata !== null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Metadata</p>
              <pre className="p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-foreground break-all ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'}`}
      >
        {value}
      </p>
    </div>
  );
}

export default AuditLogPanel;
