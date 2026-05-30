'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherCertificates,
  type CertificateDTO,
  type CertStatusDTO,
} from '@/hooks/queries/useTeacherCertificates';
import {
  useIssueCertificateMutation,
  useRevokeCertificateMutation,
} from '@/hooks/mutations/useCertificateMutations';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';
import { useTeacherStudents } from '@/hooks/queries/useTeacherStudents';

export default function CertificatesClient() {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CertStatusDTO | 'all'>('all');
  const [issueOpen, setIssueOpen] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<CertificateDTO | null>(null);

  const { data, isLoading, error } = useTeacherCertificates({
    courseId: courseFilter || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
  });
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];

  const rows = data?.rows ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/teacher-dashboard"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-semibold">Sertifikatlar</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} ta sertifikat
          </p>
        </div>
        <button
          onClick={() => setIssueOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="TrophyIcon" size={16} />
          Yangi sertifikat
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
            placeholder="CERT- raqami yoki talaba…"
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-background"
        >
          <option value="">Barcha kurslar</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {(['all', 'active', 'revoked'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'Hammasi' : s === 'active' ? 'Aktiv' : 'Bekor'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded-md" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon name="TrophyIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">Hali sertifikat yo'q</p>
          <button
            onClick={() => setIssueOpen(true)}
            className="text-primary hover:underline text-sm"
          >
            Birinchisini bering →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <CertCard
              key={c.id}
              cert={c}
              onRevoke={() => setPendingRevoke(c)}
            />
          ))}
        </div>
      )}

      {issueOpen && (
        <IssueModal
          courses={courses}
          onClose={() => setIssueOpen(false)}
        />
      )}

      {pendingRevoke && (
        <RevokeModal
          cert={pendingRevoke}
          onClose={() => setPendingRevoke(null)}
        />
      )}
    </div>
  );
}

function CertCard({
  cert,
  onRevoke,
}: {
  cert: CertificateDTO;
  onRevoke: () => void;
}) {
  const isRevoked = cert.status === 'revoked';
  return (
    <div
      className={`bg-card border rounded-md p-4 ${
        isRevoked ? 'border-destructive/30 opacity-70' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-md bg-warning/10 text-warning flex items-center justify-center text-xl">
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground">{cert.studentName}</p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isRevoked
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-success/10 text-success'
                }`}
              >
                {isRevoked ? 'Bekor' : 'Aktiv'}
              </span>
              {cert.issueSource === 'manual' && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  Qo'lda
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {cert.courseTitle}
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {cert.certificateNumber}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 text-xs">
          {cert.finalGrade !== null && (
            <p className="text-success font-bold text-base">{cert.finalGrade}/100</p>
          )}
          <p className="text-muted-foreground">
            {new Date(cert.issuedAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
      </div>

      {isRevoked && cert.revokeReason && (
        <p className="text-xs text-destructive mt-2 p-2 bg-destructive/5 rounded">
          ⚠ {cert.revokeReason}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <Link
          href={`/verify/${cert.certificateNumber}`}
          target="_blank"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <Icon name="EyeIcon" size={10} />
          Sertifikatni ko'rish
        </Link>
        {!isRevoked && (
          <button
            onClick={onRevoke}
            className="text-xs text-destructive hover:underline"
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  );
}

function IssueModal({
  courses,
  onClose,
}: {
  courses: Array<{ id: string; title: string }>;
  onClose: () => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [finalGrade, setFinalGrade] = useState<number | ''>(80);
  const [forceIssue, setForceIssue] = useState(false);
  const mut = useIssueCertificateMutation();
  const students = useTeacherStudents({
    courseId: courseId || undefined,
    search: studentSearch.trim() || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return toast.error("Kurs tanlang");
    if (!studentId) return toast.error("Talaba tanlang");
    mut.mutate(
      {
        courseId,
        studentId,
        finalGrade: typeof finalGrade === 'number' ? finalGrade : undefined,
        forceIssue,
      },
      {
        onSuccess: ({ certificateNumber, created }) => {
          toast.success(
            created
              ? `Berildi: ${certificateNumber}`
              : `Sertifikat allaqachon mavjud: ${certificateNumber}`,
          );
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const studentRows = students.data?.students ?? [];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !mut.isPending && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">Sertifikat berish</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kurs *</label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setStudentId('');
              }}
              required
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              <option value="">— tanlang —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Talaba *</label>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Ism yoki email…"
              className="w-full px-3 py-2 border border-border rounded-md text-sm mb-2"
            />
            <ul className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border">
              {studentRows.length === 0 ? (
                <li className="p-3 text-center text-sm text-muted-foreground italic">
                  {students.isLoading ? 'Yuklanmoqda…' : "Mos talaba yo'q"}
                </li>
              ) : (
                studentRows.map((s) => (
                  <li key={s.studentId}>
                    <button
                      type="button"
                      onClick={() => setStudentId(s.studentId)}
                      className={`w-full text-left p-2 text-sm hover:bg-muted ${
                        studentId === s.studentId ? 'bg-primary/10' : ''
                      }`}
                    >
                      <p className="font-medium truncate">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.email} · Progress: {s.avgProgress}%
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Yakuniy bal (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={finalGrade}
              onChange={(e) =>
                setFinalGrade(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceIssue}
              onChange={(e) => setForceIssue(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Force issue</strong> — talaba kursni tugatmagan bo'lsa ham bering
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={mut.isPending}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            type="submit"
            disabled={mut.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            Berish
          </button>
        </div>
      </form>
    </div>
  );
}

function RevokeModal({
  cert,
  onClose,
}: {
  cert: CertificateDTO;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const mut = useRevokeCertificateMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast.error("Sabab kamida 5 belgi");
      return;
    }
    mut.mutate(
      { certificateId: cert.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Sertifikat bekor qilindi");
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !mut.isPending && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold text-destructive">
            Sertifikatni bekor qilish
          </h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {cert.studentName} · {cert.courseTitle}
        </p>
        <p className="text-xs font-mono text-muted-foreground mb-4">
          {cert.certificateNumber}
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">
            Sabab * (kamida 5 belgi)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            placeholder="Masalan: Plagiat aniqlandi, qayta tekshirish kerak…"
            className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={mut.isPending}
            className="px-3 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            type="submit"
            disabled={mut.isPending}
            className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {mut.isPending && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            Bekor qilish
          </button>
        </div>
      </form>
    </div>
  );
}
