/**
 * renderWithI18n — i18n'ga bog'liq komponentlarni test qilish uchun yordamchi.
 *
 * `useI18n()` ishlatadigan har qanday komponent `I18nProvider` ichida
 * render qilinishi shart, aks holda hook xato tashlaydi. Bu helper shu
 * wrapper'ni avtomatik qo'shadi. Default til — `DEFAULT_LOCALE` (uz),
 * shuning uchun testlar o'zbekcha matnlarga tayanishi mumkin.
 */

import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { I18nProvider } from '@/contexts/I18nContext';

export function renderWithI18n(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: I18nProvider, ...options });
}

// Qulaylik uchun testing-library'ning qolgan API'sini re-export qilamiz.
export * from '@testing-library/react';
