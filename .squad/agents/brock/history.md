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
