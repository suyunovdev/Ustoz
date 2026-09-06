import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Qamrov doirasi kengaytirildi: barcha biznes-logika (services, repositories,
      // lib yordamchilari, API route'lar). Ilgari faqat services + bitta komponent edi —
      // coverage foizi aldamchi ko'rinardi.
      include: [
        'src/lib/**/*.ts',
        'src/app/api/**/*.ts',
        'src/app/student-dashboard/components/**/*.tsx',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        'src/generated/**',
      ],
    },
  },
});
