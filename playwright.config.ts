import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4028',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev:webpack',
        port: 4028,
        reuseExistingServer: true,
        timeout: 60000,
      },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
