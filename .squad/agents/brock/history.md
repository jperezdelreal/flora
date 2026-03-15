## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### Audio System Architecture (Issue #32, PR #45)
- **AudioManager singleton**: Web Audio API routing with separate buses (sfx/ambient/music) → master gain → compressor → destination
- **Procedural audio generation**: All SFX synthesized via oscillators, noise buffers, and filters—no external assets required
- **EventBus integration pattern**: Systems emit typed events (`plant:watered`, `pest:spawned`, etc.), GardenScene subscribes and triggers audioManager.playSFX()
- **Browser AudioContext requirement**: Must call `audioManager.resume()` after user interaction (click/keypress) to unlock audio
- **Volume persistence**: AudioManager saves preferences to localStorage, restored on init()
- **Key files**: `src/systems/AudioManager.ts` (fully implemented), `src/main.ts` (init + resume), `src/scenes/GardenScene.ts` (event listeners), `src/ui/PauseMenu.ts` (mute toggle)

### Persistent Save System Architecture (Issue #48, PR #61)
- **SaveManager centralization**: Single `SaveManager` system coordinates all localStorage operations, eliminating scattered save logic
- **Typed save schema with versioning**: `src/config/saveSchema.ts` defines `SaveData` interface with version field for safe migrations
- **Optional SaveManager injection**: All systems (Encyclopedia, Unlock, Scoring, Audio) accept optional `SaveManager` in constructor, fall back to direct localStorage if not provided
- **Auto-save every 60 seconds**: SaveManager tracks "dirty" state via EventBus subscriptions, auto-saves periodically
- **SaveIndicator UI component**: PixiJS toast shows "💾 Saving..." / "✓ Saved" / "⚠ Save Failed" with fade-out animation
- **Safe storage utilities**: `src/utils/storage.ts` wraps localStorage with try-catch, never throws, returns fallback values
- **Graceful corruption handling**: `validateSave()` checks structure, `migrateSave()` repairs broken saves, no data loss
- **Manual save triggers**: End of run, day advance, discovery, unlock milestone
- **Key files**: `src/systems/SaveManager.ts`, `src/config/saveSchema.ts`, `src/utils/storage.ts`, `src/ui/SaveIndicator.ts`, `src/main.ts` (wiring)

### Performance & Accessibility Infrastructure (Issue #116)
- **Object Pool**: Generic `ObjectPool<T>` in `src/utils/objectPool.ts` — acquire/release pattern with configurable create/reset/destroy callbacks, pre-warming, max size cap
- **FPS Monitor**: `src/core/FPSMonitor.ts` — dev-mode overlay sampling real FPS via `performance.now()`, rolling 60-frame window, auto quality tier detection (high/medium/low) with sustained-drop threshold
- **GameLoop integration**: FPSMonitor attached via `gameLoop.setFPSMonitor()`, samples after every rendered frame
- **Colorblind palettes**: `src/config/accessibility.ts` defines 4 vision modes (normal, deuteranopia, protanopia, tritanopia) as config-driven `ColorPalette` objects
- **Accessibility runtime**: `src/utils/accessibility.ts` — ARIA live region (`announce()`), localStorage persistence, palette cycling, focus ring drawing, reduced motion detection
- **ARIA announcements**: `main.ts` subscribes to EventBus events (harvest, day, season, milestone, achievement, discovery, pest, weather) and pushes messages to a hidden `role="status"` DOM element
- **Keyboard navigation**: PauseMenu now has full arrow/Tab/Enter/Space navigation with visible yellow focus ring, wrap-around, and colorblind mode toggle
- **Semantic HTML**: index.html now has `<main role="application">`, skip-to-content link, proper landmark structure
- **Save schema extended**: `SettingsSaveData` interface with `colorVisionMode`, `reducedMotion`, `highContrast` fields; SaveManager has `saveSettings()`/`loadSettings()` helpers
- **Key files**: `src/utils/objectPool.ts`, `src/core/FPSMonitor.ts`, `src/config/accessibility.ts`, `src/utils/accessibility.ts`, `src/ui/PauseMenu.ts`, `src/main.ts`, `index.html`

### Touch Controls & Mobile Responsiveness (Issue #119)
- **TouchController**: Gesture recognizer on PixiJS Container — tap, long-press (500ms), drag (10px threshold), pinch-to-zoom (0.5x–2x). Uses PixiJS v8 pointer events for tap/drag/long-press and raw DOM touch events for multi-touch pinch
- **Pointer abstraction in InputManager**: Added `PointerState` interface (isDown, justPressed, justReleased, x, y, isTouch) via window PointerEvent listeners. Mouse and touch produce identical state. Existing keyboard API untouched
- **Responsive utilities**: `src/utils/responsive.ts` — viewport breakpoints (320/480/768/1024/1440), `calculateGridScale()` auto-fits grid to any screen, `responsiveFontSize()`, `ensureTouchTarget()` enforces 44px minimum
- **GardenScene integration**: TouchController on shakeContainer, responsive relayout on window resize, pinch scales gridSystem container, orientation hint auto-shows in portrait on mobile
- **Haptic feedback**: `navigator.vibrate()` with light/medium/heavy intensity levels. Visual ripple ring animates at touch point
- **Mobile viewport**: `index.html` updated with `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`, `touch-action: none`, `-webkit-touch-callout: none`
- **EventBus events**: Added `touch:tap`, `touch:longpress`, `touch:pinch`, `viewport:resized`, `viewport:orientationChanged`
- **Config**: `TOUCH` constants in `src/config/index.ts` for tuning gesture thresholds
- **Audio**: `touchstart` listener added to resume AudioContext on mobile
- **Key files**: `src/core/TouchController.ts`, `src/utils/responsive.ts`, `src/core/InputManager.ts`, `src/scenes/GardenScene.ts`, `src/config/index.ts`, `src/main.ts`, `index.html`

### GameLoop dt Units Fix (2026-03-14)
- **Bug:** GameLoop sends dt as seconds (1/60 ≈ 0.01667), but MenuScene, GardenScene.updateVisuals, AnimationSystem, and ParticleSystem all divided by 60 again, making timing 60x too slow
- **Root cause:** Systems assumed dt was frame-based (1.0 per frame) and converted to seconds manually. But GameLoop.fixedDt is already in seconds.
- **Fix:** Removed `/ 60` in MenuScene.ts:642, GardenScene.ts:1679, AnimationSystem.ts:108, ParticleSystem.ts:159
- **Impact:** Title screen was blank (alpha animations never completed in reasonable time), particles barely moved, screen shake and sky lerp were imperceptible
- **Convention:** dt from GameLoop is ALWAYS in seconds. Never divide by 60.
- **Key files:** src/core/GameLoop.ts (source of truth for dt units), src/scenes/MenuScene.ts, src/scenes/GardenScene.ts, src/systems/AnimationSystem.ts, src/systems/ParticleSystem.ts

### Smooth Scene Transitions (Issue #200, Branch squad/200-scene-transitions)
- **Four transition types**: fade (fade-to-black with 0.1s hold), crossfade (simultaneous alpha blending), slide (slide-in from right with background dim), loading (progress bar with custom message)
- **Easing functions**: Implemented easeInOutCubic, easeOut, easeIn, easeLinear for smooth non-linear motion
- **Input blocking**: SceneManager.update() checks transitioning flag and blocks scene updates during transitions
- **Configurable durations**: Each transition type has sensible defaults (fade: 0.4s, crossfade: 0.6s, slide: 0.5s, loading: 0.8s) but accepts duration override
- **Scene routing**: Boot to Menu uses loading transition, Menu to SeedSelection uses crossfade, all Garden entries use fade
- **Container alpha animation**: Updated animateAlpha to accept Container or Graphics and configurable easing function
- **Progress bar animation**: Loading transition animates progress bar fill from 0 to 100% using easeInOutCubic, runs in parallel with actual scene init
- **Stage container swapping**: Crossfade and slide transitions create temporary containers, render new scene into them, then move children back to main stage after animation completes
- **Convention**: All transitions return Promises that resolve when animation completes, allowing await-based sequencing
- **Key files**: src/core/SceneManager.ts, src/core/index.ts, src/scenes/BootScene.ts, src/scenes/MenuScene.ts, src/scenes/SeedSelectionScene.ts

### Procedural Audio Integration (Issue #203, PR #211)
- **Context**: AudioManager was fully implemented with procedural synthesis, but MenuScene and SeedSelectionScene didn't start ambient audio
- **Problem**: Players experience silence on title screen and seed selection, breaking cozy atmosphere continuity
- **Solution**: Added `audioManager.startAmbient()` to MenuScene.init() and SeedSelectionScene.init(), plus corresponding `stopAmbient()` in destroy() methods
- **Audio flow**: BootScene (silent) → MenuScene (ambient starts) → SeedSelectionScene (ambient continues) → GardenScene (ambient continues + SFX active)
- **Scene lifecycle**: Each scene stops ambient on destroy(), next scene starts it on init(). This creates a brief silence during scene transitions, which is acceptable given transition animations provide visual continuity
- **Already complete**: AudioManager has full Web Audio API synthesis (ambient loop + 5 SFX), GardenScene has complete event-driven SFX integration via EventBus
- **Key files**: src/scenes/MenuScene.ts, src/scenes/SeedSelectionScene.ts, src/systems/AudioManager.ts (unchanged)

### Clean Up Redundant Dev UI (Issue #243, PR #254)
- **Removed**: `infoText` (developer instruction text), `helpText` (HUD-duplicated stats), standalone `encyclopediaButton` + `encyclopediaButtonText` from GardenScene
- **Updated**: MenuScene version label from stale "v0.1.0 — Sprint 0" to "Flora"
- **Kept**: `showActionMessage()` and `updateInfoText()` as no-op stubs to avoid breaking callers; encyclopedia still accessible via PauseMenu + MenuScene
- **Key files**: src/scenes/GardenScene.ts, src/scenes/MenuScene.ts

### Responsive Dimensions Fix (Issue #248, PR #263)
- **Problem**: DaySummary, PauseMenu, PlantInfoPanel, TutorialOverlay all hardcoded 800x600 dimensions throughout their UI construction
- **Solution**: Replaced all hardcoded dimension values with GAME.WIDTH/GAME.HEIGHT from config, or relative calculations (e.g., `GAME.WIDTH * 0.625`)
- **Impact**: All overlays/panels now center and scale relative to config dimensions. No overflow or clipping with standard 800x600.
- **Changed files**: src/ui/DaySummary.ts, src/ui/PauseMenu.ts, src/ui/PlantInfoPanel.ts, src/ui/TutorialOverlay.ts
- **Convention**: ALL dimensions via GAME.WIDTH/HEIGHT or proportional calculations. Hardcoded pixel values only acceptable for internal spacing (<50px).
- **Key insight**: TypeScript strict mode enforces literal types for numeric fields; changed TutorialOverlay screenWidth/Height from literal types to `number` type annotations.

