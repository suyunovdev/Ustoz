'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Transaction {
  id: string;
  course_id: string;
  payment_method: string;
  amount_uzs: number;
  status: string;
  merchant_trans_id: string;
  created_at: string;
  completed_at: string;
}

interface Course {
  id: string;
  title: string;
  instructor_name?: string;
  cover_image?: string;
}

interface Enrollment {
  enrolled_at: string;
  is_active: boolean;
}

const PaymentSuccessInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!transactionId) {
      router.push('/student-dashboard');
      return;
    }

    loadSuccessData();
  }, [user, transactionId]);

  const loadSuccessData = async () => {
    try {
      setLoading(true);

      // Fetch real transaction data from /api/payment/status/[id]
      const txRes = await fetch(`/api/payment/status/${transactionId}`, {
        credentials: 'include',
      });

      let courseIdParam = searchParams.get('course_id');

      if (txRes.ok) {
        const txData = await txRes.json();
        const tx = txData.transaction;
        setTransaction({
          id: tx.id,
          course_id: tx.course_id,
          payment_method: tx.payment_method,
          amount_uzs: parseInt(tx.amount_uzs, 10),
          status: tx.status,
          merchant_trans_id: tx.id,
          created_at: tx.created_at,
          completed_at: tx.completed_at || tx.created_at,
        });
        courseIdParam = tx.course_id;
      } else {
        // Fallback to URL params if endpoint fails
        const amountParam = searchParams.get('amount');
        const paymentMethodParam = searchParams.get('payment_method');

        if (!courseIdParam) {
          router.push('/student-dashboard');
          return;
        }

        setTransaction({
          id: transactionId || '',
          course_id: courseIdParam,
          payment_method: paymentMethodParam || 'click',
          amount_uzs: amountParam ? parseInt(amountParam, 10) : 0,
          status: 'completed',
          merchant_trans_id: transactionId || '',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      }

      if (!courseIdParam) {
        router.push('/student-dashboard');
        return;
      }

      // Load course details via JWT API
      const courseRes = await fetch(`/api/courses/${courseIdParam}`, {
        credentials: 'include'
      });
      if (courseRes.ok) {
        const { course: c } = await courseRes.json();
        if (c) {
          setCourse({
            id: c.id,
            title: c.title,
            cover_image: c.coverImage,
            // Keep user_profiles shape for the receipt generator.
            ...({
              user_profiles: { full_name: c.teacher?.fullName || 'Ustoz' }
            } as any)
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading success data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = () => {
    if (course) {
      router.push(`/learning-interface?courseId=${course.id}`);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!transaction || !course) return;

    setDownloadingReceipt(true);

    try {
      // Generate PDF receipt content
      const receiptContent = generateReceiptHTML(transaction, course);
      
      // Create blob and download
      const blob = new Blob([receiptContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${transaction.merchant_trans_id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const generateReceiptHTML = (transaction: Transaction, course: Course): string => {
    const formattedDate = new Date(transaction.completed_at).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const formattedAmount = (transaction.amount_uzs / 100).toLocaleString('uz-UZ');

    return `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>To'lov cheki - ${transaction.merchant_trans_id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #d97706; }
    .receipt-info { margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; }
    .total { font-size: 24px; font-weight: bold; color: #d97706; margin-top: 20px; text-align: right; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Ustoz</div>
    <p>To'lov cheki</p>
  </div>
  
  <div class="receipt-info">
    <div class="info-row">
      <span class="label">Buyurtma raqami:</span>
      <span>${transaction.merchant_trans_id}</span>
    </div>
    <div class="info-row">
      <span class="label">Tranzaksiya ID:</span>
      <span>${transaction.id}</span>
    </div>
    <div class="info-row">
      <span class="label">Sana:</span>
      <span>${formattedDate}</span>
    </div>
    <div class="info-row">
      <span class="label">To'lov usuli:</span>
      <span>${transaction.payment_method === 'click' ? 'Click' : 'Payme'}</span>
    </div>
    <div class="info-row">
      <span class="label">Kurs:</span>
      <span>${course.title}</span>
    </div>
    <div class="info-row">
      <span class="label">O'qituvchi:</span>
      <span>${(course as any).user_profiles?.full_name || 'Ustoz'}</span>
    </div>
    <div class="info-row">
      <span class="label">Holat:</span>
      <span style="color: green;">Muvaffaqiyatli</span>
    </div>
  </div>
  
  <div class="total">
    Jami: ${formattedAmount} so'm
  </div>
  
  <div class="footer">
    <p>Ustoz ta'lim platformasi</p>
    <p>Ushbu chek to'lovning rasmiy tasdiqidir</p>
  </div>
</body>
</html>
    `;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('uz-UZ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!transaction || !course) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Icon name="ExclamationTriangleIcon" size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Ma'lumot topilmadi</h2>
          <p className="text-muted-foreground mb-6">To'lov ma'lumotlari topilmadi yoki to'lov yakunlanmagan.</p>
          <button
            onClick={() => router.push('/student-dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth font-medium"
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header with Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-4 animate-scale-in">
            <Icon name="CheckCircleIcon" size={48} className="text-success" variant="solid" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
            To'lov muvaffaqiyatli!
          </h1>
          <p className="text-lg text-muted-foreground">
            Kursga kirish huquqi faollashtirildi
          </p>
        </div>

        {/* Transaction Receipt Card */}
        <div className="bg-card rounded-lg shadow-warm-lg p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h2 className="text-xl font-heading font-bold text-foreground">To'lov cheki</h2>
            <button
              onClick={handleDownloadReceipt}
              disabled={downloadingReceipt}
              className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-smooth font-medium disabled:opacity-50"
            >
              {downloadingReceipt ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground border-t-transparent"></div>
              ) : (
                <Icon name="ArrowDownTrayIcon" size={18} />
              )}
              <span>Yuklab olish</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Buyurtma raqami:</span>
              <span className="font-data font-semibold text-foreground">{transaction.merchant_trans_id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Tranzaksiya ID:</span>
              <span className="font-data text-sm text-foreground">{transaction.id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">To'lov sanasi:</span>
              <span className="font-medium text-foreground">{formatDate(transaction.completed_at)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">To'lov usuli:</span>
              <span className="font-medium text-foreground">
                {transaction.payment_method === 'click' ? 'Click' : 'Payme'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-border pt-4">
              <span className="text-lg font-semibold text-foreground">Jami summa:</span>
              <span className="text-2xl font-bold text-primary">{formatAmount(transaction.amount_uzs)} so'm</span>
            </div>
          </div>
        </div>

        {/* Course Access Card */}
        <div className="bg-card rounded-lg shadow-warm-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">Kursga kirish</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {course.cover_image && (
              <div className="w-full md:w-40 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                <AppImage
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">O'qituvchi: {(course as any).user_profiles?.full_name || 'Ustoz'}</p>
              {enrollment && (
                <p className="text-xs text-success mb-3">
                  ✓ Ro'yxatdan o'tgan: {formatDate(enrollment.enrolled_at)}
                </p>
              )}
              <button
                onClick={handleStartLearning}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth font-medium shadow-warm-md"
              >
                <Icon name="PlayIcon" size={20} variant="solid" />
                <span>O'qishni boshlash</span>
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Information Card */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20 p-6 md:p-8 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-md flex-shrink-0">
              <Icon name="AcademicCapIcon" size={24} className="text-primary-foreground" variant="solid" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">Sertifikat haqida</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Kursni muvaffaqiyatli yakunlaganingizdan so'ng rasmiy sertifikat olasiz.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <Icon name="CheckIcon" size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Barcha darslarni ko'rish (100% progress)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Icon name="CheckIcon" size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Testlardan o'tish (minimal 70% ball)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Icon name="CheckIcon" size={16} className="text-success mt-0.5 flex-shrink-0" />
                  <span>Yakuniy imtihonni topshirish</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Taxminiy muddat: Kurs davomiyligiga bog'liq
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/student-dashboard')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-card text-foreground rounded-md hover:bg-muted transition-smooth border border-border"
          >
            <Icon name="HomeIcon" size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => router.push('/learning-interface')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-card text-foreground rounded-md hover:bg-muted transition-smooth border border-border"
          >
            <Icon name="AcademicCapIcon" size={20} />
            <span className="font-medium">Mening kurslarim</span>
          </button>
          <button
            onClick={() => router.push('/course-marketplace')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-card text-foreground rounded-md hover:bg-muted transition-smooth border border-border"
          >
            <Icon name="ShoppingBagIcon" size={20} />
            <span className="font-medium">Bozorga qaytish</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessInteractive;