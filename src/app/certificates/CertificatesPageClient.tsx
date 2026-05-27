'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCoverImage: string | null;
  teacherName: string;
  certificateNumber: string;
  issuedAt: string;
  verificationUrl: string | null;
}

const CertificatesPageClient = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const res = await fetch('/api/certificates/my', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login?redirect=/certificates');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setCertificates(data.certificates || []);
    } catch (err) {
      console.error('Sertifikatlarni yuklashda xato:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/${certId}`, '_blank');
  };

  const handleVerify = (cert: Certificate) => {
    if (cert.verificationUrl) {
      window.open(cert.verificationUrl, '_blank');
    } else {
      window.open(`/certificate/${cert.id}`, '_blank');
    }
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md">
              <Icon name="AcademicCapIcon" size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Sertifikatlarim</h1>
              <p className="text-sm text-muted-foreground">
                {certificates.length > 0
                  ? `Jami ${certificates.length} ta sertifikat`
                  : 'Tugatgan kurslaringiz uchun sertifikatlar'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                <div className="w-full h-32 bg-muted rounded-md mb-4"></div>
                <div className="h-5 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : certificates.length === 0 ? (
          /* Empty state */
          <div className="bg-card rounded-lg border border-border p-16 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="AcademicCapIcon" size={40} className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Hali sertifikat yo'q</h2>
            <p className="text-muted-foreground mb-2 max-w-md mx-auto">
              Birinchi kursingizni 100% tugatganingizda avtomatik sertifikat olasiz.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Sertifikatlarni keyin LinkedIn, Telegram va boshqa joylarda ulashishingiz mumkin.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/student-dashboard?tab=my-courses')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Mening kurslarim
              </button>
              <button
                onClick={() => router.push('/course-marketplace')}
                className="px-6 py-3 bg-card border border-border text-foreground rounded-md hover:bg-muted transition-colors font-medium"
              >
                Yangi kurs topish
              </button>
            </div>
          </div>
        ) : (
          /* Certificates grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-card rounded-lg border border-border overflow-hidden shadow-warm hover:shadow-warm-lg transition-shadow group"
              >
                {/* Certificate header / cover */}
                <div className="relative h-40 bg-gradient-to-br from-primary via-primary/80 to-secondary p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <Icon name="AcademicCapIcon" size={32} className="text-primary-foreground" />
                    <span className="text-xs font-mono text-primary-foreground/80 bg-primary-foreground/10 px-2 py-1 rounded">
                      {cert.certificateNumber}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/80 uppercase tracking-wider mb-1">
                      Sertifikat
                    </p>
                    <p className="text-sm text-primary-foreground/90">
                      {new Date(cert.issuedAt).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <h3 className="font-heading font-semibold text-foreground line-clamp-2 min-h-[3rem]">
                    {cert.courseTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center space-x-1">
                    <Icon name="UserIcon" size={14} />
                    <span>{cert.teacherName}</span>
                  </p>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => handleDownload(cert.id)}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Icon name="ArrowDownTrayIcon" size={16} />
                      <span>Yuklab olish</span>
                    </button>
                    <button
                      onClick={() => handleVerify(cert)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/70 transition-colors"
                      title="Tasdiqlash"
                    >
                      <Icon name="ShieldCheckIcon" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default CertificatesPageClient;
