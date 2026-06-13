/**
 * Cookie Consent Management
 *
 * 3 ta cookie turi:
 *   - essential: har doim yoqiq (sessiya, auth, xavfsizlik)
 *   - analytics: sayt qanday ishlatilishini kuzatish
 *   - marketing: foydalanuvchiga mos kurslar tavsiya qilish
 *
 * Consent holatlari:
 *   - null: hali tanlanmagan (banner ko'rsatiladi)
 *   - accepted: hammasi yoqiq
 *   - essential_only: faqat zaruriy
 *   - declined: faqat zaruriy (rad etish = essential_only)
 *   - custom: foydalanuvchi o'zi tanlagan
 */

const STORAGE_KEY = 'ustoz_cookie_consent';
const PREFERENCES_KEY = 'ustoz_cookie_preferences';

export interface CookiePreferences {
  essential: boolean; // har doim true
  analytics: boolean;
  marketing: boolean;
}

export type ConsentStatus = 'accepted' | 'essential_only' | 'declined' | 'custom' | null;

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

const ALL_ACCEPTED: CookiePreferences = {
  essential: true,
  analytics: true,
  marketing: true,
};

export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem(STORAGE_KEY) as ConsentStatus) || null;
}

export function getPreferences(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  const stored = localStorage.getItem(PREFERENCES_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { essential: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  const status = getConsentStatus();
  if (status === 'accepted') return ALL_ACCEPTED;
  return DEFAULT_PREFERENCES;
}

export function saveConsent(status: ConsentStatus, preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, status || '');
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ ...preferences, essential: true }));

  // Cookie'larni haqiqiy document.cookie ga ham yozish
  const maxAge = 365 * 24 * 60 * 60; // 1 yil
  document.cookie = `ustoz_consent=${status}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `ustoz_analytics=${preferences.analytics ? '1' : '0'}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `ustoz_marketing=${preferences.marketing ? '1' : '0'}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Agar analytics rad etilgan bo'lsa, mavjud tracking cookie'larni o'chirish
  if (!preferences.analytics) {
    clearTrackingCookies();
  }
}

export function isAnalyticsAllowed(): boolean {
  return getPreferences().analytics;
}

export function isMarketingAllowed(): boolean {
  return getPreferences().marketing;
}

export function hasConsented(): boolean {
  return getConsentStatus() !== null;
}

export function resetConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PREFERENCES_KEY);
  document.cookie = 'ustoz_consent=; path=/; max-age=0';
  document.cookie = 'ustoz_analytics=; path=/; max-age=0';
  document.cookie = 'ustoz_marketing=; path=/; max-age=0';
  clearTrackingCookies();
}

function clearTrackingCookies(): void {
  // Keng tarqalgan analytics cookie'larni o'chirish
  const trackingCookies = ['_ga', '_gid', '_gat', '_fbp', '_fbc', 'ym_uid', 'ym_d'];
  for (const name of trackingCookies) {
    document.cookie = `${name}=; path=/; max-age=0; domain=.${window.location.hostname}`;
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}
