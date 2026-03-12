## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### Keyboard Listener Cleanup Pattern (PR #25)
Fixed keyboard listener leak in GardenScene.ts (commit b7c4496). The issue was that anonymous functions passed to `window.addEventListener('keydown', ...)` cannot be removed later, causing listener accumulation on scene transitions.

**Pattern followed (from Encyclopedia.ts):**
1. Declare bound handler as class field: `private boundOnKeyDown!: (e: KeyboardEvent) => void;`
2. Assign handler before adding listener: `this.boundOnKeyDown = (e: KeyboardEvent) => { ... };`
3. Add listener using the field: `window.addEventListener('keydown', this.boundOnKeyDown);`
4. Remove in destroy(): `window.removeEventListener('keydown', this.boundOnKeyDown);`

This ensures proper cleanup and prevents ghost handlers on scene transitions.
