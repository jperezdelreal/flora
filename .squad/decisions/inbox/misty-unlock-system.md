# Decision: Unlock System Architecture Pattern

**Date**: 2026-03-13  
**Agent**: Misty (Web UI Dev)  
**Context**: Issue #33 — Unlock System & Meta-Progression UI

## Decision
Implement unlock system using localStorage persistence following the EncyclopediaSystem pattern, with milestone tracking decoupled from UI via EventBus.

## Rationale
1. **localStorage pattern**: EncyclopediaSystem.ts provided proven pattern for meta-progression persistence
2. **EventBus decoupling**: Unlock events allow UI components to subscribe independently without tight coupling
3. **Toast-style notifications**: DiscoveryPopup.ts pattern reused for consistent visual language
4. **HUD expansion**: Increased HUD height from 60px to 90px to accommodate unlock progress indicator
5. **Tool locking**: All tools start unlocked (MVP behavior), but infrastructure supports locked states for future progression

## Files Created
- `src/systems/UnlockSystem.ts` — Core unlock logic
- `src/config/unlocks.ts` — Milestone definitions
- `src/ui/UnlockNotification.ts` — Toast popup component

## Files Modified
- `src/ui/HUD.ts` — Added unlock progress bar
- `src/ui/ToolBar.ts` — Added locked/unlocked visual states with animations
- `src/systems/PlantSystem.ts` — Fixed to emit plant:matured events
- `src/core/EventBus.ts` — Added plant:matured and milestone:unlocked events

## Key Patterns
- **localStorage key**: `flora_unlock_progress` (follows `flora_*` convention)
- **Milestone types**: plants_harvested, plants_matured, plant_diversity
- **Unlock animation**: 6-pulse green highlight on newly unlocked tools
- **Progress display**: `"Next unlock: 3/5"` format with golden progress bar

## Integration Notes
- UnlockSystem ready for GardenScene integration via event subscription
- All tools default unlocked for MVP; lock behavior tested and working
- Milestone thresholds tuned for 10-run progression curve (GDD §7)

## Team Impact
Other agents integrating with unlock system should:
1. Subscribe to `milestone:unlocked` events to react to unlocks
2. Call `unlockSystem.recordHarvest()` / `recordMaturity()` / `recordDiscovery()` to update progress
3. Use `unlockSystem.getNextMilestone(type)` to display progress in UI
4. Follow the "TLDR:" comment convention for all unlock-related code
