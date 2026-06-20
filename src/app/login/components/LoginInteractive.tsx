'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from './LoginForm';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

const LoginBanner = () => {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const isRegistered = searchParams.get('registered') === 'true';
  const isVerified = searchParams.get('verified') === 'true';
  const registeredEmail = searchParams.get('email') || '';

  if (!isRegistered && !isVerified) return null;

  return (
    <div className="max-w-md mx-auto flex items-start gap-3 p-4 bg-success/10 border border-success/30 rounded-md">
      <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-success">
          {isVerified
            ? t('auth.emailVerifiedSuccess') : t('auth.registrationSuccess')}
        </p>
        {registeredEmail && (
          <p className="text-xs text-success/80 mt-1">
            {registeredEmail} — {t('auth.nowLogin')}
          </p>
        )}
        {isRegistered && !isVerified && (
          <p className="text-xs text-success/80 mt-1">
            {t('auth.verifyThenLogin')}
          </p>
        )}
      </div>
    </div>
  );
};

const LoginInteractive = () => {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <LoginBanner />
      </Suspense>

      <LoginForm />
    </div>
  );
};

export default LoginInteractive;
