# Decision: Sprint 2 Planning — "Depth & Identity"

**By:** Oak (Lead / Chief Architect)  
**Date:** 2025-07-25  
**Status:** Active  
**Meta Issue:** #223

## Context

Sprint 1 "Wow Factor and Deploy" delivered all 7 issues: plant growth animations (#197), harvest particle effects (#199), smooth scene transitions (#200), seasonal color palettes (#202), procedural audio (#203), GitHub Pages deployment (#204), and encyclopedia visual polish (#205). Board was empty. Ralph triggered automated sprint planning ceremony.

Phase 4 roadmap has 6 items. Sprint 1 covered visual polish sub-tasks. Sprint 2 must now deliver the **actual features** those items describe.

## Decision

Sprint 2 covers 4 of 6 Phase 4 roadmap items with 7 issues:

### Issues Created

| # | Title | Owner | Roadmap Item |
|---|-------|-------|-------------|
| #215 | Encyclopedia standalone scene | Misty | §1 |
| #216 | Achievements standalone scene | Misty | §1 |
| #217 | Weed & compost gameplay loop | Erika | §2 |
| #218 | Tool progression & advanced tools | Erika | §3 |
| #219 | Procedural plant rendering | Sabrina | §4 |
| #220 | Tile & structure visual identity | Sabrina | §4 |
| #221 | Engine infrastructure (cache, pool, audio) | Brock | Cross-cutting |

### Parallelization

- Track A: #215 + #216 (Misty) — independent
- Track B: #217 + #218 (Erika) — share tools.ts
- Track C: #219 + #220 (Sabrina) — share visual language
- Track D: #221 (Brock) — ideally lands first for cache/pool

### Deferred to Sprint 3

- **§5 Cosmetic Reward Application** — depends on #216 AchievementsScene for reward preview
- **§6 Season Selection & Run Variety** — independent but lower priority; can start after core depth features land

## Rationale

- **All team members active:** Brock, Erika, Misty, and Sabrina each have meaningful, domain-appropriate work. No one sits idle.
- **Depth before cosmetics:** Weeds and tools add the decision-making layer Flora needs for replayability. Cosmetic rewards are satisfying only when there's depth to reward.
- **Identity before variety:** Procedural visuals give Flora its visual soul. Season selection adds variety but means less if the garden still looks like colored rectangles.
- **Engine first:** Brock's SpriteCache enables Sabrina's renderers to be performant from day one. Pool integration reduces GC pressure across all particle effects.

## Success Criteria

- Encyclopedia and Achievements accessible from main menu (no more placeholder `break;`)
- Weeds create gentle urgency; compost cycle functional
- At least 2 tool tiers functional; 1+ new tool unlockable
- All 22 plants visually distinct at mature stage
- No FPS regression below 55 FPS with new rendering
- 4+ new SFX for weed/compost/tool interactions
