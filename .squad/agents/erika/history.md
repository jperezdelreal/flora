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

### PR Review Feedback Loop (PR #25)
Oak's architecture review caught the listener leak during code review before merge. The fix was applied immediately, demonstrating the value of peer review in catching runtime issues that TypeScript cannot detect. Always verify that event listeners, timers, and other side effects have corresponding cleanup in destroy/unmount methods.

### Synergy System Architecture (PR #67)
Implemented seed synergies and polyculture bonuses for issue #51. Key architectural decisions:

1. **Plant State Enrichment**: Added `activeSynergies: Set<string>` and `growthSpeedMultiplier: number` to PlantState rather than tracking externally. This keeps synergy state co-located with the plant entity.

2. **Synergy Calculation Timing**: Synergies recalculate at day advance (in PlantSystem.advanceDay) rather than per-frame. This is efficient because adjacency bonuses only matter when growth advances.

3. **Event-Driven Recalculation**: SynergySystem subscribes to `plant:created` and `plant:harvested` events to schedule recalculation. Uses a debounce flag to avoid multiple recalculations in a single frame.

4. **Pest Deterrent Integration**: HazardSystem.trySpawnPestOnPlant now accepts optional plant array and checks SynergySystem.isPestDeterrentActive before spawning. This keeps pest logic centralized while respecting synergies.

5. **Growth Speed Application**: Plant.advanceDay now uses `this.state.daysGrown += this.state.growthSpeedMultiplier` instead of `+= 1`. This allows multiple synergy bonuses to stack multiplicatively.

6. **Tutorial Pattern**: First synergy activation triggers `synergy:tutorial` event, which SynergyTooltip listens to. Tooltip auto-hides after 5 seconds. This pattern can be reused for other first-time mechanics.

**Build Status**: Zero TypeScript errors. All systems integrated cleanly via dependency injection in GardenScene.init().

