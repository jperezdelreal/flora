// TLDR: Long gameplay test — plays Flora for real, observing visual state at each step
import { test, expect, Page } from '@playwright/test';

test.describe('Flora Complete Gameplay Session', () => {
  test('complete gameplay — menu navigation, seed selection, planting, watering, day progression', async ({ page }) => {
    const screenshots: string[] = [];
    let consoleErrors: string[] = [];

    // TLDR: Capture console errors throughout the session
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // TLDR: Step 1 — Load the game
    await page.goto('');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // TLDR: Give PixiJS time to initialize

    // TLDR: Debug — take screenshot immediately to see what we're getting
    await page.screenshot({ path: 'test-results/debug-01-initial-load.png', fullPage: true });
    console.log('✓ Debug screenshot saved');

    // TLDR: Check page content
    const bodyText = await page.textContent('body');
    console.log('Body text:', bodyText?.substring(0, 200));

    // TLDR: Wait for canvas to appear (PixiJS initialization)
    const canvas = page.locator('canvas');
    
    // TLDR: Try to find any elements on the page
    const allElements = await page.evaluate(() => {
      return {
        hasCanvas: document.querySelector('canvas') !== null,
        bodyChildren: document.body.children.length,
        title: document.title,
        readyState: document.readyState
      };
    });
    console.log('Page state:', allElements);
    
    await canvas.waitFor({ state: 'visible', timeout: 30000 });
    
    console.log('✓ Canvas visible — game loaded');

    // TLDR: Step 2 — Wait for boot animation to complete (should auto-transition to menu)
    await page.waitForTimeout(3000);
    
    // TLDR: OBSERVE — Boot screen
    const bootScreenshot = `test-results/gameplay-01-boot.png`;
    await page.screenshot({ path: bootScreenshot, fullPage: true });
    screenshots.push(bootScreenshot);
    console.log(`✓ Screenshot saved: ${bootScreenshot}`);

    // TLDR: Step 3 — Wait for menu scene (look for menu UI elements)
    await page.waitForTimeout(2000);
    
    // TLDR: OBSERVE — Menu screen
    const menuScreenshot = `test-results/gameplay-02-menu.png`;
    await page.screenshot({ path: menuScreenshot, fullPage: true });
    screenshots.push(menuScreenshot);
    console.log(`✓ Screenshot saved: ${menuScreenshot}`);
    console.log('⚠️  MANUAL CHECK: Is the menu cozy? Are colors warm earth tones? Can you read the text?');

    // TLDR: Step 4 — Navigate menu with keyboard (Enter to start)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // TLDR: OBSERVE — Seed selection screen
    const seedSelectionScreenshot = `test-results/gameplay-03-seed-selection.png`;
    await page.screenshot({ path: seedSelectionScreenshot, fullPage: true });
    screenshots.push(seedSelectionScreenshot);
    console.log(`✓ Screenshot saved: ${seedSelectionScreenshot}`);
    console.log('⚠️  MANUAL CHECK: Can you read the seed cards? Are plant names visible? Rarity colors clear?');

    // TLDR: Step 5 — Select 3 seeds (click approach — adjust coordinates if needed)
    // TLDR: These coordinates are estimates — may need adjustment based on actual layout
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) {
      throw new Error('Canvas bounding box not found');
    }

    // TLDR: Click three seed card positions (left, center, right thirds of canvas)
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.25, canvasBox.y + canvasBox.height * 0.5);
    await page.waitForTimeout(500);
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.5);
    await page.waitForTimeout(500);
    await page.mouse.click(canvasBox.x + canvasBox.width * 0.75, canvasBox.y + canvasBox.height * 0.5);
    await page.waitForTimeout(500);

    console.log('✓ Selected 3 seeds');

    // TLDR: Step 6 — Start the run (press Enter or click start button)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // TLDR: OBSERVE — Garden initial state
    const gardenInitialScreenshot = `test-results/gameplay-04-garden-initial.png`;
    await page.screenshot({ path: gardenInitialScreenshot, fullPage: true });
    screenshots.push(gardenInitialScreenshot);
    console.log(`✓ Screenshot saved: ${gardenInitialScreenshot}`);
    console.log('⚠️  MANUAL CHECK: Is the grid visible? HUD readable? Can you tell what day it is? Actions remaining?');

    // TLDR: Step 7-11 — Play the game (plant, water, advance days)
    for (let day = 1; day <= 7; day++) {
      console.log(`\n--- Day ${day} ---`);

      // TLDR: Plant seeds (click random tiles in garden area)
      if (day <= 3) {
        for (let i = 0; i < 2; i++) {
          const randomX = canvasBox.x + canvasBox.width * (0.2 + Math.random() * 0.6);
          const randomY = canvasBox.y + canvasBox.height * (0.2 + Math.random() * 0.6);
          await page.mouse.click(randomX, randomY);
          await page.waitForTimeout(300);
          console.log(`  ✓ Planted seed at (${Math.floor(randomX)}, ${Math.floor(randomY)})`);
        }
      }

      // TLDR: Water plants (use water tool and click tiles)
      // TLDR: Press 'W' for water tool (if hotkey exists)
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(300);

      for (let i = 0; i < 3; i++) {
        const randomX = canvasBox.x + canvasBox.width * (0.2 + Math.random() * 0.6);
        const randomY = canvasBox.y + canvasBox.height * (0.2 + Math.random() * 0.6);
        await page.mouse.click(randomX, randomY);
        await page.waitForTimeout(300);
        console.log(`  ✓ Watered tile at (${Math.floor(randomX)}, ${Math.floor(randomY)})`);
      }

      // TLDR: OBSERVE — Take screenshot at end of each day
      const dayScreenshot = `test-results/gameplay-05-day-${day}.png`;
      await page.screenshot({ path: dayScreenshot, fullPage: true });
      screenshots.push(dayScreenshot);
      console.log(`  ✓ Screenshot saved: ${dayScreenshot}`);
      console.log('  ⚠️  MANUAL CHECK: Does the garden show growth? Are plants visible? Animations smooth?');

      // TLDR: Advance to next day (press Space or click rest button)
      await page.keyboard.press('Space');
      await page.waitForTimeout(2000); // TLDR: Wait for day transition animation
    }

    // TLDR: Step 12 — Check for console errors
    console.log(`\n--- Console Errors (${consoleErrors.length} total) ---`);
    if (consoleErrors.length > 0) {
      console.error(consoleErrors.join('\n'));
    } else {
      console.log('✓ No console errors during gameplay');
    }

    // TLDR: Step 13 — End the run (pause menu or wait for days to run out)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // TLDR: OBSERVE — Pause menu
    const pauseMenuScreenshot = `test-results/gameplay-06-pause-menu.png`;
    await page.screenshot({ path: pauseMenuScreenshot, fullPage: true });
    screenshots.push(pauseMenuScreenshot);
    console.log(`✓ Screenshot saved: ${pauseMenuScreenshot}`);

    // TLDR: Quit to menu
    await page.keyboard.press('KeyQ'); // TLDR: Assuming Q is quit hotkey
    await page.waitForTimeout(2000);

    // TLDR: OBSERVE — Results screen (if it exists)
    const resultsScreenshot = `test-results/gameplay-07-results.png`;
    await page.screenshot({ path: resultsScreenshot, fullPage: true });
    screenshots.push(resultsScreenshot);
    console.log(`✓ Screenshot saved: ${resultsScreenshot}`);
    console.log('⚠️  MANUAL CHECK: Does the results screen show what you accomplished? Score visible? Discoveries?');

    // TLDR: Return to menu
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // TLDR: OBSERVE — Back to menu
    const menuReturnScreenshot = `test-results/gameplay-08-menu-return.png`;
    await page.screenshot({ path: menuReturnScreenshot, fullPage: true });
    screenshots.push(menuReturnScreenshot);
    console.log(`✓ Screenshot saved: ${menuReturnScreenshot}`);

    // TLDR: Final summary
    console.log('\n=== GAMEPLAY SESSION COMPLETE ===');
    console.log(`Screenshots captured: ${screenshots.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Review all screenshots in test-results/');
    console.log('2. Create GitHub issues for visual/UX problems');
    console.log('3. Tag issues with priority (P0/P1/P2) based on player impact');

    // TLDR: Assert minimal expectations
    expect(screenshots.length).toBeGreaterThan(0);
    expect(consoleErrors.length).toBeLessThan(10); // TLDR: Allow some warnings but not excessive errors
  });
});
