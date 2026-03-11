import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:4173/Gemeindeordnung/',
    screenshot: 'on',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'npm run build && npx pagefind --site dist --force-language de && npm run preview -- --port 4173',
    url: 'http://localhost:4173/Gemeindeordnung/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    cwd: resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  },
});
