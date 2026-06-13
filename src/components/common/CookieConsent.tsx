'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

const COOKIE_KEY = 'ustoz_cookie_consent';

export default function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = (value: string) => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem(COOKIE_KEY, value);
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[998] transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={() => handleClose('declined')}
      />

      {/* Banner */}
      <div className={`fixed bottom-0 left-0 right-0 z-[999] p-4 md:p-6 transition-all duration-500 ${closing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card border border-border rounded-2xl shadow-warm-2xl overflow-hidden">

            {/* Top gradient line */}
            <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-warm">
                    <span className="text-2xl">🍪</span>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">Cookie</h3>
                    <p className="text-xs text-muted-foreground">{t('landing.trustDataProtection')}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleClose('declined')}
                  className="p-2 hover:bg-muted rounded-lg transition-smooth text-muted-foreground hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <Icon name="XMarkIcon" size={18} />
                </button>
              </div>

              {/* Text */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {t('landing.cookieText')}
              </p>

              {/* Cookie types (expandable) */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs text-primary font-medium mb-5 hover:underline"
              >
                <Icon name={showDetails ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
                {showDetails ? t('common.close') : t('landing.cookieDetails')}
              </button>

              {showDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { icon: '🔒', name: t('landing.cookieEssential'), desc: t('landing.cookieEssentialDesc'), required: true },
                    { icon: '📊', name: t('landing.cookieAnalytics'), desc: t('landing.cookieAnalyticsDesc'), required: false },
                    { icon: '🎯', name: t('landing.cookieMarketing'), desc: t('landing.cookieMarketingDesc'), required: false },
                  ].map((cookie, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cookie.icon}</span>
                          <span className="text-xs font-medium text-foreground">{cookie.name}</span>
                        </div>
                        {cookie.required ? (
                          <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{t('landing.cookieRequired')}</span>
                        ) : (
                          <div className="w-8 h-4 bg-muted rounded-full relative cursor-pointer">
                            <div className="w-3 h-3 bg-muted-foreground/40 rounded-full absolute top-0.5 left-0.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{cookie.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => handleClose('accepted')}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200 shadow-warm flex items-center justify-center gap-2"
                >
                  <Icon name="CheckIcon" size={16} />
                  {t('landing.cookieAccept')}
                </button>
                <button
                  onClick={() => handleClose('essential_only')}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-smooth flex items-center justify-center gap-2"
                >
                  <Icon name="ShieldCheckIcon" size={16} />
                  {t('landing.cookieEssentialOnly')}
                </button>
                <button
                  onClick={() => handleClose('declined')}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-smooth"
                >
                  {t('landing.cookieDecline')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
