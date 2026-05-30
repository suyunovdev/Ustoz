'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import {
  usePublicTeacher,
  usePublicTeacherCourses,
} from '@/hooks/queries/useProfile';

function fmtUzs(s: string): string {
  const n = BigInt(s);
  if (n === BigInt(0)) return 'Bepul';
  if (n >= BigInt(1_000_000)) return `${(Number(n) / 1_000_000).toFixed(1)}M UZS`;
  if (n >= BigInt(1_000)) return `${(Number(n) / 1_000).toFixed(0)}K UZS`;
  return `${n.toString()} UZS`;
}

const SOCIAL_ICON: Record<string, string> = {
  website: 'GlobeAltIcon',
  github: 'CodeBracketIcon',
  twitter: 'MegaphoneIcon',
  linkedin: 'BriefcaseIcon',
  telegram: 'PaperAirplaneIcon',
  youtube: 'VideoCameraIcon',
  facebook: 'UsersIcon',
  instagram: 'CameraIcon',
};

interface Props {
  teacherId: string;
}

export default function PublicTeacherClient({ teacherId }: Props) {
  const teacher = usePublicTeacher(teacherId);
  const courses = usePublicTeacherCourses(teacherId);

  if (teacher.isLoading || !teacher.data) return <div className="p-8">Yuklanmoqda…</div>;
  if (teacher.error) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <Icon name="UserIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-destructive mb-3">
          {(teacher.error as Error)?.message ?? "O'qituvchi topilmadi"}
        </p>
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Bosh sahifa
        </Link>
      </div>
    );
  }

  const t = teacher.data.teacher;
  const courseRows = courses.data?.courses ?? [];
  const socials = Object.entries(t.socialLinks).filter(([, v]) => v.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 via-background to-warning/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-start gap-6 flex-wrap">
            {t.avatarUrl ? (
              <img
                src={t.avatarUrl}
                alt={t.fullName}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-card shadow-warm-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 text-primary flex items-center justify-center text-5xl font-medium ring-4 ring-card shadow-warm-lg">
                {t.fullName.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-heading font-bold text-foreground">
                {t.fullName}
              </h1>
              {t.headline && (
                <p className="text-primary mt-1">{t.headline}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Platformaga qo'shilgan:{' '}
                {new Date(t.joinedAt).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>

              {socials.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {socials.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 bg-muted/50 rounded-full"
                    >
                      <Icon name={SOCIAL_ICON[key] ?? 'LinkIcon'} size={10} />
                      {key}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatCard
              icon="BookOpenIcon"
              label="Kurslar"
              value={t.totalCourses}
            />
            <StatCard
              icon="UserGroupIcon"
              label="Talabalar"
              value={t.totalStudents.toLocaleString('uz-UZ')}
            />
            <StatCard
              icon="StarIcon"
              label="Reyting"
              value={t.avgRating > 0 ? `${t.avgRating} ⭐` : '—'}
            />
            <StatCard
              icon="ChatBubbleLeftRightIcon"
              label="Sharhlar"
              value={t.totalReviews}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {t.bio && (
          <div className="bg-card border border-border rounded-md p-6 mb-6">
            <h2 className="font-medium mb-2">Haqida</h2>
            <p className="text-sm text-foreground whitespace-pre-wrap">{t.bio}</p>
          </div>
        )}

        {t.expertise.length > 0 && (
          <div className="bg-card border border-border rounded-md p-6 mb-6">
            <h2 className="font-medium mb-3">Mavzular</h2>
            <div className="flex flex-wrap gap-2">
              {t.expertise.map((e) => (
                <span
                  key={e}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-heading font-semibold mb-3">
          Kurslar ({courseRows.length})
        </h2>
        {courses.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-32 bg-muted rounded-md" />
            ))}
          </div>
        ) : courseRows.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-8 bg-muted/30 rounded-md">
            Hali nashr qilingan kurs yo'q
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courseRows.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="bg-card border border-border rounded-md p-4 hover:shadow-warm-md transition-smooth flex items-start gap-3"
              >
                {c.coverImage ? (
                  <img
                    src={c.coverImage}
                    alt={c.title}
                    className="w-16 h-16 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon name="BookOpenIcon" size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{c.title}</h3>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>👤 {c.enrollmentCount}</span>
                    {c.rating > 0 && (
                      <span className="text-warning">⭐ {c.rating}</span>
                    )}
                    <span className="text-foreground font-medium">
                      {fmtUzs(c.priceUzs)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
