# Decisions — FLORA

> Canonical decision ledger. Append-only.

---

## 2026-03-13T20:44Z: User directive

**By:** joperezd (via Copilot)  
**Status:** Active  

User directive: El Lead (Oak) debe priorizar la definicion de estrategia y asegurar un roadmap potente. Enfoque en vision estrategica, no solo tareas incrementales.

**Captured for:** Team memory and strategic alignment

---

## 2026-03-11: Strategic Roadmap for Post-Sprint 0 Development

**By:** Oak (Lead / Chief Architect)  
**Status:** Active  

Flora is a **cozy gardening roguelite** where every run should feel distinct, meaningful, and rewarding. Sprint 0 complete — foundation solid. Current state: playable tech demo lacking replayability, strategic depth, and progression clarity.

### Core Strategic Vision

Players will return to Flora if runs feel *different enough* to explore new strategies, *challenging enough* to require thought, and *rewarding enough* to see progress accumulate.

### Roadmap (8 Items)

1. **Audio System** — Foundation audio (cozy pillar)
2. **Unlock System** — Progression visibility  
3. **Randomized Seed Selection** — Run variety & replayability  
4. **Run Scoring & Milestones** — Goal clarity & feedback  
5. **Enhanced Hazard Mechanics** — Puzzle design, telegraphed threats  
6. **Seed Synergies & Polyculture Bonus** — Skill ceiling & mastery  
7. **Persistent Save System** — Session retention infrastructure  
8. **Advanced Features (Deferred)** — Garden expansion, mobile, cloud sync (post-roadmap)

### Key Decisions

- **Deterministic Run Seeding:** All randomness tied to seed value for reproducibility
- **Event-Driven Scoring:** EventBus integration, decoupled from individual systems
- **Parallelization:** Items 2-3-4 → Phase 1; Items 5-6-7 → Phase 2; Item 8 → Phase 3 (serial)
- **Cozy-First Philosophy:** No frustration, hazards as puzzles, failure teaches not punishes

**Success Criteria:** 3+ meaningfully different runs, players articulate goals, 2x score gap (skill expression), multi-session play, hazards feel like puzzles.

**Document Owner:** Oak | **Status:** Active — guides work until reassessed

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
