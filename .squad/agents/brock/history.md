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
