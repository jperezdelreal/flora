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
