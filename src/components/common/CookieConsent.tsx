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
      const timer = setTimeout(() => setVisible(true), 1200);
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

  // Batafsil panelidagi bitta kategoriya qatori (toggle bilan yoki qulflangan).
  const category = (
    icon: string,
    label: string,
    desc: string,
    opts: { locked?: boolean; on?: boolean; toggle?: () => void },
  ) => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-muted/40">
      <Icon name={icon} size={18} className="text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-heading font-semibold text-foreground">{label}</span>
          {opts.locked ? (
            <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium shrink-0">
              {t('landing.cookieRequired')}
            </span>
          ) : (
            <button
              onClick={opts.toggle}
              className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${opts.on ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              role="switch"
              aria-checked={!!opts.on}
              aria-label={label}
            >
              <span className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow-sm ${opts.on ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-label={t('landing.trustDataProtection')}
      className={`fixed bottom-0 inset-x-0 z-[999] transition-all duration-500 ${closing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      {/* Ingichka pastki panel — backdrop YO'Q (sayt bloklanmaydi). Ustida yupqa brend chiziq. */}
      <div className="border-t-2 border-primary bg-card/95 backdrop-blur-sm shadow-warm-lg">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Batafsil (kengaytiriladigan) */}
          {showDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-3 mb-3 border-b border-border">
              {category('LockClosedIcon', t('landing.cookieEssential'), t('landing.cookieEssentialDesc'), { locked: true })}
              {category('ChartBarIcon', t('landing.cookieAnalytics'), t('landing.cookieAnalyticsDesc'), {
                on: analyticsEnabled,
                toggle: () => setAnalyticsEnabled((v) => !v),
              })}
              {category('MegaphoneIcon', t('landing.cookieMarketing'), t('landing.cookieMarketingDesc'), {
                on: marketingEnabled,
                toggle: () => setMarketingEnabled((v) => !v),
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Chap: ikon + matn + Batafsil */}
            <div className="flex items-start gap-2.5 min-w-0">
              <Icon name="ShieldCheckIcon" size={20} className="text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground leading-snug line-clamp-2 sm:line-clamp-1">
                  {t('landing.cookieText')}
                </p>
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  aria-expanded={showDetails}
                >
                  <Icon name={showDetails ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={12} />
                  {showDetails ? t('common.close') : t('landing.cookieDetails')}
                </button>
              </div>
            </div>

            {/* O'ng: tugmalar */}
            <div className="flex items-center gap-2 sm:ml-auto shrink-0">
              <button
                onClick={() => handleClose('accept')}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-heading font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-secondary transition-colors"
              >
                {t('landing.cookieAccept')}
              </button>
              <button
                onClick={() => handleClose(showDetails ? 'custom' : 'essential')}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/70 transition-colors whitespace-nowrap"
              >
                {showDetails ? t('landing.cookieSavePreferences') : t('landing.cookieEssentialOnly')}
              </button>
              <button
                onClick={() => handleClose('decline')}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {t('landing.cookieDecline')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
