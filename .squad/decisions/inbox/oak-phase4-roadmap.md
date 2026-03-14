# Decision: Phase 4 Roadmap — From Prototype to Product

**By:** Oak (Lead / Chief Architect)
**Date:** 2026-03-14
**Status:** Active
**Issue:** #161 (closed)

## Context

Phases 1-3 complete (17 items). Flora is a feature-complete prototype with 22 plants, full roguelite loop, synergies, achievements, daily challenges, touch support, accessibility, and persistence. But it feels like a tech demo — PixiJS primitives, placeholder menu buttons, missing core GDD mechanics, and cosmetic rewards that never render.

User directive: "El Lead (Oak) debe priorizar la definicion de estrategia y asegurar un roadmap potente. Enfoque en vision estrategica, no solo tareas incrementales."

## Strategic Thesis

Phase 4 must prove "I want to come back tomorrow." Replayability = variety × depth × identity.

- **Variety:** Season selection gives agency. Weeds create unpredictable micro-decisions. Multi-season runs for veterans.
- **Depth:** Tool progression changes how you play over time. Compost creates resource loops. Advanced tools enable new strategies.
- **Identity:** Procedural visuals make Flora screenshot-worthy. Cosmetic rewards make progression visible. The garden reflects your mastery.

## Decisions

### 1. Six items, three vectors
Variety (items 2, 6), Depth (items 2, 3), Identity (items 4, 5), UX completion (item 1). Balanced across all team members.

### 2. EncyclopediaScene/AchievementsScene as full scenes, not MenuScene substates
MenuScene already has 4 states (title/main/settings/credits). Adding more creates complexity. Full scenes are cleaner, independently testable, and can share background rendering via a common pattern.

### 3. WeedSystem follows existing system architecture
EventBus subscriber, update(dt), GardenScene wiring. No architectural innovation needed — proven pattern.

### 4. ToolSystem centralizes tool logic
Tool effects are currently inline in GardenScene interaction handling. ToolSystem extracts this into a dedicated system with tier-based dispatch.

### 5. PlantRenderer as dedicated rendering system
Separates visual rendering from game logic. Procedural sprites cached per (plantType, growthStage) tuple. Performance: no runtime generation during gameplay.

### 6. Multi-season runs extend GardenScene state, not new scene
Garden persists across season transitions. Only hazards, weather, and palette change. This avoids scene destruction/reconstruction and keeps all garden state intact.

### 7. Cosmetics extend SettingsSaveData
Equipped cosmetics (active seed skin, active HUD theme) stored alongside accessibility preferences in the existing settings save slot.

## Deferred to Phase 5

- Second garden plot (GDD §7 Unlock C at 50 runs)
- Rest mechanic (GDD §3: skip the day, gather energy)
- Player character sprite
- Cloud sync
- Bundle optimization (rollup-plugin-visualizer)
- Reduced motion per-system opt-in
- High contrast visual implementation

## Issues Created

| # | Title | Owner |
|---|-------|-------|
| #192 | Encyclopedia & Achievements Standalone Scenes | squad:misty |
| #193 | Weed & Compost Gameplay Loop | squad:erika |
| #194 | Tool Progression & Advanced Tools | squad:erika |
| #196 | Procedural Garden Visuals | squad:sabrina |
| #198 | Cosmetic Reward Application | squad:misty |
| #201 | Season Selection & Multi-Season Runs | squad:erika |

## Parallelization

- **Wave 1 (parallel):** #192 (Misty) + #196 (Sabrina) + #193 (Erika) — no shared files
- **Wave 2 (after #193):** #194 (Erika) — shares tool config with weed/compost work
- **Wave 3 (after #192):** #198 (Misty) — needs AchievementsScene for preview
- **Independent:** #201 (Erika) — can start anytime, no dependencies

## Success Criteria

- Flora looks like an actual game (procedural visuals, not primitives)
- All main menu buttons are functional (no placeholders)
- 3+ meaningful tool upgrades that change gameplay strategy
- Weeds/compost create 5+ micro-decisions per run
- Cosmetic rewards visible in-game after achievement unlock
- Season choice creates 4 distinct run experiences
- Multi-season mode feels like "endgame content"
