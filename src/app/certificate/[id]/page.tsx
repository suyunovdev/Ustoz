'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate } from '@/lib/i18n/format';

// API (/api/certificates/[id]) camelCase qaytaradi (Prisma modeli). Snapshot
// maydonlari — kurs/foydalanuvchi o'zgarsa ham sertifikatdagi asl qiymat saqlanadi.
interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  verificationUrl: string;
  studentName?: string;
  studentNameSnapshot?: string;
  courseTitle?: string;
  courseTitleSnapshot?: string;
  teacherName?: string;
  teacherNameSnapshot?: string;
}

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useI18n();
  const id = params?.id as string;
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [locked, setLocked] = useState<{ courseTitle?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/certificates/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.certificate) setCertificate(d.certificate);
        else if (d.locked) setLocked(d.preview || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = () => {
    if (certificate?.verificationUrl) {
      navigator.clipboard.writeText(certificate.verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkedInShare = () => {
    if (!certificate) return;
    const url = encodeURIComponent(certificate.verificationUrl);
    const title = encodeURIComponent(t('certificate.shareTitle', { course: certificate.courseTitle || certificate.courseTitleSnapshot || '' }));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  };

  // Yuklab olish: chop-etish oynasi orqali "PDF sifatida saqlash".
  // @media print CSS faqat #certificate-card'ni ko'rsatadi (pastda <style>).
  const handleDownload = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-5">
          <Icon name="LockClosedIcon" size={30} className="text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{t('certGate.lockedTitle')}</h2>
        {locked.courseTitle && <p className="text-primary font-medium mb-1">{locked.courseTitle}</p>}
        <p className="text-muted-foreground max-w-md mb-6">{t('certGate.lockedDesc')}</p>
        <button
          onClick={() => router.push('/student-subscription')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Icon name="SparklesIcon" size={18} />
          {t('certGate.unlock')}
        </button>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <Icon name="DocumentIcon" size={48} className="text-foreground/20 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('certificate.notFound')}</h2>
        <button
          onClick={() => router.push('/student-dashboard')}
          className="mt-4 text-primary hover:underline text-sm"
        >
          {t('certificate.backToDashboard')}
        </button>
      </div>
    );
  }

  const issuedDate = formatDate(certificate.issuedAt, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="no-print border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeftIcon" size={16} />
          <span className="text-sm">{t('common.back')}</span>
        </button>
        <h1 className="font-semibold text-foreground">{t('certificate.myCertificate')}</h1>
        <div className="w-20" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Sertifikat */}
        <div
          id="certificate-card"
          className="bg-white border-4 border-primary/20 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Top gradient */}
          <div className="h-3 bg-gradient-to-r from-primary via-secondary to-primary" />

          <div className="p-10 text-center space-y-5">
            <div>
              <h1 className="text-4xl font-black tracking-widest text-primary mb-1">USTOZ</h1>
              <p className="text-gray-400 text-xs uppercase tracking-widest">{t('certificate.platformTagline')}</p>
            </div>

            <div className="w-20 h-0.5 bg-primary/20 mx-auto" />

            <div>
              <p className="text-gray-500 text-sm mb-2">{t('certificate.awardedTo')}</p>
              <h2 className="text-3xl font-bold text-gray-800">
                {certificate.studentName || certificate.studentNameSnapshot}
              </h2>
            </div>

            <div>
              <p className="text-gray-500 text-sm">{t('certificate.forCompleting')}</p>
              <h3 className="text-2xl font-semibold text-primary mt-2">
                {certificate.courseTitle || certificate.courseTitleSnapshot}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {t('certificate.teacher')}: {certificate.teacherName || certificate.teacherNameSnapshot}
              </p>
            </div>

            <div className="w-20 h-0.5 bg-primary/20 mx-auto" />

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('certificate.date')}</p>
                <p className="font-medium">{issuedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('certificate.number')}</p>
                <p className="font-mono font-semibold text-primary">{certificate.certificateNumber}</p>
              </div>
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="h-3 bg-gradient-to-r from-primary via-secondary to-primary" />
        </div>

        {/* Yuklab olish (PDF — chop etish orqali) */}
        <button
          onClick={handleDownload}
          className="no-print w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <Icon name="ArrowDownTrayIcon" size={18} />
          {t('certificate.download')}
        </button>

        {/* Harakatlar */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 border border-border bg-card text-foreground px-4 py-3 rounded-xl font-medium hover:bg-accent transition-colors text-sm"
          >
            <Icon name={copied ? 'CheckIcon' : 'LinkIcon'} size={16} />
            {copied ? t('certificate.copied') : t('certificate.copyLink')}
          </button>

          <button
            onClick={handleLinkedInShare}
            className="flex items-center justify-center gap-2 bg-[#0077B5] text-white px-4 py-3 rounded-xl font-medium hover:bg-[#006396] transition-colors text-sm"
          >
            <Icon name="ShareIcon" size={16} />
            {t('certificate.shareLinkedIn')}
          </button>

          <a
            href={`/verify/${certificate.certificateNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
          >
            <Icon name="ShieldCheckIcon" size={16} />
            {t('certificate.verify')}
          </a>
        </div>

        {/* Verifikatsiya URL */}
        <div className="no-print bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-foreground/50 mb-1">{t('certificate.verificationLink')}</p>
          <p className="text-sm font-mono text-primary break-all">{certificate.verificationUrl}</p>
        </div>
      </div>

      {/* Chop etish (PDF) uslublari — faqat sertifikat kartasi chiqadi, ranglar bilan */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-card, #certificate-card * { visibility: visible !important; }
          #certificate-card {
            position: absolute; left: 50%; top: 0; transform: translateX(-50%);
            width: 96%; max-width: 1000px; box-shadow: none !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
