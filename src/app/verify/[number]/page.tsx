import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface CertificateData {
  id: string;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  finalGrade: number | null;
  completionPercent: number;
  status: string;
  issuedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
}

async function fetchCertificate(number: string): Promise<CertificateData | null> {
  const h = await headers();
  const host = h.get('host') ?? 'localhost:4028';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const res = await fetch(`${proto}://${host}/api/verify/${number}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.certificate;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const cert = await fetchCertificate(number);
  if (!cert) return notFound();

  const isRevoked = cert.status === 'revoked';
  const issuedAt = new Date(cert.issuedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-warning/5 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-card border-2 border-border rounded-lg shadow-warm-lg overflow-hidden">
          <div
            className={`px-6 py-3 flex items-center justify-between ${
              isRevoked
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              {isRevoked ? '⚠️ Bekor qilingan' : '✓ Tasdiqlandi'}
            </div>
            <div className="text-xs font-mono opacity-80">{cert.certificateNumber}</div>
          </div>

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-2">🏆</div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Sertifikat
              </p>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Quyidagi shaxsga taqdim etiladi
            </p>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-6">
              {cert.studentName}
            </h1>

            <p className="text-sm text-muted-foreground mb-2">
              Quyidagi kursni muvaffaqiyatli yakunlagani uchun
            </p>
            <h2 className="text-2xl font-medium text-primary mb-6">
              {cert.courseTitle}
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground">Yakunlash</p>
                <p className="text-lg font-bold text-foreground">
                  {cert.completionPercent}%
                </p>
              </div>
              {cert.finalGrade !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Yakuniy bal</p>
                  <p className="text-lg font-bold text-foreground">
                    {cert.finalGrade}/100
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Berilgan</p>
                <p className="text-lg font-bold text-foreground">
                  {issuedAt.toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-1">O'qituvchi</p>
            <p className="text-base font-medium text-foreground mb-6">
              {cert.teacherName}
            </p>

            {isRevoked && cert.revokeReason && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
                <strong>Bekor qilish sababi:</strong> {cert.revokeReason}
                {cert.revokedAt && (
                  <p className="text-xs mt-1 opacity-80">
                    Sana: {new Date(cert.revokedAt).toLocaleDateString('uz-UZ')}
                  </p>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground font-mono pt-4 border-t border-border">
              <p>Tekshirish kodi: {cert.certificateNumber}</p>
              <p className="mt-1">Ustoz.uz · Onlayn ta'lim platformasi</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
