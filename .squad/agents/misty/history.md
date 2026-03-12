## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### Event Listener Cleanup Pattern (PR #25 review fix)
- **Architecture**: Scenes must clean up their own event listeners in `destroy()` to prevent accumulation on scene transitions
- **Pattern**: Store bound function reference as class field (e.g., `private boundOnKeyDown: (e: KeyboardEvent) => void`), use it in `addEventListener`, and `removeEventListener` in `destroy()`
- **Reference implementation**: `src/ui/Encyclopedia.ts` lines 35, 114-124, 385 shows the correct pattern
- **Files touched**: `src/scenes/GardenScene.ts` (keyboard shortcuts cleanup), `src/ui/SeedInventory.ts` (unused import removal)
