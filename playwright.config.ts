import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120000, // TLDR: Increase to 120s for long gameplay tests
  use: {
    baseURL: process.env.GAME_URL || 'http://localhost:3000/flora/',
    trace: 'on-first-retry',
    actionTimeout: 15000, // TLDR: 15s for individual actions
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        // TLDR: Headed mode with real GPU for accurate WebGL rendering
        headless: false,
        launchOptions: {
          slowMo: 500, // TLDR: Slow down actions to observe what's happening
          args: [
            '--enable-gpu',
            '--use-gl=angle',
            '--enable-webgl',
          ],
        },
      },
    },
  ],
});
