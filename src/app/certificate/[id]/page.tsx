'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate } from '@/lib/i18n/format';
import GirihEmblem from '@/app/landing-page/components/GirihEmblem';
import RegistonEmblem from '@/app/landing-page/components/RegistonEmblem';

// Diplom palitrasi (qat'iy hex — chop etishда ranglar aniq chiqishi uchun)
const CERT = {
  cream: '#FBF8EF',
  ink: '#151B3A',
  inkText: '#1B2140',
  gold: '#B5872B', // krem fonda oltin (AA kontrast) — matn/chiziq
  goldBright: '#DFA23A', // emblema/muhr
  mute: '#6B6152',
  line: 'rgba(21,27,58,0.14)',
};
// Romb — burchak bezagi
const DIAMOND = 'M12 3 L15.5 12 L12 21 L8.5 12 Z';
// Madrasa ravog'i — header belgisi
const ARCH_OUTER = 'M5 20 V11 C5 6 8 3.5 12 3.5 C16 3.5 19 6 19 11 V20';
const ARCH_INNER = 'M9.5 20 V12.6 C9.5 10 10.6 8.6 12 8.6 C13.4 8.6 14.5 10 14.5 12.6 V20';

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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ═══ Professional diplom ═══ */}
        <div
          id="certificate-card"
          className="relative rounded-2xl overflow-hidden"
          style={{ background: CERT.cream, border: `2.5px solid ${CERT.ink}`, boxShadow: '0 24px 70px rgba(21,27,58,0.28)' }}
        >
          {/* Ichki oltin ramka */}
          <div className="pointer-events-none absolute inset-[9px] rounded-xl" style={{ border: `1px solid ${CERT.gold}` }} />

          {/* Burchak bezaklari */}
          {['top-5 left-5', 'top-5 right-5', 'bottom-5 left-5', 'bottom-5 right-5'].map((pos) => (
            <svg key={pos} className={`pointer-events-none absolute ${pos}`} width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d={DIAMOND} fill={CERT.gold} opacity="0.55" />
            </svg>
          ))}

          {/* Girih voda-belgisi (markazda, juda nozik) */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0.05, ['--girih-line' as string]: CERT.ink, ['--girih-star' as string]: CERT.ink }}
          >
            <RegistonEmblem animate={false} className="w-[82%] max-w-[560px]" />
          </div>

          <div className="relative px-8 sm:px-16 pt-12 pb-10 text-center">
            {/* Sarlavha */}
            <div className="flex flex-col items-center gap-2.5">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d={ARCH_OUTER} stroke={CERT.goldBright} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
                <path d={ARCH_INNER} stroke={CERT.goldBright} strokeWidth="1.7" strokeOpacity="0.6" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M3.5 20 H20.5" stroke={CERT.goldBright} strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <div>
                <div className="text-3xl tracking-[0.18em] font-semibold" style={{ fontFamily: 'var(--font-display)', color: CERT.ink }}>
                  USTOZ
                </div>
                <div className="text-[10px] tracking-[0.35em] uppercase mt-1.5" style={{ color: CERT.gold }}>
                  {t('certificate.platformTagline')}
                </div>
              </div>
            </div>

            {/* Oltin ajratgich (markazда romb) */}
            <div className="flex items-center justify-center gap-3 my-8">
              <span className="block h-px w-16" style={{ background: CERT.gold, opacity: 0.5 }} />
              <span className="block w-2 h-2 rotate-45" style={{ background: CERT.gold }} />
              <span className="block h-px w-16" style={{ background: CERT.gold, opacity: 0.5 }} />
            </div>

            <p className="text-sm" style={{ color: CERT.mute }}>{t('certificate.awardedTo')}</p>
            <h2 className="text-4xl sm:text-5xl font-medium mt-3 leading-tight" style={{ fontFamily: 'var(--font-display)', color: CERT.inkText }}>
              {certificate.studentName || certificate.studentNameSnapshot}
            </h2>

            {/* Ism ostidagi oltin flourish */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="block h-px w-10" style={{ background: CERT.gold, opacity: 0.5 }} />
              <span className="block w-1.5 h-1.5 rounded-full" style={{ background: CERT.gold }} />
              <span className="block h-px w-10" style={{ background: CERT.gold, opacity: 0.5 }} />
            </div>

            <p className="text-sm mt-7" style={{ color: CERT.mute }}>{t('certificate.forCompleting')}</p>
            <h3 className="text-2xl sm:text-3xl font-medium mt-2" style={{ fontFamily: 'var(--font-display)', color: CERT.ink }}>
              {certificate.courseTitle || certificate.courseTitleSnapshot}
            </h3>
            <p className="text-sm mt-2" style={{ color: CERT.mute }}>
              {t('certificate.teacher')}: {certificate.teacherName || certificate.teacherNameSnapshot}
            </p>

            {/* Footer: sana | muhr | raqam */}
            <div className="mt-10 grid grid-cols-3 items-center">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest" style={{ color: CERT.mute }}>{t('certificate.date')}</p>
                <p className="text-sm font-semibold mt-1" style={{ color: CERT.inkText }}>{issuedDate}</p>
              </div>
              <div className="flex justify-center">
                {/* Muhr — oltin girih emblema halqa ichida */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${CERT.gold}` }} />
                  <div className="absolute inset-2" style={{ ['--girih-line' as string]: CERT.goldBright, ['--girih-star' as string]: CERT.gold }}>
                    <GirihEmblem animate={false} className="w-full h-full" />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest" style={{ color: CERT.mute }}>{t('certificate.number')}</p>
                <p className="text-sm font-semibold mt-1 font-mono" style={{ color: CERT.gold }}>{certificate.certificateNumber}</p>
              </div>
            </div>

            {/* Beruvchi (imzo qatori) */}
            <div className="mt-9 flex flex-col items-center">
              <span className="block w-48 h-px" style={{ background: CERT.line }} />
              <span className="text-xs mt-2.5" style={{ color: CERT.mute }}>Ustoz ta&apos;lim platformasi &middot; Rasmiy sertifikat</span>
            </div>
          </div>
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
