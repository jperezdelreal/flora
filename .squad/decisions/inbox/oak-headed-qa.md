# Oak Headed Playwright QA — Findings Report
**Date:** 2026-03-15  
**Context:** First visual QA using Playwright headed mode with real GPU rendering  
**Branch:** squad/oak-headed-playwright-qa  
**Commit:** e83c5ba

---

## Executive Summary

**Mission:** Run Flora in headed Playwright mode, observe actual visuals, create quality backlog from player experience.

**Critical Discovery:** Menu keyboard navigation is BROKEN (#273 P0). Pressing Enter opens Achievements screen instead of starting a new run. This blocks all garden gameplay QA.

**What I DID see:** Boot screen, menu, and achievements screens look GORGEOUS. Cozy green palette works perfectly. Warm earth tones throughout. Typography clean and readable.

**What I COULDN'T see:** Garden, seed selection, planting, watering, plant growth, day transitions, results screen. Blocked by navigation bug.

---

## Test Infrastructure

**Changes:**
- `playwright.config.ts`: Configured for headed mode (headless: false, slowMo: 500)
- `playwright.config.ts`: Fixed baseURL to `localhost:3000/flora/` (was pointing to wrong project on 5173)
- `playwright.config.ts`: Real GPU with `--enable-gpu`, removed SwiftShader workarounds
- `playwright.config.ts`: Increased timeout to 120s for long gameplay tests
- `tests/e2e/flora-gameplay.spec.ts`: Comprehensive gameplay test with screenshot capture at every step

**Test Coverage:**
- Boot animation observation
- Menu navigation and button interactions
- Seed selection screen (BLOCKED)
- Garden gameplay: planting, watering, 7-day progression (BLOCKED)
- Pause menu and results screen (saw menu, not results)
- Console error monitoring (0 errors detected ✅)

**Test Result:** ✅ Test PASSED but revealed critical navigation bug

---

## Visual Quality Observations

### ✅ Boot Screen (EXCELLENT)
**Screenshot:** gameplay-01-boot.png

- **Palette:** Rich forest green (#2d5016 approx), warm and inviting ✅
- **Logo:** FLORA with leaf icon - clean, memorable ✅
- **Tagline:** "A cozy gardening roguelite" - perfectly descriptive ✅
- **Particles:** Animated colored dots (yellow, orange, sage) floating across screen - adds life ✅
- **Branding:** "First Frame Studios" credit at bottom - subtle ✅

**Issue Created:** #274 (P2) - "Press any key" prompt has low contrast and is easy to miss

### ✅ Main Menu (EXCELLENT)
**Screenshot:** gameplay-02-menu.png, gameplay-06-pause-menu.png

- **Button Layout:** Vertical stack of 5 buttons - clean hierarchy ✅
- **Visual Focus:** "New Run" highlighted with green border (#5cbf60 approx) - clear selection state ✅
- **Icons:** Each button has emoji-like icon (🌱, 💾, 📖, 🏆, ⚙️) - aids recognition ✅
- **Typography:** White text on dark buttons - excellent contrast (WCAG AAA) ✅
- **Background:** Same forest green with particles - visual continuity ✅
- **Footer:** "↑ Navigate • Enter Select • Esc Back" - helpful keyboard hints ✅

**Issues Created:**
- #273 (P0) - Keyboard navigation broken: Enter opens Achievements instead of New Run
- #276 (P2) - Buttons lack hover states - no visual feedback before clicking

### ✅ Achievements Screen (GOOD, needs interaction polish)
**Screenshot:** gameplay-04-garden-initial.png, gameplay-05-day-*.png

- **Header Bar:** "🏆 Achievements" with progress "0 / 14 (0%)" - clear status ✅
- **Category Tabs:** Harvest, Survival, Synergy, Exploration, Mastery - organized by gameplay pillar ✅
- **Tab Counts:** Each tab shows "0/3", "0/2", etc. - good information scent ✅
- **Gallery Layout:** Dark cards (almost black #1a1a1a) on green background - good contrast ✅
- **Locked State:** Orange padlock icon + "???" + category label - mystery/discovery vibe ✅
- **Back Button:** "← Back" in bottom-left corner with rounded border - easy to find ✅
- **Footer Hint:** "Esc to go back • Arrow keys to scroll" ✅

**Issues Created:**
- #275 (P1) - Locked achievements have no hover feedback - clicking does nothing with no visual response

### ❌ Garden Gameplay (BLOCKED - NOT TESTED)
**Reason:** Menu navigation bug #273 prevents reaching garden scene

**What needs testing:**
- Seed selection screen design and readability
- Garden grid tile visibility and state clarity
- HUD layout: day counter, actions, season, tools
- Planting interaction: click feedback, seed placement visuals
- Watering tool: visual differentiation of watered vs dry tiles
- Plant sprites: growth stages, colors, procedural rendering
- Day transition animation: smooth or jarring?
- Hazard indicators: pests, weeds, weather effects
- Results screen: score presentation, discoveries, achievements earned

**Next Steps:** Fix #273, re-run flora-gameplay.spec.ts, analyze garden screenshots

---

## Issues Created

### P0 (Blocks Gameplay)
- **#273** - Menu keyboard navigation broken - Enter opens Achievements instead of New Run
  - **Player Impact:** Keyboard-only players cannot start the game
  - **Evidence:** 14 screenshots showing menu → achievements transition
  - **Fix Required:** MenuScene keyboard handler needs to activate correct button

### P1 (Hurts Experience)
- **#275** - Achievements screen has no visual feedback when clicking locked achievements
  - **Player Impact:** Confusion - "Did my click work?" "How do I unlock this?"
  - **Recommendation:** Add hover state, tooltip with unlock hint, cursor change

### P2 (Polish)
- **#274** - Boot screen "Press any key" hint too subtle - easy to miss
  - **Player Impact:** Confusion on first launch - "Is it frozen?"
  - **Recommendation:** Use UI_COLORS.TEXT (white) or add fade animation
- **#276** - Menu buttons lack hover states - no visual confirmation before clicking
  - **Player Impact:** Reduced tactile confidence in UI
  - **Recommendation:** Add brightness change and cursor pointer on hover

### BLOCKED
- **Garden Gameplay QA** (not filed as separate issue, tracked in this doc)
  - **Dependency:** #273 must be fixed first
  - **Testing Ready:** Playwright headed mode working, gameplay test written

---

## Positive Findings (What's Working)

1. **Cozy Palette Achieved:** The green forest theme is PERFECT. Warm, inviting, not generic.
2. **Typography Hierarchy:** All text is readable, contrast is excellent (except boot hint).
3. **Particle Effects:** Subtle animated dots add life without clutter.
4. **Icon Usage:** Emojis/icons on buttons aid navigation without text overload.
5. **Visual Continuity:** Boot → Menu → Achievements all feel like same game.
6. **Keyboard Hints:** Footer text guides players toward keyboard controls.
7. **Zero Console Errors:** Test ran for 1.2 minutes with no JS errors. ✅

---

## Technical Insights

### Headed vs Headless WebGL
- **Headless mode (SwiftShader):** Produces timeouts and false positives (#268)
- **Headed mode (real GPU):** Flora renders perfectly, canvas appears instantly
- **Recommendation:** All visual QA must use headed mode until SwiftShader compatibility is resolved

### Playwright Configuration
- **baseURL gotcha:** Using `localhost:5173` loaded wrong project (ffs-squad-monitor). Fixed to `localhost:3000/flora/`.
- **slowMo: 500:** Perfect speed to observe interactions without making test too slow.
- **Timeout: 120s:** Necessary for 7-day gameplay loop with screenshots.

### Screenshot-Based QA
- **Value:** Screenshots capture what headless tests can't - visual quality, UX feel.
- **Workflow:** Run headed test → Analyze screenshots → File issues from player perspective.
- **Future:** Add visual regression testing with Playwright's built-in screenshot comparison.

---

## Architectural Recommendations

### MenuScene Keyboard Navigation
**Root Cause Hypothesis:**
- Visual focus state (green border) != actual keyboard focus index
- Enter key handler likely calls wrong menu option by index
- Possible off-by-one error in selectedIndex tracking

**Fix Strategy:**
1. Check MenuScene keyboard event listeners
2. Verify selectedIndex maps to correct button
3. Add debug logging: "Enter pressed on index X, button name Y"
4. Ensure visual highlight updates with keyboard navigation (↑↓ keys)

### Achievements Interaction Polish
**Current State:** Locked cards are non-interactive (no hover, no tooltip)

**Recommendation:**
1. Add hover state: `cursor: 'not-allowed'`, dim card brightness by 10%
2. Click locked card → tooltip appears with partial hint: "Harvest ??? plants to unlock"
3. Unlocked cards: full hover state, click opens detail modal with cosmetic reward preview

### Future QA Process
**Established Pattern:**
1. Run headed Playwright test on localhost dev server
2. Capture screenshots at every major interaction
3. Analyze visuals from PLAYER perspective: "Would I show this to a friend?"
4. File issues with severity based on player impact, not code complexity
5. Re-run after fixes to validate improvements

---

## Next Actions

1. **Immediate:** Assign #273 (P0 menu navigation) to Misty (UI specialist)
2. **After #273 Fixed:** Re-run flora-gameplay.spec.ts to capture garden screenshots
3. **Garden QA Round 2:** Analyze seed selection, planting, growth, results screens
4. **Iterate:** File new P0/P1/P2 issues for garden visual/UX problems
5. **Long-term:** Integrate headed tests into CI with Xvfb (Linux) or headed Docker (Windows)

---

## Files Changed

- `playwright.config.ts` - Configured for headed mode with real GPU
- `tests/e2e/flora-gameplay.spec.ts` - Comprehensive gameplay test (NEW)

**Branch:** squad/oak-headed-playwright-qa  
**Commit:** e83c5ba  
**PR:** (to be created after #273 is prioritized)

---

## Conclusion

**Flora's UI layer is screenshot-worthy.** The cozy aesthetic is REAL - not just in config constants, but visible on screen. Warm greens, clean typography, thoughtful iconography.

**But navigation is broken.** A P0 bug prevents keyboard players from starting the game. This must be fixed before any further QA.

**Once fixed, we'll see the GARDEN.** That's where 90% of playtime happens. That's what will make or break Flora's "cozy" promise.

**The headed Playwright infrastructure works.** We now have eyes. Let's use them to ship a beautiful game.

— Oak, Chief Architect
