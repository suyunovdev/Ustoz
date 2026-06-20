'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import AppImage from '@/components/ui/AppImage';

interface Course {
  id: string;
  title: string;
  price_uzs: number;
  cover_image: string;
  instructor_name?: string;
  instructor_image?: string;
}

export default function PaymentMethodSelectionInteractive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'click' | 'payme' | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const courseId = searchParams.get('courseId');
  const courseDataParam = searchParams.get('courseData');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!courseId) {
      router.push('/course-marketplace');
      return;
    }

    // Try to parse course data from URL first for immediate display
    if (courseDataParam) {
      try {
        const parsedCourse = JSON.parse(decodeURIComponent(courseDataParam));
        setCourse(parsedCourse);
        setLoading(false);
      } catch (err) {
        console.error('Error parsing course data from URL:', err);
      }
    }

    // Fetch fresh data from database in background
    fetchCourse();
  }, [user, courseId, courseDataParam]);

  const fetchCourse = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || t('payment.courseNotFound'));
      }

      const { course: c } = await response.json();

      if (!c) {
        setError(t('payment.courseNotFound'));
        return;
      }

      setCourse({
        id: c.id,
        title: c.title,
        price_uzs: parseInt(c.priceUzs, 10) || 0,
        cover_image: c.coverImage || '',
        instructor_name: c.teacher?.fullName,
        instructor_image: c.teacher?.avatarUrl
      });
    } catch (err: any) {
      console.error('Error fetching course:', err);
      setError(err.message || t('payment.courseLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod || !course) return;

    try {
      setProcessing(true);
      setError('');

      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: course.id,
          paymentMethod: selectedMethod,
          amount: course.price_uzs,
          currency: 'UZS'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('payment.paymentInitError'));
      }

      // Navigate to payment processing screen with transaction data
      const transactionData = {
        transactionId: data.transactionId,
        courseId: course.id,
        courseTitle: course.title,
        amount: course.price_uzs,
        paymentMethod: selectedMethod,
        paymentUrl: data.paymentUrl
      };

      router.push(
        `/payment-processing?transaction_id=${data.transactionId}&payment_method=${selectedMethod}&course_id=${course.id}&amount=${course.price_uzs}&payment_url=${encodeURIComponent(data.paymentUrl)}`
      );
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setError(err.message || t('payment.paymentInitError'));
      setProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t('payment.error')}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push('/course-marketplace')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {t('payment.backToCourses')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('payment.selectPaymentMethod')}</h1>
          <p className="mt-2 text-muted-foreground">{t('payment.selectPaymentMethodDesc')}</p>
        </div>

        {/* Course Info */}
        {course && (
          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-4">
              <AppImage
                src={course.cover_image || '/assets/images/no_image.png'}
                alt={course.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{course.title}</h2>
                {course.instructor_name && (
                  <p className="text-sm text-muted-foreground mt-1">{t('payment.instructor')}: {course.instructor_name}</p>
                )}
                <p className="text-2xl font-bold text-primary mt-2">
                  {formatAmount(course.price_uzs)}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4 mb-8">
          {/* Click */}
          <button
            onClick={() => setSelectedMethod('click')}
            disabled={processing}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              selectedMethod === 'click' ?'border-primary bg-primary/10' :'border-border hover:border-primary/30 bg-card'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">CLICK</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Click</h3>
                  <p className="text-sm text-muted-foreground">{t('payment.payViaCards')}</p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'click' ? 'border-primary' : 'border-border'
                }`}
              >
                {selectedMethod === 'click' && (
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                )}
              </div>
            </div>
          </button>

          {/* Payme */}
          <button
            onClick={() => setSelectedMethod('payme')}
            disabled={processing}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              selectedMethod === 'payme' ?'border-success bg-success/10' :'border-border hover:border-primary/30 bg-card'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">PAYME</span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">Payme</h3>
                  <p className="text-sm text-muted-foreground">{t('payment.payViaCards')}</p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedMethod === 'payme' ? 'border-success' : 'border-border'
                }`}
              >
                {selectedMethod === 'payme' && (
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            disabled={processing}
            className="flex-1 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('payment.back')}
          </button>
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || processing}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('payment.loading')}
              </>
            ) : (
              t('payment.proceedToPayment')
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-foreground">{t('payment.securePayment')}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('payment.securePaymentDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}