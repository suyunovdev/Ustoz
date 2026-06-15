'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherGroup,
  useGroupMembers,
  type GroupMemberDTO,
} from '@/hooks/queries/useTeacherGroups';
import { useTeacherStudents } from '@/hooks/queries/useTeacherStudents';
import {
  useUpdateGroupMutation,
  useBulkAddMembersMutation,
  useRemoveMemberMutation,
  useBroadcastToGroupMutation,
} from '@/hooks/mutations/useGroupMutations';
import { COLOR_CLASS } from '../GroupsListClient';

interface Props {
  groupId: string;
}

export default function GroupDetailClient({ groupId }: Props) {
  const group = useTeacherGroup(groupId);
  const members = useGroupMembers(groupId);
  const updateMut = useUpdateGroupMutation(groupId);
  const removeMut = useRemoveMemberMutation(groupId);
  const broadcastMut = useBroadcastToGroupMutation(groupId);

  const [addOpen, setAddOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<GroupMemberDTO | null>(null);

  if (group.isLoading || !group.data) return <div className="p-8">Yuklanmoqda…</div>;
  if (group.error)
    return <div className="p-8 text-destructive">{(group.error as Error).message}</div>;

  const g = group.data.group;
  const c = COLOR_CLASS[g.color] ?? COLOR_CLASS.blue;
  const full = g.memberCount >= g.maxMembers;

  const handleArchive = () => {
    updateMut.mutate(
      { status: g.status === 'archived' ? 'active' : 'archived' },
      {
        onSuccess: () =>
          toast.success(g.status === 'archived' ? 'Faollashtirildi' : 'Arxivlandi'),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const memberList = members.data?.members ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/teacher-dashboard/groups"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        Guruhlar
      </Link>

      <div className="bg-card border border-border rounded-md p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`w-12 h-12 rounded-md ${c.bg} ${c.text} flex items-center justify-center text-xl font-medium`}
            >
              {g.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-heading font-semibold">{g.name}</h1>
              {g.description && (
                <p className="text-sm text-muted-foreground mt-1">{g.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    full ? 'bg-destructive/10 text-destructive' : c.bg + ' ' + c.text
                  }`}
                >
                  👥 {g.memberCount} / {g.maxMembers}
                </span>
                {g.scheduleNote && (
                  <span className="text-muted-foreground">📅 {g.scheduleNote}</span>
                )}
                {g.status === 'archived' && (
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                    Arxiv
                  </span>
                )}
              </div>
              {g.meetingUrl && (
                <a
                  href={g.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Icon name="VideoCameraIcon" size={12} />
                  {g.meetingUrl}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setBroadcastOpen(true)}
              disabled={memberList.length === 0}
              className="px-3 py-2 border border-border rounded-md hover:bg-muted text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Icon name="MegaphoneIcon" size={14} />
              Broadcast
            </button>
            <button
              onClick={handleArchive}
              disabled={updateMut.isPending}
              className={`px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${
                g.status === 'archived'
                  ? 'bg-success text-success-foreground'
                  : 'bg-warning text-warning-foreground'
              }`}
            >
              {g.status === 'archived' ? 'Faollashtirish' : 'Arxivlash'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">A'zolar ({memberList.length})</h2>
        <button
          onClick={() => setAddOpen(true)}
          disabled={full}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Icon name="UserPlusIcon" size={14} />
          A'zo qo'shish
        </button>
      </div>

      {members.isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-14 bg-muted rounded-md" />
          ))}
        </div>
      ) : memberList.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-md text-sm text-muted-foreground italic">
          Hali a'zo yo'q. "A'zo qo'shish" bilan boshlang.
        </div>
      ) : (
        <ul className="space-y-2">
          {memberList.map((m) => (
            <li
              key={m.studentId}
              className="bg-card border border-border rounded-md p-3 flex items-center gap-3"
            >
              {m.avatarUrl ? (
                <AppImage
                  src={m.avatarUrl}
                  alt={m.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  {m.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/teacher-dashboard/students/${m.studentId}`}
                  className="font-medium text-foreground hover:text-primary truncate block"
                >
                  {m.fullName}
                </Link>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(m.joinedAt).toLocaleDateString('uz-UZ')}
              </div>
              <button
                onClick={() => setPendingRemove(m)}
                className="p-2 hover:bg-destructive/10 rounded text-destructive"
                aria-label="O'chirish"
              >
                <Icon name="XMarkIcon" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {addOpen && (
        <AddMembersModal
          groupId={groupId}
          existingMemberIds={memberList.map((m) => m.studentId)}
          maxSlots={g.maxMembers - g.memberCount}
          onClose={() => setAddOpen(false)}
        />
      )}

      {broadcastOpen && (
        <BroadcastModal
          groupName={g.name}
          memberCount={memberList.length}
          isLoading={broadcastMut.isPending}
          onSubmit={(input) =>
            broadcastMut.mutate(input, {
              onSuccess: ({ sent }) => {
                toast.success(`${sent} a'zoga yuborildi`);
                setBroadcastOpen(false);
              },
              onError: (err) => toast.error(err.message),
            })
          }
          onClose={() => setBroadcastOpen(false)}
        />
      )}

      {pendingRemove && (
        <ConfirmModal
          open={true}
          title="A'zoni olib tashlash"
          message={`${pendingRemove.fullName} guruhdan olib tashlanadi.`}
          confirmLabel="Olib tashlash"
          variant="danger"
          isLoading={removeMut.isPending}
          onConfirm={() => {
            removeMut.mutate(pendingRemove.studentId, {
              onSuccess: () => {
                toast.success("Olib tashlandi");
                setPendingRemove(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          onCancel={() => !removeMut.isPending && setPendingRemove(null)}
        />
      )}
    </div>
  );
}

function AddMembersModal({
  groupId,
  existingMemberIds,
  maxSlots,
  onClose,
}: {
  groupId: string;
  existingMemberIds: string[];
  maxSlots: number;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allStudents = useTeacherStudents();
  const bulkMut = useBulkAddMembersMutation(groupId);

  const existingSet = useMemo(() => new Set(existingMemberIds), [existingMemberIds]);

  const filtered = useMemo(() => {
    const list = allStudents.data?.students ?? [];
    const q = search.trim().toLowerCase();
    return list.filter(
      (s) =>
        !existingSet.has(s.studentId) &&
        (q === '' ||
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)),
    );
  }, [allStudents.data, search, existingSet]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxSlots) next.add(id);
      else {
        toast.error(`Faqat ${maxSlots} ta bo'sh joy`);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return toast.error("Hech kim tanlanmagan");
    bulkMut.mutate(Array.from(selected), {
      onSuccess: ({ added, skipped, ineligible }) => {
        if (added > 0) toast.success(`${added} a'zo qo'shildi`);
        if (skipped > 0) toast.info(`${skipped} ta o'tkazib yuborildi (allaqachon yoki to'lgan)`);
        if (ineligible > 0) toast.info(`${ineligible} ta yozilmagan`);
        onClose();
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !bulkMut.isPending && onClose()}
    >
      <div
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">A'zo qo'shish</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Talaba qidirish…"
          className="w-full px-3 py-2 border border-border rounded-md text-sm mb-3"
        />

        <p className="text-xs text-muted-foreground mb-2">
          Tanlandi: {selected.size} / Bo'sh joy: {maxSlots}
        </p>

        <ul className="max-h-72 overflow-y-auto border border-border rounded-md divide-y divide-border">
          {filtered.length === 0 ? (
            <li className="p-3 text-sm text-center text-muted-foreground italic">
              {allStudents.isLoading ? 'Yuklanmoqda…' : "Mos talaba yo'q"}
            </li>
          ) : (
            filtered.map((s) => {
              const isSelected = selected.has(s.studentId);
              return (
                <li key={s.studentId}>
                  <button
                    type="button"
                    onClick={() => toggle(s.studentId)}
                    className={`w-full text-left p-3 text-sm flex items-center gap-2 hover:bg-muted ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
          <button
            onClick={onClose}
            disabled={bulkMut.isPending}
            className="px-3 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            onClick={handleSubmit}
            disabled={bulkMut.isPending || selected.size === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {bulkMut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {selected.size > 0 ? `${selected.size} ta qo'shish` : "Qo'shish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BroadcastModal({
  groupName,
  memberCount,
  isLoading,
  onSubmit,
  onClose,
}: {
  groupName: string;
  memberCount: number;
  isLoading: boolean;
  onSubmit: (input: { title: string; message: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return toast.error("Sarlavha kamida 2 belgi");
    if (message.trim().length < 2) return toast.error("Xabar kamida 2 belgi");
    onSubmit({ title: title.trim(), message: message.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">Guruhga xabar</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          "{groupName}" ({memberCount} a'zo)
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Sarlavha *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Xabar *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            Yuborish
          </button>
        </div>
      </form>
    </div>
  );
}
