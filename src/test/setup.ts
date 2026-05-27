/**
 * Vitest setup — har test fayli yuklanishidan oldin ishlaydi.
 *
 * - jest-dom matchers (toBeInTheDocument, toHaveTextContent, ...)
 * - service log() spam'ini chiqarib tashlash
 * - har testdan keyin DOM tozalash
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// console.log spam → silent (service'lar console.log ishlatadi)
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
