# Decision: Season Selection & Multi-Season Architecture

**By:** Erika (Systems Dev)
**Issue:** #201
**Date:** 2026-03-16

## Problem
Season was randomly assigned in both SeedSelectionScene and GardenScene independently. Players had no control over which season they played. No multi-season run mode existed.

## Decision: Shared State via SeedSelectionSystem

**Season Data Flow:**
- SeedSelectionSystem stores `selectedSeason` and `multiSeasonMode`
- SeedSelectionScene sets these before transitioning to GardenScene
- GardenScene reads them in init() instead of calling getRandomSeason()
- No changes to SceneManager.transitionTo() API needed

**Rationale:** SeedSelectionSystem is already shared between both scenes (injected via main.ts constructor). Using it as a data bus for season state avoids modifying the scene transition API or introducing a new global store.

## Decision: Multi-Season as In-Scene Transitions

**Multi-season runs transition between seasons within GardenScene** rather than reloading the scene. `advanceMultiSeason()` swaps season config, resets day counter, and re-applies visuals while preserving plants, structures, and score state.

**Rationale:** Full scene reload would destroy plant state, structures, and accumulated score. In-scene transitions keep the garden continuous across seasons — plants survive season changes, which is the core gameplay fantasy.

## Decision: Score Multiplier on ScoringSystem

**ScoringSystem.setScoreMultiplier()** applies a multiplier to the total score in `getScoreBreakdown()`. Multi-season runs get 2× multiplier.

**Rationale:** Applying the multiplier at the system level (not in GardenScene) keeps scoring logic centralized. The multiplier stacks with existing scoring rules cleanly.

## Decision: Season Preference Persistence

**Selected season is persisted to localStorage** (`flora_season_preference`). Loaded on SeedSelectionScene init.

**Rationale:** Players developing strategies for specific seasons shouldn't re-select every time. Low-cost persistence improves repeat player experience.

## Consequences
- ✅ Players choose their season before each run
- ✅ Multi-season mode provides end-game challenge for 30+ run veterans
- ✅ Season-specific seed pools create meaningful strategic choices
- ✅ Daily challenges override season selection (no conflicts)
- ⚠️ SeedSelectionSystem now has UI state responsibility (selectedSeason, multiSeasonMode)
- ⚠️ Constructor signature for SeedSelectionScene is more complex (UnlockSystem param)
