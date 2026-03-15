import { test, expect, type Page } from '@playwright/test';

/**
 * TLDR: Helper to wait for canvas element and ensure it has valid dimensions
 */
async function waitForCanvas(page: Page) {
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible', timeout: 10000 });
  
  // TLDR: Verify canvas has valid dimensions (PixiJS will set width/height)
  const width = await canvas.evaluate((el) => (el as HTMLCanvasElement).width);
  const height = await canvas.evaluate((el) => (el as HTMLCanvasElement).height);
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
  
  return canvas;
}

/**
 * TLDR: Helper to check if canvas has visual content by screenshot buffer size
 * Uses Playwright's canvas.screenshot() which works with WebGL canvases
 */
async function hasVisualContent(page: Page): Promise<boolean> {
  const canvas = page.locator('canvas');
  const screenshot = await canvas.screenshot();
  // TLDR: PNG with real content is >2KB; empty/black canvas is much smaller
  return screenshot.length > 2000;
}

/**
 * TLDR: Helper to wait for game to render multiple frames using rAF
 */
async function waitForRenderedFrames(page: Page, frameCount: number = 5) {
  await page.evaluate((count) => {
    return new Promise<void>((resolve) => {
      let frames = 0;
      const tick = () => {
        frames++;
        if (frames >= count) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
  }, frameCount);
}

/**
 * TLDR: Helper to collect runtime errors from page
 */
async function collectRuntimeErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('pageerror', (error) => {
    errors.push(`PageError: ${error.message}`);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  return errors;
}

test.describe('Flora Game E2E Tests', () => {
  test('page loads and canvas renders', async ({ page }) => {
    // TLDR: Setup error collection before navigation
    const errors = await collectRuntimeErrors(page);
    
    await page.goto('');
    
    // TLDR: Wait for canvas to appear and have dimensions
    const canvas = await waitForCanvas(page);
    
    // TLDR: Wait for several render frames
    await waitForRenderedFrames(page, 10);
    
    // TLDR: Verify canvas has visual content
    const hasContent = await hasVisualContent(page);
    expect(hasContent).toBe(true);
    
    // TLDR: No runtime errors should occur during load
    expect(errors).toHaveLength(0);
  });

  test('WebGL context is active', async ({ page }) => {
    await page.goto('');
    await waitForCanvas(page);
    
    // TLDR: Verify WebGL context exists and is functioning
    const webglActive = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return false;
      
      // TLDR: Check drawing buffer has valid dimensions
      return gl.drawingBufferWidth > 0 && gl.drawingBufferHeight > 0;
    });
    
    expect(webglActive).toBe(true);
  });

  test('game reaches menu screen', async ({ page }) => {
    await page.goto('');
    await waitForCanvas(page);
    
    // TLDR: Wait for boot scene to complete (loading bar animation)
    await waitForRenderedFrames(page, 60); // ~1 second at 60 FPS
    
    // TLDR: Take screenshot of menu screen
    const canvas = page.locator('canvas');
    const screenshot = await canvas.screenshot();
    
    // TLDR: Menu should have substantial visual content
    expect(screenshot.length).toBeGreaterThan(5000);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('');
    await waitForCanvas(page);
    
    // TLDR: Wait for menu to appear
    await waitForRenderedFrames(page, 60);
    
    // TLDR: Take baseline screenshot
    const canvas = page.locator('canvas');
    const before = await canvas.screenshot();
    
    // TLDR: Press down arrow key (should navigate menu)
    await page.keyboard.press('ArrowDown');
    await waitForRenderedFrames(page, 5);
    
    // TLDR: Take screenshot after input
    const after = await canvas.screenshot();
    
    // TLDR: Screenshots should differ (menu highlight changed)
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test('no runtime errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(`PageError: ${error.message}`);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    
    await page.goto('');
    await waitForCanvas(page);
    await waitForRenderedFrames(page, 60);
    
    // TLDR: No errors should be collected
    expect(errors).toHaveLength(0);
  });
});
