'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

const COOKIE_KEY = 'ustoz_cookie_consent';

export default function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] p-4 animate-in slide-in-from-bottom">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-warm-2xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="ShieldCheckIcon" size={22} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('landing.cookieText')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-smooth"
          >
            {t('landing.cookieDecline')}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-smooth shadow-warm"
          >
            {t('landing.cookieAccept')}
          </button>
        </div>
      </div>
    </div>
  );
}
