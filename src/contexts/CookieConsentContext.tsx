'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type CookiePreferences,
  type ConsentStatus,
  getConsentStatus,
  getPreferences,
  saveConsent,
  resetConsent as resetConsentLib,
} from '@/lib/cookies';

interface CookieConsentContextValue {
  status: ConsentStatus;
  preferences: CookiePreferences;
  hasConsented: boolean;
  acceptAll: () => void;
  essentialOnly: () => void;
  decline: () => void;
  saveCustom: (prefs: Omit<CookiePreferences, 'essential'>) => void;
  resetConsent: () => void;
  isAnalyticsAllowed: boolean;
  isMarketingAllowed: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setStatus(getConsentStatus());
    setPreferences(getPreferences());
  }, []);

  const update = useCallback((newStatus: ConsentStatus, newPrefs: CookiePreferences) => {
    setStatus(newStatus);
    setPreferences(newPrefs);
    saveConsent(newStatus, newPrefs);
  }, []);

  const acceptAll = useCallback(() => {
    update('accepted', { essential: true, analytics: true, marketing: true });
  }, [update]);

  const essentialOnly = useCallback(() => {
    update('essential_only', { essential: true, analytics: false, marketing: false });
  }, [update]);

  const decline = useCallback(() => {
    update('declined', { essential: true, analytics: false, marketing: false });
  }, [update]);

  const saveCustom = useCallback((prefs: Omit<CookiePreferences, 'essential'>) => {
    update('custom', { essential: true, ...prefs });
  }, [update]);

  const resetConsentHandler = useCallback(() => {
    resetConsentLib();
    setStatus(null);
    setPreferences({ essential: true, analytics: false, marketing: false });
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        status,
        preferences,
        hasConsented: status !== null,
        acceptAll,
        essentialOnly,
        decline,
        saveCustom,
        resetConsent: resetConsentHandler,
        isAnalyticsAllowed: preferences.analytics,
        isMarketingAllowed: preferences.marketing,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}
