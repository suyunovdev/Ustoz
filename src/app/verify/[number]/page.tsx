'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Image from '@/components/ui/AppImage';

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
  student: { full_name: string; avatar_url: string };
  course: { title: string; thumbnail_url: string; teacher: { full_name: string } };
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const number = params?.number as string;
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!number) return;
    fetch(`/api/certificates/${number}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.certificate) setCertificate(d.certificate);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <Icon name="XCircleIcon" size={40} className="text-error" />
        </div>
        <h1 className="text-2xl font-bold text-onBackground mb-2">Sertifikat topilmadi</h1>
        <p className="text-onBackground/60 mb-2">
          <strong>{number}</strong> raqamli sertifikat bazamizda mavjud emas.
        </p>
        <p className="text-onBackground/40 text-sm">
          Agar siz haqiqiy sertifikat raqamini kiritsangiz va bu xatolik bo'lsa, ustoz@ustoz.uz ga murojaat qiling.
        </p>
      </div>
    );
  }

  if (!certificate) return null;

  const issuedDate = new Date(certificate.issued_at).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Verifikatsiya badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full font-medium text-sm">
            <Icon name="CheckBadgeIcon" size={18} />
            Sertifikat tasdiqlandi
          </div>
        </div>

        {/* Sertifikat kartasi */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white text-center">
            <h1 className="text-3xl font-bold tracking-wide mb-1">USTOZ</h1>
            <p className="text-white/80 text-sm">Online Ta'lim Platformasi</p>
          </div>

          {/* Mazmun */}
          <div className="p-8 text-center space-y-4">
            <p className="text-onBackground/60 text-sm uppercase tracking-widest">Bu sertifikat taqdim etiladi</p>

            <h2 className="text-2xl font-bold text-onBackground">
              {certificate.metadata?.student_name || certificate.student?.full_name || 'O\'quvchi'}
            </h2>

            <p className="text-onBackground/60">
              muvaffaqiyatli yakunlaganligi uchun
            </p>

            <div className="bg-primary/5 rounded-xl p-4">
              <h3 className="text-xl font-semibold text-primary">
                {certificate.metadata?.course_title || certificate.course?.title}
              </h3>
              <p className="text-onBackground/50 text-sm mt-1">
                O'qituvchi: {certificate.metadata?.teacher_name || certificate.course?.teacher?.full_name}
              </p>
            </div>

            <p className="text-onBackground/50 text-sm">Berilgan sana: {issuedDate}</p>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-8 py-4 flex items-center justify-between bg-surface/50">
            <div>
              <p className="text-xs text-onBackground/40 mb-0.5">Sertifikat raqami</p>
              <p className="font-mono text-sm font-semibold text-primary">{certificate.certificate_number}</p>
            </div>
            <div className="flex items-center gap-1 text-success text-xs font-medium">
              <Icon name="ShieldCheckIcon" size={14} />
              Haqiqiy sertifikat
            </div>
          </div>
        </div>

        <p className="text-center text-onBackground/40 text-xs mt-4">
          Verifikatsiya sahifasi: {certificate.verification_url}
        </p>
      </div>
    </div>
  );
}
