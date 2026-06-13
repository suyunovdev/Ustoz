'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

export default function CookieConsent() {
  const { t } = useI18n();
  const { hasConsented, acceptAll, essentialOnly, decline, saveCustom } = useCookieConsent();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    if (!hasConsented) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasConsented]);

  const handleClose = (action: 'accept' | 'essential' | 'decline' | 'custom') => {
    setClosing(true);
    setTimeout(() => {
      switch (action) {
        case 'accept':
          acceptAll();
          break;
        case 'essential':
          essentialOnly();
          break;
        case 'decline':
          decline();
          break;
        case 'custom':
          saveCustom({ analytics: analyticsEnabled, marketing: marketingEnabled });
          break;
      }
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[998] transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={() => handleClose('decline')}
      />

      <div className={`fixed bottom-0 left-0 right-0 z-[999] p-4 md:p-6 transition-all duration-500 ${closing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card border border-border rounded-2xl shadow-warm-2xl overflow-hidden">
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
                  onClick={() => handleClose('decline')}
                  className="p-2 hover:bg-muted rounded-lg transition-smooth text-muted-foreground hover:text-foreground"
                  aria-label={t('common.close')}
                >
                  <Icon name="XMarkIcon" size={18} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {t('landing.cookieText')}
              </p>

              {/* Details toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs text-primary font-medium mb-5 hover:underline"
                aria-expanded={showDetails}
              >
                <Icon name={showDetails ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={14} />
                {showDetails ? t('common.close') : t('landing.cookieDetails')}
              </button>

              {showDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {/* Essential — always on */}
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔒</span>
                        <span className="text-xs font-medium text-foreground">{t('landing.cookieEssential')}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        {t('landing.cookieRequired')}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t('landing.cookieEssentialDesc')}</p>
                  </div>

                  {/* Analytics — toggleable */}
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <span className="text-xs font-medium text-foreground">{t('landing.cookieAnalytics')}</span>
                      </div>
                      <button
                        onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${analyticsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        role="switch"
                        aria-checked={analyticsEnabled}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow-sm ${analyticsEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t('landing.cookieAnalyticsDesc')}</p>
                  </div>

                  {/* Marketing — toggleable */}
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="text-xs font-medium text-foreground">{t('landing.cookieMarketing')}</span>
                      </div>
                      <button
                        onClick={() => setMarketingEnabled(!marketingEnabled)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${marketingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        role="switch"
                        aria-checked={marketingEnabled}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow-sm ${marketingEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t('landing.cookieMarketingDesc')}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => handleClose('accept')}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl hover:shadow-warm-lg hover:scale-[1.02] transition-all duration-200 shadow-warm flex items-center justify-center gap-2"
                >
                  <Icon name="CheckIcon" size={16} />
                  {t('landing.cookieAccept')}
                </button>
                {showDetails ? (
                  <button
                    onClick={() => handleClose('custom')}
                    className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-smooth flex items-center justify-center gap-2"
                  >
                    <Icon name="AdjustmentsHorizontalIcon" size={16} />
                    {t('landing.cookieSavePreferences')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleClose('essential')}
                    className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-smooth flex items-center justify-center gap-2"
                  >
                    <Icon name="ShieldCheckIcon" size={16} />
                    {t('landing.cookieEssentialOnly')}
                  </button>
                )}
                <button
                  onClick={() => handleClose('decline')}
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
