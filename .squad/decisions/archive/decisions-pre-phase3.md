# Archived Decisions — Pre-Phase 3

Archived from decisions.md on 2026-03-14 when file exceeded 5KB threshold.

---

## 2026-03-13T21:55Z: Synergy System Design

**By:** Erika (Systems Dev)  
**Status:** Implemented (PR #67)  

### Context

Issue #51 requested adjacency bonuses and polyculture detection to reward strategic plant placement. The system needed to:
- Support multiple synergy types (shade, nitrogen, pest deterrent, polyculture)
- Integrate with existing PlantSystem, HazardSystem, and ScoringSystem
- Provide visual feedback and tutorial on first activation
- Scale to support future synergy types

### Key Decisions

1. **Synergy State Management**: Store active synergies directly in Plant entity state (`activeSynergies: Set<string>`, `growthSpeedMultiplier: number`)
   - Rationale: Co-locates synergy state with plant data, simplifies serialization and PlantSystem integration

2. **Recalculation Timing**: Recalculate synergies at day advance, not per-frame
   - Rationale: Synergies only affect growth (once per day); avoids wasteful 60 FPS checks

3. **Pest Deterrent Integration**: SynergySystem provides `isPestDeterrentActive(x, y, allPlants)` query method for HazardSystem
   - Rationale: Keeps HazardSystem as single source of truth; avoids circular dependencies

4. **Growth Speed Stacking**: Multiple synergies stack multiplicatively (shade 1.15x + polyculture 1.10x = 1.265x)
   - Rationale: Encourages creative arrangements; matches player intuition

5. **Visual Feedback**: Emit `synergy:activated` event per plant-synergy pair, display tutorial on first activation
   - Rationale: Decouples calculation from UI; allows multiple UI elements to react

### Implementation Summary

**Files Created**:
- `src/config/synergies.ts` — Synergy trait enum, bonus definitions
- `src/systems/SynergySystem.ts` — Adjacency calculation and logic
- `src/ui/SynergyTooltip.ts` — Tutorial and hover info

**Files Modified**: Plant.ts, plants.ts (synergy traits), PlantSystem.ts, HazardSystem.ts, ScoringSystem.ts, EventBus.ts, GardenScene.ts

**Status**: ✅ Zero TypeScript errors, clean integration, PR #67 merged

**Deferred**: Visual glow effect, Encyclopedia synergy hints, negative synergies (per GDD)

---

## 2025-01-30: Enhanced Hazard Mechanics Design

**By:** Erika (Systems Dev)  
**Status:** Partially Implemented  

### Context

Issue #49 requires enhanced hazard mechanics with 3 pest types, telegraphed weather, and puzzle-based mitigation.

### Key Decisions

1. **Separate Pest Entity**: Created typed `Pest` entity with behavior-specific types (Aphids spread, Slugs target young, Beetles target mature)
   - Rationale: Enables compile-time safety and clearer behavior modeling

2. **Plant-Based Pest Resistance**: Certain plants naturally repel specific pest types (Mint→Aphids, Lavender→Slugs, Sunflower→Beetles)
   - Rationale: Creates strategic depth and teaches companion planting implicitly

3. **Weather System Separation**: WeatherSystem designed but not yet integrated (backward-compat stubs added)
   - Issue: GardenScene tightly coupled to old HazardSystem API
   - Resolution: Follow-up PR required

### Implementation Status

✅ Pest entity with 3 types, Pest resistance configs, Updated HazardSystem, EventBus events
⚠️ WeatherSystem designed but not integrated, HazardWarning/HazardTooltip UI designed but not integrated
❌ Full GardenScene integration (requires separate PR)

**Follow-Up Required**: Issue #49 follow-up for WeatherSystem and UI integration
