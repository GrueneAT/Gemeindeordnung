import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:4173/gemeindeordnung/src/',
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
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],

  webServer: {
    command: 'npm run build && npx pagefind --site dist --force-language de && npm run preview -- --port 4173',
    url: 'http://localhost:4173/gemeindeordnung/src/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
