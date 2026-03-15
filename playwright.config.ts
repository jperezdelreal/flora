import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // TLDR: Increase timeout to 60s for WebGL games with slow initialization
  use: {
    baseURL: process.env.GAME_URL || 'https://jperezdelreal.github.io/flora/',
    trace: 'on-first-retry',
    actionTimeout: 10000, // TLDR: 10s for individual actions
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        // TLDR: WebGL flags for headless compatibility with PixiJS v8
        launchOptions: {
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--disable-gpu-sandbox',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
  ],
});
