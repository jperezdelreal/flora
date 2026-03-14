## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### Event Listener Cleanup Pattern (PR #25 review fix)
- **Architecture**: Scenes must clean up their own event listeners in `destroy()` to prevent accumulation on scene transitions
- **Pattern**: Store bound function reference as class field (e.g., `private boundOnKeyDown: (e: KeyboardEvent) => void`), use it in `addEventListener`, and `removeEventListener` in `destroy()`
- **Reference implementation**: `src/ui/Encyclopedia.ts` lines 35, 114-124, 385 shows the correct pattern
- **Files touched**: `src/scenes/GardenScene.ts` (keyboard shortcuts cleanup), `src/ui/SeedInventory.ts` (unused import removal)

### Unlock System & Meta-Progression (Issue #33, PR #44)
- **Architecture**: UnlockSystem follows EncyclopediaSystem localStorage patterns for persistence
- **Pattern**: Milestone tracking with typed events via EventBus; UI components subscribe to unlock events
- **Key files created**:
  - `src/systems/UnlockSystem.ts` — Core unlock logic with localStorage persistence
  - `src/config/unlocks.ts` — Milestone definitions for 3 progression types (harvested, matured, diversity)
  - `src/ui/UnlockNotification.ts` — Toast-style popup following DiscoveryPopup pattern
- **Key files updated**:
  - `src/ui/HUD.ts` — Added unlock progress indicator at bottom (expanded height to 90px)
  - `src/ui/ToolBar.ts` — Added locked/unlocked states with lock icons, unlock animations (6-pulse highlight)
  - `src/systems/PlantSystem.ts` — Fixed to emit plant:matured events when reaching MATURE stage
  - `src/core/EventBus.ts` — Added plant:matured and milestone:unlocked events
- **Conventions applied**: All comments start with "TLDR:", localStorage key pattern `flora_*`, container lifecycle (getContainer/destroy)
- **Integration notes**: System ready for GardenScene integration; all tools start unlocked by default (MVP behavior)
- **Milestone thresholds**: Tier 1: 5 plants, Tier 2: 15 plants, Tier 3: 30 plants (tuned for first 10 runs per GDD §7)

### Title Screen & Main Menu (Issue #117, PR #144)
- **Architecture**: MenuScene implements Scene interface with state machine (title → main → settings → credits)
- **Pattern**: Layer-based rendering — each menu state has its own Container, toggled via `visible` property
- **Key file created**:
  - `src/scenes/MenuScene.ts` — Full menu scene: title screen, main menu, settings panel, credits
- **Key files updated**:
  - `src/scenes/BootScene.ts` — Transitions to 'menu' instead of 'seed-selection'
  - `src/scenes/index.ts` — Exports MenuScene
  - `src/main.ts` — Imports and registers MenuScene with SaveManager dependency
  - `src/systems/AudioManager.ts` — Added `getVolumes()` for settings panel to read current levels
- **Features**:
  - Title screen with bloom/glow logo, studio credit fade-in, "press any key" prompt
  - Firefly particles via ParticleSystem reuse (negative gravity, warm colors)
  - 5 menu items: New Run → SeedSelection, Continue → Garden (grayed if no save), Encyclopedia, Achievements, Settings
  - Settings: 4 volume sliders (draggable + keyboard), colorblind toggle, credits page
  - Full keyboard navigation: arrows, Tab, Enter, Esc across all states
  - Settings persist via SaveManager (SettingsSaveData with colorblindMode)
- **Conventions applied**: All comments "TLDR:", bound listener cleanup in destroy(), container lifecycle
- **Note**: Encyclopedia and Achievements menu items are placeholder — scenes not yet registered

