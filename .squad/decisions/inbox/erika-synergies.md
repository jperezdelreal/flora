# Decision: Synergy System Design

**Date**: 2026-03-13  
**Author**: Erika (Systems Dev)  
**Status**: Implemented (PR #67)  

## Context

Issue #51 requested adjacency bonuses and polyculture detection to reward strategic plant placement. The system needed to:
- Support multiple synergy types (shade, nitrogen, pest deterrent, polyculture)
- Integrate with existing PlantSystem, HazardSystem, and ScoringSystem
- Provide visual feedback and tutorial on first activation
- Scale to support future synergy types

## Decision

Implemented a dedicated SynergySystem with the following architecture:

### 1. Synergy State Management
**Decision**: Store active synergies directly in Plant entity state (`activeSynergies: Set<string>`, `growthSpeedMultiplier: number`)

**Rationale**:
- Co-locates synergy state with plant data, avoiding parallel data structures
- Simplifies serialization if synergies need to persist across save/load
- Allows PlantSystem to directly apply bonuses during growth calculation

**Alternatives Considered**:
- External map in SynergySystem: Rejected due to synchronization complexity
- Separate SynergyState entity: Rejected as over-engineered for MVP

### 2. Recalculation Timing
**Decision**: Recalculate synergies at day advance, not per-frame

**Rationale**:
- Synergies only affect growth, which happens once per day
- Avoids unnecessary computation (60 FPS → 1 calculation per 30 seconds)
- Event-driven trigger (`plant:created`, `plant:harvested`) ensures updates when adjacency changes

**Alternatives Considered**:
- Per-frame recalculation: Rejected as wasteful
- Manual recalculation calls: Rejected as error-prone (easy to forget)

### 3. Pest Deterrent Integration
**Decision**: SynergySystem provides `isPestDeterrentActive(x, y, allPlants)` query method for HazardSystem

**Rationale**:
- Keeps HazardSystem as the single source of truth for pest spawning
- Avoids circular dependency (SynergySystem doesn't need HazardSystem reference)
- Synergy logic remains testable in isolation

**Alternatives Considered**:
- SynergySystem subscribes to pest spawn events and cancels them: Rejected as violates single responsibility
- HazardSystem directly checks plant traits: Rejected as duplicates synergy logic

### 4. Growth Speed Stacking
**Decision**: Multiple synergies stack multiplicatively (e.g., shade 1.15x + polyculture 1.10x = 1.265x total)

**Rationale**:
- Natural implementation: `multiplier *= bonus`
- Encourages creative plant arrangements (3+ synergies = significant boost)
- Matches player intuition ("more synergies = better")

**Alternatives Considered**:
- Additive stacking: Rejected as less intuitive (1.15 + 1.10 = 2.25 doesn't feel right)
- Cap maximum multiplier: Deferred to future balancing if needed

### 5. Visual Feedback
**Decision**: Emit `synergy:activated` event for each plant-synergy pair, display tutorial on first activation

**Rationale**:
- Decouples synergy calculation from UI rendering
- Allows multiple UI elements to react (glow effect, tooltip, scoring)
- Tutorial pattern reusable for other first-time mechanics

**Alternatives Considered**:
- SynergySystem directly manipulates UI: Rejected as violates separation of concerns
- Persistent synergy indicator: Deferred to future UI polish (glow effect not yet implemented)

## Implementation Notes

**Files Created**:
- `src/config/synergies.ts`: Synergy trait enum, bonus definitions, config constants
- `src/systems/SynergySystem.ts`: Synergy calculation and adjacency logic
- `src/ui/SynergyTooltip.ts`: Tutorial and hover info display

**Files Modified**:
- `src/entities/Plant.ts`: Added synergy state fields and methods
- `src/config/plants.ts`: Added `synergyTraits` to 6 plant configs
- `src/systems/PlantSystem.ts`: Integrated synergy recalculation before day advance
- `src/systems/HazardSystem.ts`: Integrated pest deterrent check
- `src/systems/ScoringSystem.ts`: Track synergy activation count (for future milestone)
- `src/core/EventBus.ts`: Added synergy events
- `src/scenes/GardenScene.ts`: Wired up SynergySystem and SynergyTooltip

**Build Status**: ✅ Zero TypeScript errors, clean integration

## Future Considerations

1. **Visual Glow Effect**: Not implemented in MVP. Add to plant rendering when sprite system exists.
2. **Negative Synergies**: Explicitly deferred per GDD ("no negative interactions in MVP").
3. **Synergy Scoring**: Currently only tracked in stats. Consider milestone for "Master Gardener: Activate 50+ synergies".
4. **Encyclopedia Hints**: PlantConfig now has `synergyTraits`, but Encyclopedia UI doesn't display them yet. Add in future polish pass.

## Team Impact

**Oak (Lead)**: Approve PR #67 after reviewing synergy calculation efficiency  
**Brock (Data/Persistence)**: No changes to save schema (synergies don't persist between runs)  
**Riley (UI/UX)**: Future work: glow effect on plants with active synergies  

## Success Criteria

- ✅ Adjacency bonuses (shade, nitrogen) implemented
- ✅ Polyculture detection (3+ types)
- ✅ Pest deterrent radius check
- ✅ Tutorial tooltip on first synergy
- ✅ Zero TypeScript errors
- ✅ EventBus integration for scoring
- ⏳ Visual indicators (glow effect) - deferred to future PR
- ⏳ Encyclopedia synergy hints - deferred to future PR
