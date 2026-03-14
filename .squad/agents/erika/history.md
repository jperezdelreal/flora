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

### Weather System Architecture (PR #74)
Completed issue #49 — split weather events from HazardSystem into dedicated WeatherSystem with 2-day telegraph warnings. Key architectural decisions:

1. **System Separation**: Weather logic (drought, frost, heavy rain) moved from HazardSystem to WeatherSystem. HazardSystem now focused solely on pests. This follows single-responsibility principle and makes weather mechanics more extensible.

2. **2-Day Telegraph Pattern**: All weather events schedule a warning 2 days before activation. WeatherSystem.scheduleWeatherEvents() creates both warning day and start day triggers. Pattern: `warningDay = startDay - 2`.

3. **Event-Driven Warnings**: WeatherSystem emits `weather:warning` event with threat/mitigation data. HazardWarning UI subscribes to display visual banner. This decouples warning UI from system logic.

4. **EventBus Extensions**: Added weather:warning, frost:started/ended, heavy_rain:started/ended events. Ensures all systems can react to weather changes without tight coupling.

5. **UI Layering**: HazardWarning (full-screen telegraphs) → HazardUI (active status banners) → HUD (compact warnings). Three layers of visibility ensure players never miss threats.

6. **Weather Mechanics**: Drought increases water need multiplier (1.5x) and soil drying rate (2x). Frost applies damage to non-frost-resistant plants daily. Heavy Rain locks soil moisture at 100%. All mechanics query WeatherSystem state rather than modifying plant/grid state directly.

7. **Integration Pattern**: GardenScene.onDayAdvance calls both hazardSystem.onDayAdvance (pests) and weatherSystem.onDayAdvance (weather). Frost damage applied via weatherSystem.applyFrostDamage. Clean separation of concerns.

**Build Status**: Zero TypeScript errors. All files follow TLDR comment convention.

### Tool Progression System (PR #233)
Implemented issue #218 — tool progression with tiers and advanced tools. Key decisions:

1. **Data-Driven Tier System**: `ProgressiveToolConfig` defines each tool's tiers with `affectedTiles` offsets and `effectParams`. ToolSystem reads these configs at runtime.

2. **ToolSystem as Central Coordinator**: Subscribes to EventBus (`milestone:unlocked`, `plant:harvested`) and rechecks unlock/upgrade conditions against UnlockSystem progress. Emits `tool:unlocked` and `tool:upgraded`.

3. **Watering Can Tiers**: Basic (1 tile), Improved (cross 5 at 15 harvests), Advanced (3×3 at 40 harvests). Defined as `affectedTiles` offset arrays in config.

4. **New Tools**: Pest Spray (area removal, 10 runs), Soil Tester (reveals soil data, 25 harvests), Trellis (climbing plant +25%, 15 runs). Follow existing validate/execute pattern.

5. **Climbing Trait**: Added `SynergyTrait.CLIMBING` — Pea and Cucumber marked as climbing for trellis interaction.

6. **ToolBar Enhancements**: Locked tools grayed with unlock hints. Tier indicators (★/★★/★★★). Tool selection persists via ToolSystem.

7. **Persistence**: `ToolProgressionSaveData` in save schema. SaveManager extended with `saveTools`/`loadTools`.

**Build Status**: Zero TypeScript errors. Clean Vite production build.

