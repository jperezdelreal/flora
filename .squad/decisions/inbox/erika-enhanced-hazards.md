# Enhanced Hazard Mechanics Design

**Date:** 2025-01-30
**By:** Erika (Systems Dev)
**Status:** Partially Implemented

## Context
Issue #49 requires enhanced hazard mechanics with 3 pest types, telegraphed weather, and puzzle-based mitigation.

## Design Decisions

### 1. Separate Pest Entity
Created typed `Pest` entity (separate from generic `Hazard`) with behavior-specific types:
- **Aphids:** Spread to adjacent tiles (30% chance/day)
- **Slugs:** Target young plants only (sprout/growing)
- **Beetles:** Target mature plants only

**Rationale:** Typed entities enable compile-time safety and clearer behavior modeling vs. generic hazard data.

### 2. Plant-Based Pest Resistance
Certain plants naturally repel specific pest types:
- Mint/Basil → Aphids
- Lavender → Slugs
- Sunflower/Marigold → Beetles

**Rationale:** Creates strategic depth (polyculture bonus) and teaches players about companion planting without explicit tutorial.

### 3. Weather System Separation (Not Yet Integrated)
Designed WeatherSystem to handle drought/frost/rain separate from pest logic.

**Issue:** GardenScene tightly coupled to old HazardSystem API.
**Resolution:** Added backward-compat stubs. Full integration requires follow-up PR.

## Implementation Status
✅ Pest entity with 3 types
✅ Pest resistance configs in plants
✅ Updated HazardSystem for new pest behaviors
✅ EventBus events for hazard:overcome tracking
⚠️ WeatherSystem designed but not integrated
⚠️ HazardWarning/HazardTooltip UI designed but not integrated
❌ GardenScene integration (requires separate PR)

## Follow-Up Required
- Issue #49 follow-up: Integrate WeatherSystem into GardenScene
- Add HazardWarning/HazardTooltip UI components
- Wire up weather event telegraphing (2-day warnings)
- Test pest spreading mechanics with adjacency checks
