'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  verification_url: string;
  metadata: {
    course_title: string;
    teacher_name: string;
    student_name: string;
    completed_at: string;
  };
  student: { full_name: string };
  course: { title: string; teacher: { full_name: string } };
}

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/certificates/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.certificate) setCertificate(d.certificate);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyLink = () => {
  const { t } = useI18n();
    if (certificate?.verification_url) {
      navigator.clipboard.writeText(certificate.verification_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkedInShare = () => {
    if (!certificate) return;
    const url = encodeURIComponent(certificate.verification_url);
    const title = encodeURIComponent(`Ustoz platformasida "${certificate.metadata?.course_title}" kursini yakunladim!`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank');
  };

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
        <Icon name="DocumentIcon" size={48} className="text-onBackground/20 mb-4" />
        <h2 className="text-xl font-semibold text-onBackground mb-2">Sertifikat topilmadi</h2>
        <button
          onClick={() => router.push('/student-dashboard')}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Dashboard'ga qaytish
        </button>
      </div>
    );
  }

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-onBackground/60 hover:text-onBackground transition-colors"
        >
          <Icon name="ArrowLeftIcon" size={16} />
          <span className="text-sm">{t('common.back')}</span>
        </button>
        <h1 className="font-semibold text-onBackground">Mening sertifikatim</h1>
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
              <p className="text-gray-400 text-xs uppercase tracking-widest">Online Ta'lim Platformasi</p>
            </div>

            <div className="w-20 h-0.5 bg-primary/20 mx-auto" />

            <div>
              <p className="text-gray-500 text-sm mb-2">Ushbu sertifikat taqdim etiladi</p>
              <h2 className="text-3xl font-bold text-gray-800">
                {certificate.metadata?.student_name || certificate.student?.full_name}
              </h2>
            </div>

            <div>
              <p className="text-gray-500 text-sm">muvaffaqiyatli yakunlaganligi uchun</p>
              <h3 className="text-2xl font-semibold text-primary mt-2">
                {certificate.metadata?.course_title || certificate.course?.title}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                O'qituvchi: {certificate.metadata?.teacher_name || certificate.course?.teacher?.full_name}
              </p>
            </div>

            <div className="w-20 h-0.5 bg-primary/20 mx-auto" />

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Sana</p>
                <p className="font-medium">{issuedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Sertifikat №</p>
                <p className="font-mono font-semibold text-primary">{certificate.certificate_number}</p>
              </div>
            </div>
          </div>

          {/* Bottom gradient */}
          <div className="h-3 bg-gradient-to-r from-primary via-secondary to-primary" />
        </div>

        {/* Harakatlar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 border border-border bg-surface text-onBackground px-4 py-3 rounded-xl font-medium hover:bg-accent transition-colors text-sm"
          >
            <Icon name={copied ? 'CheckIcon' : 'LinkIcon'} size={16} />
            {copied ? 'Nusxalandi!' : 'Havolani nusxalash'}
          </button>

          <button
            onClick={handleLinkedInShare}
            className="flex items-center justify-center gap-2 bg-[#0077B5] text-white px-4 py-3 rounded-xl font-medium hover:bg-[#006396] transition-colors text-sm"
          >
            <Icon name="ShareIcon" size={16} />
            LinkedIn'da ulashish
          </button>

          <a
            href={`/verify/${certificate.certificate_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
          >
            <Icon name="ShieldCheckIcon" size={16} />
            Verifikatsiya
          </a>
        </div>

        {/* Verifikatsiya URL */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-onBackground/50 mb-1">Verifikatsiya havolasi</p>
          <p className="text-sm font-mono text-primary break-all">{certificate.verification_url}</p>
        </div>
      </div>
    </div>
  );
}
