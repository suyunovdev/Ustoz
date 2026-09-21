'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { DataTable, type Column, type SortState } from '@/components/ui/DataTable';
import { Menu } from '@/components/ui/Menu';
import { Pagination } from '@/components/ui/Pagination';
import { Toolbar, SearchInput, FilterChips } from '@/components/ui/Toolbar';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminUsers,
  type AdminUserDTO,
  type AdminUsersSortField,
} from '@/hooks/queries/useAdminUsers';
import { useUserActionMutation } from '@/hooks/mutations/useUserActionMutation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate as fmtDate } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

type RoleFilter = 'all' | 'student' | 'teacher' | 'admin';

interface PendingAction {
  user: AdminUserDTO;
  type: 'suspend' | 'activate' | 'change_role';
  newRole?: 'student' | 'teacher' | 'admin';
}

const ROLE_VARIANT: Record<string, BadgeVariant> = {
  admin: 'destructive',
  teacher: 'primary',
  student: 'success',
};

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return '—';
  return fmtDate(iso, locale, {});
}

const UserManagementPanel = () => {
  const { user: currentUser } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();

  const roleLabel = (role: string) =>
    role === 'admin'
      ? t('admin.roleAdmin')
      : role === 'teacher'
        ? t('admin.roleTeacher')
        : t('admin.roleStudent');

  const FILTERS: { id: RoleFilter; label: string }[] = [
    { id: 'all', label: t('admin.filterAll') },
    { id: 'teacher', label: t('admin.filterTeachers') },
    { id: 'student', label: t('admin.filterStudents') },
    { id: 'admin', label: t('admin.filterAdmins') },
  ];

  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const [pending, setPending] = useState<PendingAction | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useAdminUsers({
    role: filterRole,
    search: search || undefined,
    page,
    pageSize,
    sort: sort.key as AdminUsersSortField,
    order: sort.dir,
  });

  const actionMutation = useUserActionMutation();

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  // Filtr/qidiruv/sort/hajm o'zgarsa birinchi sahifaga qaytamiz.
  const resetTo = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const handleSort = (s: SortState) => {
    setSort(s);
    setPage(1);
  };

  const confirmTexts = (() => {
    if (!pending) return null;
    if (pending.type === 'suspend') {
      return {
        title: t('admin.suspendUser'),
        message: `${pending.user.fullName} (${pending.user.email}) hisobini bloklamoqchimisiz? U tizimga kira olmaydi.`,
        confirmLabel: t('admin.suspendBtn'),
        variant: 'danger' as const,
      };
    }
    if (pending.type === 'activate') {
      return {
        title: t('admin.activateUser'),
        message: `${pending.user.fullName} (${pending.user.email}) hisobini qaytadan faollashtirilsinmi?`,
        confirmLabel: t('admin.activateBtn'),
        variant: 'default' as const,
      };
    }
    return {
      title: t('admin.changeRole'),
      message: `${pending.user.fullName}'ning rolini ${roleLabel(pending.user.role)} → ${roleLabel(pending.newRole!)}'ga o'zgartirilsinmi?`,
      confirmLabel: t('admin.changeBtn'),
      variant: 'default' as const,
    };
  })();

  const handleConfirm = () => {
    if (!pending) return;
    const onSuccess = (msg: string) => {
      toast.success(msg);
      setPending(null);
    };
    const onError = (err: Error) => {
      toast.error(err.message);
      setPending(null);
    };

    if (pending.type === 'suspend') {
      actionMutation.mutate(
        { userId: pending.user.id, action: 'suspend' },
        { onSuccess: () => onSuccess(t('admin.userSuspended')), onError },
      );
    } else if (pending.type === 'activate') {
      actionMutation.mutate(
        { userId: pending.user.id, action: 'activate' },
        { onSuccess: () => onSuccess(t('admin.userActivated')), onError },
      );
    } else {
      actionMutation.mutate(
        { userId: pending.user.id, action: 'change_role', newRole: pending.newRole! },
        { onSuccess: () => onSuccess(t('admin.roleChanged')), onError },
      );
    }
  };

  const columns: Column<AdminUserDTO>[] = [
    {
      key: 'fullName',
      header: t('admin.colUser'),
      sortable: true,
      render: (u) => {
        const isSelf = currentUser?.id === u.id;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={u.avatarUrl} name={u.fullName} size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground truncate">{u.fullName}</span>
                {!u.isActive && <Badge variant="destructive">{t('admin.blocked')}</Badge>}
                {isSelf && <Badge variant="muted">{t('admin.you')}</Badge>}
              </div>
              <span className="text-xs text-muted-foreground truncate md:hidden">{u.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      header: t('admin.colEmail'),
      sortable: true,
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground',
      render: (u) => <span className="truncate">{u.email}</span>,
    },
    {
      key: 'role',
      header: t('admin.colRole'),
      sortable: true,
      render: (u) => (
        <Badge variant={ROLE_VARIANT[u.role] ?? 'muted'}>{roleLabel(u.role)}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.joinedAt'),
      sortable: true,
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground whitespace-nowrap',
      render: (u) => formatDate(u.createdAt, locale),
    },
    {
      key: 'lastLoginAt',
      header: t('admin.lastLogin'),
      sortable: true,
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground whitespace-nowrap',
      render: (u) => formatDate(u.lastLoginAt, locale),
    },
    {
      key: 'actions',
      header: t('admin.colActions'),
      align: 'right',
      width: 'w-16',
      render: (u) => {
        const isSelf = currentUser?.id === u.id;
        return (
          <Menu
            triggerLabel={t('admin.actionsMenu')}
            disabled={isSelf}
            sections={[
              {
                items: [
                  u.isActive
                    ? {
                        label: t('admin.suspendBtn'),
                        icon: 'NoSymbolIcon',
                        variant: 'danger' as const,
                        onClick: () => setPending({ user: u, type: 'suspend' }),
                      }
                    : {
                        label: t('admin.activateBtn'),
                        icon: 'CheckCircleIcon',
                        variant: 'success' as const,
                        onClick: () => setPending({ user: u, type: 'activate' }),
                      },
                ],
              },
              {
                label: t('admin.changeRole'),
                items: (['student', 'teacher', 'admin'] as const).map((r) => ({
                  label: roleLabel(r),
                  icon: 'ArrowRightIcon',
                  disabled: u.role === r,
                  onClick: () => setPending({ user: u, type: 'change_role', newRole: r }),
                })),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <FilterChips options={FILTERS} value={filterRole} onChange={resetTo(setFilterRole)} />
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">{t('admin.updating')}</span>
          )}
        </div>
        <SearchInput
          placeholder={t('admin.searchByEmailOrName')}
          onSearch={resetTo(setSearch)}
        />
      </Toolbar>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive flex items-center justify-between">
          <span>
            {t('admin.error')}: {error.message}
          </span>
          <button onClick={() => refetch()} className="underline text-xs">
            {t('admin.retryBtn')}
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={users}
        getRowId={(u) => u.id}
        onRowClick={(u) => router.push(`/admin-dashboard/users/${u.id}`)}
        sort={sort}
        onSortChange={handleSort}
        isLoading={isLoading}
        emptyIcon="UserGroupIcon"
        emptyTitle={t('admin.usersNotFound')}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={resetTo(setPageSize)}
        isFetching={isFetching}
      />

      {confirmTexts && (
        <ConfirmModal
          open={pending !== null}
          title={confirmTexts.title}
          message={confirmTexts.message}
          confirmLabel={confirmTexts.confirmLabel}
          variant={confirmTexts.variant}
          isLoading={actionMutation.isPending}
          onConfirm={handleConfirm}
          onCancel={() => !actionMutation.isPending && setPending(null)}
        />
      )}
    </div>
  );
};

export default UserManagementPanel;
