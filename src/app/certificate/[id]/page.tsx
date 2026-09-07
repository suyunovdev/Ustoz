'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate } from '@/lib/i18n/format';
import GirihEmblem from '@/app/landing-page/components/GirihEmblem';
import RegistonEmblem from '@/app/landing-page/components/RegistonEmblem';

// Diplom palitrasi (qat'iy hex — chop etishda ranglar aniq chiqishi uchun) — brandbook
const CERT = {
  cream: '#FFFFFF', // oq qog'oz
  ink: '#0F2447', // Tun
  inkText: '#17223A', // Matn
  gold: '#1548B3', // urg'u/chiziq — chuqur ko'k (oq fonda AA)
  goldBright: '#1F5EDC', // Ustoz ko'ki — emblema/muhr
  sun: '#FFB930', // Quyosh — kichik urg'u (muhr nuqtasi)
  mute: '#5F6B80', // Ikkilamchi matn
  line: 'rgba(15,36,71,0.14)',
};
// Romb — burchak bezagi
const DIAMOND = 'M12 3 L15.5 12 L12 21 L8.5 12 Z';
// "U" ochiq kitob — header belgisi (brandbook)
const U_MARK = 'M8 6v9a4 4 0 0 0 8 0V10';

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
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/certificates/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.certificate) setCertificate(d.certificate);
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
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d={U_MARK} stroke={CERT.goldBright} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16.5" cy="6.5" r="2.2" fill={CERT.sun} />
              </svg>
              <div>
                <div className="text-3xl tracking-[0.06em] font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  <span style={{ color: CERT.ink }}>Ustoz</span><span style={{ color: CERT.goldBright }}>Edu</span>
                </div>
                <div className="text-[10px] tracking-[0.35em] uppercase mt-1.5" style={{ color: CERT.gold }}>
                  {t('certificate.platformTagline')}
                </div>
              </div>
            </div>

            {/* Oltin ajratgich (markazda romb) */}
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
                {/* Muhr — brend "U" belgisi halqa ichida (ko'k halqa, quyosh nuqta) */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${CERT.goldBright}` }} />
                  <div className="absolute inset-[18px]" style={{ ['--girih-line' as string]: CERT.goldBright, ['--girih-star' as string]: CERT.sun }}>
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
          <a
            href={certificate.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-primary break-all hover:underline"
          >
            {certificate.verificationUrl}
          </a>
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
