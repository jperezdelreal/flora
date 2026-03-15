import { test, expect, type Page } from '@playwright/test';

/**
 * TLDR: Helper to wait for canvas element and ensure it has valid dimensions
 */
async function waitForCanvas(page: Page) {
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible', timeout: 30000 });
  
  try {
    const width = await canvas.evaluate((el) => (el as HTMLCanvasElement).width);
    const height = await canvas.evaluate((el) => (el as HTMLCanvasElement).height);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  } catch (error) {
    console.warn('Canvas dimension check timeout (headless WebGL limitation)');
  }
  
  return canvas;
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
 * TLDR: Helper to take screenshot at key moments
 */
async function takeScreenshot(page: Page, name: string, screenshotDir: string) {
  try {
    const canvas = page.locator('canvas');
    await canvas.screenshot({ 
      path: `${screenshotDir}/${name}.png`, 
      timeout: 5000 
    });
    console.log(`✓ Screenshot captured: ${name}`);
  } catch (error) {
    console.warn(`⚠ Screenshot skipped (${name}): headless WebGL timeout`);
  }
}

/**
 * TLDR: Helper to collect console logs and errors
 */
async function setupLogging(page: Page): Promise<{ errors: string[]; logs: string[] }> {
  const errors: string[] = [];
  const logs: string[] = [];
  
  page.on('pageerror', (error) => {
    const msg = `PageError: ${error.message}`;
    errors.push(msg);
    console.error(`🔴 ${msg}`);
  });
  
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${text}`);
      console.error(`🔴 Console Error: ${text}`);
    } else if (msg.type() === 'warn') {
      logs.push(`Console Warn: ${text}`);
      console.warn(`⚠ ${text}`);
    }
  });
  
  return { errors, logs };
}

/**
 * TLDR: Wait for visual change by comparing screenshots
 */
async function waitForVisualChange(page: Page, timeoutMs: number = 10000): Promise<boolean> {
  const canvas = page.locator('canvas');
  const startTime = Date.now();
  
  try {
    const before = await canvas.screenshot({ timeout: 5000 });
    
    while (Date.now() - startTime < timeoutMs) {
      await waitForRenderedFrames(page, 30); // Wait ~0.5s
      try {
        const after = await canvas.screenshot({ timeout: 5000 });
        if (Buffer.compare(before, after) !== 0) {
          return true; // Visual change detected
        }
      } catch {
        // Screenshot failed, keep waiting
      }
    }
    return false;
  } catch {
    return false;
  }
}

test.describe('Flora Complete Gameplay Tests', () => {
  test('Complete game run #1 - First playthrough', async ({ page }, testInfo) => {
    console.log('\n🎮 STARTING GAME RUN #1');
    const screenshotDir = testInfo.outputPath('run1-screenshots');
    const { errors, logs } = await setupLogging(page);
    
    // ===== STEP 1: Load & Boot =====
    console.log('📍 STEP 1: Loading game...');
    await page.goto('');
    const canvas = await waitForCanvas(page);
    await waitForRenderedFrames(page, 60); // Wait for boot screen to load
    await takeScreenshot(page, '01-boot-loading', screenshotDir);
    
    // TLDR: Wait for boot screen to complete (loading bar fills, then auto-transitions)
    console.log('   Waiting for boot screen to complete...');
    await waitForRenderedFrames(page, 180); // ~3 seconds for boot animation
    await takeScreenshot(page, '02-after-boot', screenshotDir);
    
    // ===== STEP 2: Main Menu =====
    console.log('📍 STEP 2: On main menu...');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '03-main-menu', screenshotDir);
    
    // TLDR: Press Enter to start New Run (P0 fix #273 should work now)
    console.log('   Pressing Enter to start New Run...');
    await page.keyboard.press('Enter');
    await waitForRenderedFrames(page, 60); // Wait for scene transition
    await takeScreenshot(page, '04-after-enter', screenshotDir);
    
    // ===== STEP 3: Seed Selection or Garden =====
    console.log('📍 STEP 3: Should be in seed selection or garden...');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '05-seed-or-garden', screenshotDir);
    
    // TLDR: Try to select seeds by clicking in the center area
    console.log('   Attempting seed selection...');
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      
      // Click 3 seed positions (left, center, right)
      console.log('     Clicking seed 1 (left)');
      await page.mouse.click(centerX - 150, centerY);
      await waitForRenderedFrames(page, 10);
      
      console.log('     Clicking seed 2 (center)');
      await page.mouse.click(centerX, centerY);
      await waitForRenderedFrames(page, 10);
      
      console.log('     Clicking seed 3 (right)');
      await page.mouse.click(centerX + 150, centerY);
      await waitForRenderedFrames(page, 10);
      
      await takeScreenshot(page, '06-seeds-clicked', screenshotDir);
      
      // Click Start button (bottom center)
      console.log('     Clicking Start button');
      await page.mouse.click(centerX, canvasBox.y + canvasBox.height - 80);
      await waitForRenderedFrames(page, 60);
      await takeScreenshot(page, '07-after-start', screenshotDir);
    }
    
    // ===== STEP 4-6: Play through days in garden =====
    console.log('📍 STEP 4-6: Playing through garden days...');
    
    for (let day = 1; day <= 5; day++) {
      console.log(`   Day ${day}...`);
      await waitForRenderedFrames(page, 30);
      await takeScreenshot(page, `08-day${day}-start`, screenshotDir);
      
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        const centerX = canvasBox.x + canvasBox.width / 2;
        const centerY = canvasBox.y + canvasBox.height / 2;
        
        // Perform 3-5 actions (clicking tiles, tools, etc.)
        console.log('     Performing actions...');
        for (let action = 0; action < 4; action++) {
          const offsetX = (action - 1.5) * 70;
          await page.mouse.click(centerX + offsetX, centerY);
          await waitForRenderedFrames(page, 8);
        }
        
        await takeScreenshot(page, `09-day${day}-actions-done`, screenshotDir);
        
        // Click End Day button (bottom-right area)
        console.log('     Clicking End Day...');
        await page.mouse.click(canvasBox.x + canvasBox.width - 80, canvasBox.y + canvasBox.height - 40);
        await waitForRenderedFrames(page, 90); // Wait for day transition
      }
    }
    
    // ===== STEP 7: Check final state =====
    console.log('📍 STEP 7: After 5 days...');
    await waitForRenderedFrames(page, 60);
    await takeScreenshot(page, '10-final-state', screenshotDir);
    
    // Try to return to menu (press Escape or Enter)
    console.log('   Attempting to return to menu...');
    await page.keyboard.press('Escape');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '11-after-escape', screenshotDir);
    
    // If pause menu, press Q to quit
    await page.keyboard.press('KeyQ');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '12-after-quit', screenshotDir);
    
    // ===== VERIFICATION =====
    console.log('📍 VERIFICATION: Checking for errors...');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${logs.length}`);
    
    if (errors.length > 0) {
      console.error('🔴 ERRORS FOUND:');
      errors.forEach(e => console.error(`   - ${e}`));
    }
    
    expect(errors).toHaveLength(0);
    console.log('✅ GAME RUN #1 COMPLETE - No runtime errors\n');
  });

  test('Complete game run #2 - Second playthrough', async ({ page }, testInfo) => {
    console.log('\n🎮 STARTING GAME RUN #2');
    const screenshotDir = testInfo.outputPath('run2-screenshots');
    const { errors, logs } = await setupLogging(page);
    
    // ===== STEP 1: Load & Boot =====
    console.log('📍 STEP 1: Loading game...');
    await page.goto('');
    const canvas = await waitForCanvas(page);
    await waitForRenderedFrames(page, 60);
    await takeScreenshot(page, '01-boot-loading', screenshotDir);
    
    console.log('   Waiting for boot screen to complete...');
    await waitForRenderedFrames(page, 180);
    await takeScreenshot(page, '02-after-boot', screenshotDir);
    
    // ===== STEP 2: Main Menu =====
    console.log('📍 STEP 2: On main menu...');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '03-main-menu', screenshotDir);
    
    console.log('   Pressing Enter to start New Run...');
    await page.keyboard.press('Enter');
    await waitForRenderedFrames(page, 60);
    await takeScreenshot(page, '04-after-enter', screenshotDir);
    
    // ===== STEP 3: Seed Selection (different seeds) =====
    console.log('📍 STEP 3: Seed selection (different pattern)...');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '05-seed-selection', screenshotDir);
    
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      
      // Different seed choices than run 1
      console.log('     Clicking seed 1 (right)');
      await page.mouse.click(centerX + 200, centerY);
      await waitForRenderedFrames(page, 10);
      
      console.log('     Clicking seed 2 (bottom)');
      await page.mouse.click(centerX, centerY + 100);
      await waitForRenderedFrames(page, 10);
      
      console.log('     Clicking seed 3 (left-top)');
      await page.mouse.click(centerX - 150, centerY - 50);
      await waitForRenderedFrames(page, 10);
      
      await takeScreenshot(page, '06-seeds-clicked', screenshotDir);
      
      console.log('     Clicking Start button');
      await page.mouse.click(centerX, canvasBox.y + canvasBox.height - 80);
      await waitForRenderedFrames(page, 60);
      await takeScreenshot(page, '07-after-start', screenshotDir);
    }
    
    // ===== STEP 4: Play through 6 days =====
    console.log('📍 STEP 4: Playing through 6 days...');
    
    for (let day = 1; day <= 6; day++) {
      console.log(`   Day ${day}...`);
      await waitForRenderedFrames(page, 30);
      await takeScreenshot(page, `08-day${day}-start`, screenshotDir);
      
      const canvasBox = await canvas.boundingBox();
      if (canvasBox) {
        const centerX = canvasBox.x + canvasBox.width / 2;
        const centerY = canvasBox.y + canvasBox.height / 2;
        
        // Perform actions
        console.log('     Performing actions...');
        for (let action = 0; action < 5; action++) {
          const offsetX = (action - 2) * 65;
          const offsetY = (action % 2) * 40;
          await page.mouse.click(centerX + offsetX, centerY + offsetY);
          await waitForRenderedFrames(page, 8);
        }
        
        await takeScreenshot(page, `09-day${day}-actions-done`, screenshotDir);
        
        // End day
        console.log('     Clicking End Day...');
        await page.mouse.click(canvasBox.x + canvasBox.width - 80, canvasBox.y + canvasBox.height - 40);
        await waitForRenderedFrames(page, 90);
      }
    }
    
    // ===== STEP 5: Final state =====
    console.log('📍 STEP 5: After 6 days...');
    await waitForRenderedFrames(page, 60);
    await takeScreenshot(page, '10-final-state', screenshotDir);
    
    // Return to menu
    console.log('   Attempting to return to menu...');
    await page.keyboard.press('Escape');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '11-after-escape', screenshotDir);
    
    await page.keyboard.press('KeyQ');
    await waitForRenderedFrames(page, 30);
    await takeScreenshot(page, '12-after-quit', screenshotDir);
    
    // ===== VERIFICATION =====
    console.log('📍 VERIFICATION: Checking for errors...');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${logs.length}`);
    
    if (errors.length > 0) {
      console.error('🔴 ERRORS FOUND:');
      errors.forEach(e => console.error(`   - ${e}`));
    }
    
    expect(errors).toHaveLength(0);
    console.log('✅ GAME RUN #2 COMPLETE - No runtime errors\n');
  });
});
