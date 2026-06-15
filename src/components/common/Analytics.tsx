'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

export default function Analytics() {
  const { isAnalyticsAllowed } = useCookieConsent();

  useEffect(() => {
    if (!isAnalyticsAllowed) return;

    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!gaId) return;

    // Load Google Analytics only when consent is given
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    const inlineScript = document.createElement('script');
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', { anonymize_ip: true });
    `;
    document.head.appendChild(inlineScript);

    return () => {
      script.remove();
      inlineScript.remove();
    };
  }, [isAnalyticsAllowed]);

  return null;
}
