'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherGroups,
  type GroupDTO,
  type GroupStatusDTO,
  type GroupColorDTO,
} from '@/hooks/queries/useTeacherGroups';
import {
  useCreateGroupMutation,
  useDeleteGroupMutation,
} from '@/hooks/mutations/useGroupMutations';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';

export const COLOR_CLASS: Record<GroupColorDTO, { bg: string; text: string; ring: string }> = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-500/20',   text: 'text-blue-700 dark:text-blue-400',   ring: 'ring-blue-300 dark:ring-blue-500/40' },
  green:  { bg: 'bg-green-100 dark:bg-green-500/20',  text: 'text-green-700 dark:text-green-400',  ring: 'ring-green-300 dark:ring-green-500/40' },
  red:    { bg: 'bg-red-100 dark:bg-red-500/20',    text: 'text-red-700 dark:text-red-400',    ring: 'ring-red-300 dark:ring-red-500/40' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', ring: 'ring-yellow-300 dark:ring-yellow-500/40' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-300 dark:ring-purple-500/40' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-300 dark:ring-orange-500/40' },
  pink:   { bg: 'bg-pink-100 dark:bg-pink-500/20',   text: 'text-pink-700 dark:text-pink-400',   ring: 'ring-pink-300 dark:ring-pink-500/40' },
};

export default function GroupsListClient() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GroupStatusDTO | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GroupDTO | null>(null);

  const { data, isLoading, error } = useTeacherGroups({
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];

  const createMut = useCreateGroupMutation();
  const deleteMut = useDeleteGroupMutation();

  const groups = data?.groups ?? [];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/teacher-dashboard"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-foreground">Guruhlar</h1>
          <p className="text-sm text-muted-foreground">
            {groups.length} ta guruh · {groups.reduce((s, g) => s + g.memberCount, 0)} a'zo
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={16} />
          Yangi guruh
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="MagnifyingGlassIcon"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guruh nomi…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        {(['all', 'active', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'Hammasi' : s === 'active' ? 'Faol' : 'Arxiv'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-muted rounded-md" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon name="UsersIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">Hali guruh yo'q</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-primary hover:underline text-sm"
          >
            Birinchi guruhni yarating →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((g) => {
            const c = COLOR_CLASS[g.color] ?? COLOR_CLASS.blue;
            const full = g.memberCount >= g.maxMembers;
            return (
              <Link
                key={g.id}
                href={`/teacher-dashboard/groups/${g.id}`}
                className={`bg-card border border-border rounded-md p-4 hover:shadow-warm-md transition-smooth ${
                  g.status === 'archived' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-md ${c.bg} ${c.text} flex items-center justify-center font-medium`}
                  >
                    {g.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{g.name}</h3>
                    {g.courseTitle && (
                      <p className="text-xs text-muted-foreground truncate">{g.courseTitle}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setPendingDelete(g);
                    }}
                    className="p-1 hover:bg-destructive/10 rounded text-destructive"
                    aria-label="O'chirish"
                  >
                    <Icon name="TrashIcon" size={12} />
                  </button>
                </div>
                {g.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {g.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
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
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Icon name="VideoCameraIcon" size={10} />
                    Meeting link
                  </a>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateGroupModal
          courses={courses}
          isLoading={createMut.isPending}
          onCreate={(input) =>
            createMut.mutate(input, {
              onSuccess: ({ group }) => {
                toast.success("Guruh yaratildi");
                router.push(`/teacher-dashboard/groups/${group.id}`);
              },
              onError: (err) => toast.error(err.message),
            })
          }
          onClose={() => setCreateOpen(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          open={true}
          title="Guruhni o'chirish"
          message={`"${pendingDelete.name}" guruhi va a'zoligi o'chiriladi.`}
          confirmLabel="O'chirish"
          variant="danger"
          isLoading={deleteMut.isPending}
          onConfirm={() => {
            deleteMut.mutate(pendingDelete.id, {
              onSuccess: () => {
                toast.success("Guruh o'chirildi");
                setPendingDelete(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          onCancel={() => !deleteMut.isPending && setPendingDelete(null)}
        />
      )}
    </div>
  );
}

const COLORS: GroupColorDTO[] = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'pink'];

function CreateGroupModal({
  courses,
  isLoading,
  onCreate,
  onClose,
}: {
  courses: Array<{ id: string; title: string }>;
  isLoading: boolean;
  onCreate: (input: {
    name: string;
    description?: string;
    courseId?: string | null;
    maxMembers?: number;
    meetingUrl?: string;
    scheduleNote?: string;
    color?: GroupColorDTO;
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [maxMembers, setMaxMembers] = useState(30);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [color, setColor] = useState<GroupColorDTO>('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Nomi kamida 2 belgi");
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      courseId: courseId || null,
      maxMembers,
      meetingUrl: meetingUrl.trim() || undefined,
      scheduleNote: scheduleNote.trim() || undefined,
      color,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !isLoading && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-lg w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">Yangi guruh</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="React 2026 Spring guruh"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tavsif</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Kurs (ixtiyoriy)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="">— hech qaysi —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max a'zo</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meeting URL (ixtiyoriy)</label>
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/…"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jadval</label>
            <input
              type="text"
              value={scheduleNote}
              onChange={(e) => setScheduleNote(e.target.value)}
              placeholder="Du-Pa 19:00, Sha 10:00"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rang</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => {
                const cls = COLOR_CLASS[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-md ${cls.bg} ${
                      color === c ? `ring-2 ${cls.ring} ring-offset-2` : ''
                    }`}
                    aria-label={c}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
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
            Yaratish
          </button>
        </div>
      </form>
    </div>
  );
}
