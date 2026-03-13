# Decision: Tutorial & Onboarding System Design

**By:** Misty (Web UI Dev)  
**Status:** Implemented (PR #99)  
**Date:** 2025-07-22

## Context

Issue #91 requested a tutorial & onboarding system to guide new players through Flora's 8+ game systems. The GDD states "No tutorial needed for MVP features" but we're past MVP, and the number of mechanics (planting, watering, harvesting, pests, synergies, weather, scoring, encyclopedia) warrants guided onboarding.

## Key Decisions

1. **Event-driven step advancement**: Tutorial steps that require player action (plant, water, harvest) auto-advance via EventBus events rather than polling or timers. Steps without completion events advance on click.
   - Rationale: Feels natural — the player learns by doing, not by reading. No per-frame overhead.

2. **Separate guided tutorial from contextual hints**: Guided tutorial runs once on first launch (7 steps). Contextual hints fire independently on first encounter of each mechanic and persist across sessions.
   - Rationale: Players who skip the tutorial still get hints. Hints are useful for mechanics discovered later (synergies, frost).

3. **localStorage-only persistence (no SaveManager integration)**: Tutorial state uses its own `flora_tutorial` localStorage key directly rather than going through SaveManager.
   - Rationale: Tutorial state is orthogonal to game saves — it shouldn't be affected by "reset all data" or save/load cycles. Cloud sync can incorporate it later if needed.

4. **How to Play as overlay, not a separate scene**: The How to Play reference is a PixiJS Container overlay within GardenScene, accessible from PauseMenu.
   - Rationale: Keeps it lightweight, no scene transition needed, player stays in context.

5. **Cozy tone in all hint messages**: Every hint is written as a friendly suggestion, not an instruction. Uses emoji for warmth.
   - Rationale: Matches Flora's cozy-first philosophy per GDD. Hints should feel like a gardener friend whispering tips.

## What's Not Included

- **Highlight/spotlight effect**: The overlay dims the screen but doesn't spotlight specific UI elements (e.g., toolbar). This could be added later with a mask.
- **Tutorial for tool selection**: The current guided steps mention tools but don't force-select them. Future: could lock toolbar to only the relevant tool during tutorial steps.
- **Audio integration**: No tutorial-specific sounds yet. Could add a soft chime for hint display.
