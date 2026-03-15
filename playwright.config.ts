import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120000, // TLDR: 120s for complete gameplay runs
  use: {
    baseURL: process.env.GAME_URL || 'http://localhost:3002/flora/',
    trace: 'on-first-retry',
    actionTimeout: 10000, // TLDR: 10s for individual actions
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        // TLDR: Real GPU for headed mode gameplay testing
        headless: false, // TLDR: Headed mode to see actual gameplay
        launchOptions: {
          slowMo: 100, // TLDR: Slow down for observation
          args: [
            '--enable-gpu',
            '--enable-webgl',
          ],
        },
      },
    },
  ],
});
