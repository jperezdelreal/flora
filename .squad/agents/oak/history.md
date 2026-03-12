## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### PR #25 Review — Garden UI/HUD (Issue #9)
- **UI component pattern**: All UI classes follow getContainer()/destroy() lifecycle, self-contained with PixiJS Container ownership. This is the established pattern.
- **Keyboard listeners must be stored and removed**: Encyclopedia.ts does this correctly (boundOnKeyDown pattern). GardenScene.ts line 360 does not — flagged as must-fix.
- **Hardcoded 800x600 in UI components**: DaySummary, PauseMenu, PlantInfoPanel, Encyclopedia all hardcode screen dimensions. Config has GAME.WIDTH/GAME.HEIGHT. Track as tech debt.
- **RARITY_COLORS duplicated 3x**: SeedInventory (string), DiscoveryPopup (hex number), Encyclopedia (both). Should consolidate to config/plants.ts.
- **UI barrel export**: src/ui/index.ts re-exports all UI components. New components must be added here.
- **DaySummary fade**: Uses raw requestAnimationFrame, bypassing game loop/pause. DiscoveryPopup uses update(deltaMs) pattern — prefer that.
- **Bonus scope**: PR delivered DiscoveryPopup, Encyclopedia, HazardUI beyond issue scope. Good initiative but monitor scope creep in future sprints.
