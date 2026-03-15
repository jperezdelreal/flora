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

### Demo Scaffolding Removal (PR #237)
Completed issue #237 — removed all hardcoded demo/test scaffolding from GardenScene.init(). Key changes:

1. **Removed plantDemoPlants() method**: Was planting seasonal plants at hardcoded tile slots (2,2), (2,4), (4,3), (5,5) on every init and season start.

2. **Removed demo state injection in init()**: Hardcoded basil at tile (2,3) with forced pest spawn, tile (4,5) forced to PEST state with low soil quality, simulated drought via hazardSystem.onDayAdvance(5), and soil quality variation loop overriding natural defaults.

3. **Removed plantDemoPlants() call in startNewSeason()**: New seasons now start clean without pre-planted crops.

4. **Cleaned unused import**: Removed `getPlantsBySeason` import that was only used by the deleted demo method.

**Result**: Garden starts empty as designed. Players plant seeds themselves via SeedSelectionScene flow. All systems (grid, plant, hazard, weather, synergy) still initialize correctly.

**Build Status**: Zero TypeScript errors. Clean Vite production build.

### Sprint 3 Cleanup Verification (Issue #250)
Verified that Sprint 3 P0/P1 tasks from issue #250 are already complete in main:

1. **P0 — Demo Scaffolding Removal**: Already completed in PR #237 (commit 0f515c7). GardenScene.init() has no hardcoded demo plants, pests, or drought. Garden starts empty as designed.

2. **P1 — SeedInventory Wiring**: Already completed in PR #241/242. SeedInventory displays seeds from actual run seed pool via `seedSelectionSystem.getCurrentPool()` (lines 340-344 in GardenScene.ts).

**No work needed**: All requested changes already merged to main. Zero TypeScript errors on verification.

### Game Flow Clarity System (PR #258)
Implemented issue #250 Sprint 3 P1 — game flow clarity for new players. Creator feedback: "player doesn't understand what to do within 30 seconds."

**Problem Diagnosis:**
1. Tutorial didn't explain action/day cycle mechanics
2. No visual feedback when actions are consumed
3. Contextual hints were phase-based, not action-aware
4. Day advance messages lacked actionable guidance

**Solution Architecture:**
1. **Tutorial Rewrite**: Enhanced `TUTORIAL_STEPS` to explicitly teach:
   - 3 actions per day system
   - Each tool use costs 1 action
   - Day advances when actions run out
   - Movement is FREE (no action cost)
   - Plants grow at day start

2. **Visual Feedback Loop**: 
   - Added `action:consumed` event to EventMap
   - PlayerSystem emits event after `consumeAction()`
   - HUD subscribes and triggers `flashActionConsumed()` animation
   - Action counter flashes yellow highlight for 300ms on tool use

3. **Action-Aware Hints**: 
   - `getContextualHint()` now prioritizes action count over phase
   - Shows "You have X actions left!" when actions > 1
   - Shows "Last action! Use it wisely" when actions === 1
   - Shows "No actions left — day will advance soon" when actions === 0

4. **Enhanced Day Messaging**:
   - `showDayAdvanceSummary()` now shows:
     - Plant count and growth status
     - Harvest-ready count with emoji
     - Actionable next step ("Keep watering" / "Plant some seeds")
     - Explicit reminder: "You have 3 actions"

5. **How to Play Reorg**:
   - Moved "The Day Cycle" section to first position
   - Emphasized action costs and day mechanics
   - Clarified movement is free

**EventBus Extensions:**
- `action:consumed`: { actionsRemaining, maxActions } — fired after PlayerSystem.consumeAction()

**Player Entity Update:**
- Added `getMaxActions()` getter for UI display consistency

**Integration Points:**
- GardenScene subscribes to `action:consumed` and calls `hud.flashActionConsumed()`
- TutorialSystem triggers contextual hint after tutorial completion
- HUD.updatePhaseTransition() animates both phase flash and action flash

**Outcome:**
New players now understand the core game loop within 30 seconds:
- Select tool → use on tile (costs 1 action) → repeat until 0 actions → day advances → plants grow → get 3 new actions

**Build Status**: Zero TypeScript errors. Clean Vite build.

### Rest Mechanic Implementation (PR #261)
Implemented issue #244 — rest mechanic for strategic action management. Key decisions:

1. **PlayerSystem.rest() Method**: Central rest logic in PlayerSystem, not Player entity. Consumes all remaining actions, applies soil boost, advances day, emits event, triggers day advance callback.

2. **Soil Quality Boost**: Rest applies +5 soil quality to ALL tiles via `grid.getAllTiles()`. Strategic trade-off: act now vs preserve soil for tomorrow.

3. **RestButton UI Component**: Standalone button component next to ToolBar. Cozy warm green styling (matches START_BUTTON_GREEN). Hover shows hint with benefits. Disabled when no actions remain.

4. **Event-Driven Integration**: `player:rested` event with `{ soilBoost, day }` payload. ScoringSystem subscribes and awards +5 points for efficient play. No penalty for resting.

5. **Dynamic Button State**: GardenScene.update() checks `player.hasActionsRemaining()` each frame and calls `restButton.setEnabled()`. Button grayed out when actions = 0.

6. **UI Positioning**: RestButton positioned at `screenWidth/2 + 220` to the right of ToolBar. Both repositioned on window resize for responsive layout.

7. **Visual Feedback**: HUD.setHint() shows "🌙 You rest and prepare for tomorrow..." when rest is used. Day advance summary shows as normal.

**Integration Points:**
- EventBus: `player:rested` event added to EventMap
- PlayerSystem: `rest()` method consumes actions, boosts soil, advances day
- ScoringSystem: Subscribes to `player:rested`, awards +5 points
- GardenScene: Instantiates RestButton, handles click, updates enabled state per frame
- UI exports: RestButton exported from src/ui/index.ts

**Build Status**: Zero TypeScript errors. Clean Vite build.

