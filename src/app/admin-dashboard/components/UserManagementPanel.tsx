'use client';

import { useState, useMemo } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import { useAdminUsers, type AdminUserDTO } from '@/hooks/queries/useAdminUsers';
import { useUserActionMutation } from '@/hooks/mutations/useUserActionMutation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

type RoleFilter = 'all' | 'student' | 'teacher' | 'admin';

interface PendingAction {
  user: AdminUserDTO;
  type: 'suspend' | 'activate' | 'change_role';
  newRole?: 'student' | 'teacher' | 'admin';
}

// ROLE_LABELS are now driven by t() inside the component

// FILTERS are now driven by t() inside the component

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uz-UZ');
}

const UserManagementPanel = () => {
  const { user: currentUser } = useAuth();
  const { t } = useI18n();

  const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    admin: { label: t('admin.roleAdmin'), color: 'bg-destructive/10 text-destructive' },
    teacher: { label: t('admin.roleTeacher'), color: 'bg-primary/10 text-primary' },
    student: { label: t('admin.roleStudent'), color: 'bg-success/10 text-success' },
  };

  const FILTERS: { id: RoleFilter; label: string }[] = [
    { id: 'all', label: t('admin.filterAll') },
    { id: 'teacher', label: t('admin.filterTeachers') },
    { id: 'student', label: t('admin.filterStudents') },
    { id: 'admin', label: t('admin.filterAdmins') },
  ];
  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useAdminUsers({
    role: filterRole,
    search: search || undefined,
  });

  const actionMutation = useUserActionMutation();

  // Debounce search (300ms)
  useMemo(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

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
      message: `${pending.user.fullName}'ning rolini ${ROLE_LABELS[pending.user.role]?.label} → ${ROLE_LABELS[pending.newRole!]?.label}'ga o'zgartirilsinmi?`,
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
        {
          onSuccess: () => onSuccess(t('admin.userSuspended')),
          onError,
        },
      );
    } else if (pending.type === 'activate') {
      actionMutation.mutate(
        { userId: pending.user.id, action: 'activate' },
        {
          onSuccess: () => onSuccess(t('admin.userActivated')),
          onError,
        },
      );
    } else {
      actionMutation.mutate(
        { userId: pending.user.id, action: 'change_role', newRole: pending.newRole! },
        {
          onSuccess: () => onSuccess(t('admin.roleChanged')),
          onError,
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterRole(f.id)}
                className={`px-4 py-2 rounded-md transition-smooth text-sm font-medium ${
                  filterRole === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Icon
              name="MagnifyingGlassIcon"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder={t('admin.searchByEmailOrName')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-80"
            />
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {t('admin.usersCount')} ({total})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">{t('admin.updating')}</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4 text-sm text-destructive flex items-center justify-between">
            <span>{t('admin.error')}: {error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              {t('admin.retryBtn')}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={`user-skeleton-${i}`} className="animate-pulse">
                <div className="h-16 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="UserGroupIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.usersNotFound')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const roleBadge = ROLE_LABELS[user.role] ?? ROLE_LABELS.student;
              const isSelf = currentUser?.id === user.id;
              const menuOpen = openMenuFor === user.id;
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full shrink-0">
                      <Icon name="UserIcon" size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-semibold text-foreground truncate">
                          {user.fullName}
                        </h4>
                        {!user.isActive && (
                          <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded-full">
                            {t('admin.blocked')}
                          </span>
                        )}
                        {isSelf && (
                          <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                            {t('admin.you')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('admin.joinedAt')}: {formatDate(user.createdAt)} · {t('admin.lastLogin')}:{' '}
                        {formatDate(user.lastLoginAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}
                    >
                      {roleBadge.label}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuFor(menuOpen ? null : user.id)}
                        disabled={isSelf}
                        className="p-2 hover:bg-muted rounded-md transition-smooth disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Amallar menyusi"
                      >
                        <Icon name="EllipsisVerticalIcon" size={20} className="text-muted-foreground" />
                      </button>
                      {menuOpen && !isSelf && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuFor(null)}
                          />
                          <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-md shadow-warm-lg z-20 py-1">
                            {user.isActive ? (
                              <button
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ user, type: 'suspend' });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                              >
                                <Icon name="NoSymbolIcon" size={16} />
                                {t('admin.suspendBtn')}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ user, type: 'activate' });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-success hover:bg-success/10 flex items-center gap-2"
                              >
                                <Icon name="CheckCircleIcon" size={16} />
                                {t('admin.activateBtn')}
                              </button>
                            )}
                            <div className="border-t border-border my-1" />
                            <p className="px-4 py-1 text-xs text-muted-foreground">{t('admin.changeRole')}</p>
                            {(['student', 'teacher', 'admin'] as const).map((r) => (
                              <button
                                key={r}
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ user, type: 'change_role', newRole: r });
                                }}
                                disabled={user.role === r}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <Icon name="ArrowRightIcon" size={14} />
                                {ROLE_LABELS[r].label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
