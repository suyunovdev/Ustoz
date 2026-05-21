'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from './LoginForm';
import Icon from '@/components/ui/AppIcon';

const LoginBanner = () => {
  const searchParams = useSearchParams();
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
            ? "Email muvaffaqiyatli tasdiqlandi!" :"Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!"}
        </p>
        {registeredEmail && (
          <p className="text-xs text-success/80 mt-1">
            {registeredEmail} — endi tizimga kiring
          </p>
        )}
        {isRegistered && !isVerified && (
          <p className="text-xs text-success/80 mt-1">
            Emailingizni tasdiqlang, so'ng quyida tizimga kiring.
          </p>
        )}
      </div>
    </div>
  );
};

const LoginInteractive = () => {
  const [currentLanguage, setCurrentLanguage] = useState('uz');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <LoginBanner />
      </Suspense>

      <LoginForm
        onLanguageChange={handleLanguageChange}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};

export default LoginInteractive;