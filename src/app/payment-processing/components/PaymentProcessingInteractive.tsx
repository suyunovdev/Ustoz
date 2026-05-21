'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/ui/AppIcon';

interface Transaction {
  id: string;
  course_id: string;
  payment_method: string;
  amount_uzs: number;
  status: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface Course {
  id: string;
  title: string;
}

const PaymentProcessingInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [gatewayRedirectCountdown, setGatewayRedirectCountdown] = useState(3);
  const [hasRedirectedToGateway, setHasRedirectedToGateway] = useState(false);

  const transactionId = searchParams.get('transaction_id');
  const paymentMethod = searchParams.get('payment_method');
  const courseId = searchParams.get('course_id');
  const amount = searchParams.get('amount');
  const paymentUrl = searchParams.get('payment_url');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!transactionId) {
      router.push('/course-marketplace');
      return;
    }

    // Initialize with URL parameters for immediate display
    if (courseId && amount && paymentMethod) {
      setTransaction({
        id: transactionId,
        course_id: courseId,
        payment_method: paymentMethod,
        amount_uzs: parseInt(amount),
        status: 'pending',
        created_at: new Date().toISOString()
      });
      setCourse({
        id: courseId,
        title: 'Loading...'
      });
    }

    loadTransaction();

    // Poll transaction status every 3 seconds
    const interval = setInterval(() => {
      loadTransaction();
    }, 3000);

    return () => clearInterval(interval);
  }, [user, transactionId]);

  // Auto-redirect to payment gateway countdown
  useEffect(() => {
    if (paymentUrl && !hasRedirectedToGateway && gatewayRedirectCountdown > 0) {
      const timer = setTimeout(() => {
        setGatewayRedirectCountdown(gatewayRedirectCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (paymentUrl && !hasRedirectedToGateway && gatewayRedirectCountdown === 0) {
      setHasRedirectedToGateway(true);
      window.location.href = decodeURIComponent(paymentUrl);
    }
  }, [paymentUrl, hasRedirectedToGateway, gatewayRedirectCountdown]);

  // Success redirect countdown
  useEffect(() => {
    if (transaction?.status === 'completed' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (transaction?.status === 'completed' && redirectCountdown === 0) {
      router.push(`/payment-success-confirmation?transaction_id=${transaction.id}`);
    }
  }, [transaction, redirectCountdown]);

  const loadTransaction = async () => {
    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError) throw transactionError;
      setTransaction(transactionData);

      // Load course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', transactionData.course_id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

    } catch (err: any) {
      console.error('Error loading transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (paymentUrl && !hasRedirectedToGateway) {
      return (
        <div className="animate-pulse rounded-full h-16 w-16 bg-primary/20 flex items-center justify-center">
          <Icon name="ArrowRightIcon" size={32} className="text-primary" />
        </div>
      );
    }

    switch (transaction?.status) {
      case 'completed':
        return <Icon name="CheckCircleIcon" size={64} variant="solid" className="text-success" />;
      case 'failed': case'cancelled':
        return <Icon name="XCircleIcon" size={64} variant="solid" className="text-destructive" />;
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        );
      default:
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        );
    }
  };

  const getStatusTitle = () => {
    if (paymentUrl && !hasRedirectedToGateway) {
      return 'To\'lov tizimiga yo\'naltirilmoqda...';
    }

    switch (transaction?.status) {
      case 'completed':
        return 'To\'lov muvaffaqiyatli!';
      case 'failed':
        return 'To\'lov muvaffaqiyatsiz';
      case 'cancelled':
        return 'To\'lov bekor qilindi';
      case 'processing':
        return 'To\'lov jarayonda...';
      default:
        return 'To\'lov kutilmoqda...';
    }
  };

  const getStatusMessage = () => {
    if (paymentUrl && !hasRedirectedToGateway) {
      return `${gatewayRedirectCountdown} soniyadan keyin to'lov tizimiga yo'naltirilasiz. Iltimos, sahifani yopmang.`;
    }

    switch (transaction?.status) {
      case 'completed':
        return 'Tabriklaymiz! Kursga muvaffaqiyatli yozildingiz. Endi darslarni boshlashingiz mumkin.';
      case 'failed':
        return transaction?.error_message || 'To\'lov amalga oshmadi. Iltimos, qaytadan urinib ko\'ring.';
      case 'cancelled':
        return 'To\'lov bekor qilindi. Iltimos, qaytadan urinib ko\'ring.';
      case 'processing':
        return 'To\'lovingiz tekshirilmoqda. Iltimos, kuting...';
      default:
        return 'To\'lov ma\'lumotlari yuklanmoqda...';
    }
  };

  if (loading && !transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow-warm-lg p-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Status Title */}
          <h1 className="text-3xl font-heading font-bold text-center text-foreground mb-4">
            {getStatusTitle()}
          </h1>

          {/* Status Message */}
          <p className="text-center text-muted-foreground mb-8">
            {getStatusMessage()}
          </p>

          {/* Transaction Details */}
          {transaction && course && (
            <div className="bg-muted/50 rounded-lg p-6 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kurs:</span>
                <span className="text-sm font-medium text-foreground">{course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Summa:</span>
                <span className="text-sm font-medium text-foreground">
                  {transaction.amount_uzs.toLocaleString()} so'm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">To'lov tizimi:</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {transaction.payment_method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tranzaksiya ID:</span>
                <span className="text-sm font-mono text-foreground">
                  {transaction.id.slice(0, 8)}...
                </span>
              </div>
              {transaction.completed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Yakunlangan vaqt:</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(transaction.completed_at).toLocaleString('uz-UZ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Gateway Redirect Progress */}
          {paymentUrl && !hasRedirectedToGateway && (
            <div className="mb-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success flex items-center justify-center">
                    <Icon name="CheckIcon" size={16} className="text-white" />
                  </div>
                  <span className="text-sm text-foreground">Tranzaksiya yaratildi</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                  <span className="text-sm text-foreground">To'lov tizimiga yo'naltirilmoqda...</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon name="CreditCardIcon" size={16} className="text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">To'lovni amalga oshirish</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          {transaction?.status === 'processing' && !paymentUrl && (
            <div className="mb-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success flex items-center justify-center">
                    <Icon name="CheckIcon" size={16} className="text-white" />
                  </div>
                  <span className="text-sm text-foreground">To'lov boshlandi</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                  <span className="text-sm text-foreground">To'lov tekshirilmoqda</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon name="CheckIcon" size={16} className="text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Kursga yozilish</span>
                </div>
              </div>
            </div>
          )}

          {/* Auto Redirect Message */}
          {transaction?.status === 'completed' && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Icon name="InformationCircleIcon" size={20} className="text-success" />
                <p className="text-sm text-success">
                  {redirectCountdown} soniyadan keyin kursga o'tkazilasiz...
                </p>
              </div>
            </div>
          )}

          {/* Manual Gateway Redirect Button */}
          {paymentUrl && !hasRedirectedToGateway && (
            <div className="mb-6">
              <button
                onClick={() => {
                  setHasRedirectedToGateway(true);
                  window.location.href = decodeURIComponent(paymentUrl);
                }}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-smooth"
              >
                To'lov tizimiga o'tish
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {transaction?.status === 'completed' && (
              <button
                onClick={() => router.push(`/learning-interface?courseId=${transaction.course_id}`)}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-smooth"
              >
                Kursni boshlash
              </button>
            )}

            {(transaction?.status === 'failed' || transaction?.status === 'cancelled') && (
              <>
                <button
                  onClick={() => router.push(`/payment-method-selection?courseId=${transaction.course_id}`)}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-smooth"
                >
                  Qaytadan urinish
                </button>
                <button
                  onClick={() => router.push('/course-marketplace')}
                  className="w-full px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-smooth"
                >
                  Bosh sahifaga qaytish
                </button>
              </>
            )}

            {transaction?.status === 'processing' && !paymentUrl && (
              <button
                onClick={() => router.push('/student-dashboard')}
                className="w-full px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-smooth"
              >
                Dashboard ga qaytish
              </button>
            )}
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Muammo yuzaga keldimi?{' '}
              <a href="#" className="text-primary hover:underline">
                Yordam markaziga murojaat qiling
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingInteractive;