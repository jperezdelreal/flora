# Decision: Phase 2 Roadmap — Polish & Depth

**By:** Oak (Lead / Chief Architect)
**Date:** 2025-07-25
**Status:** Active
**Issue:** #73

## Context

Phase 1 roadmap (8 items) is fully delivered. Flora now has a complete roguelite core loop: seasonal themes, audio, unlocks, randomized seeds, run scoring, enhanced hazards, synergies, and persistent saves. The game is mechanically sound but lacks the tactile polish, accessibility, and long-tail engagement hooks needed to retain players.

## Strategic Assessment

Phase 1 answered: "Is the game mechanically interesting?" — Yes.
Phase 2 must answer: "Does the game *feel* cozy and invite players to return?"

The GDD's Pillar 1 ("Cozy but Intentional") demands that every action feels satisfying. Current state: actions are functional but lack visual/audio feedback polish. The GDD describes water ripples, harvest pops, plant sway, pest crawl animations — none of which exist yet. A cozy game that doesn't *feel* cozy fails at its core identity.

## Decisions

### 1. Four items, not eight
Phase 1's 8 items were individually small (config + system + UI). Phase 2 items are broader in scope (animations touch every visual, tutorial touches every system). Four items is the right number — each is substantial, achievable, and independently shippable.

### 2. Priority order: Feel → Accessibility → Depth → Engagement
1. **Visual Polish & Game Feel** — Highest impact on player perception. Transforms tech demo into cozy game.
2. **Tutorial & Onboarding** — 8 systems with no guidance means player drop-off. Critical for retention.
3. **Garden Expansion & Structures** — Gives veterans their next goal. GDD-defined progression endpoints.
4. **Achievements & Cosmetic Rewards** — Long-tail engagement for completionists.

### 3. Mobile optimization deferred again
The GDD mentions mobile, but polish and content depth matter more right now. A polished desktop game is better than a mediocre cross-platform one. Mobile can be Phase 3 once the game feels complete.

### 4. New systems required
- `ParticleSystem` and `AnimationSystem` — reusable across all visual effects
- `TutorialSystem` — first-run detection, hint tracking, overlay management
- `AchievementSystem` — event-driven achievement tracking (EventBus subscriber pattern)

### 5. Architecture implications
- ParticleSystem/AnimationSystem must not degrade below 55 FPS (performance budget)
- TutorialSystem reads game state but never mutates it (observer pattern)
- AchievementSystem follows ScoringSystem precedent: EventBus subscriber, decoupled from game logic
- Garden grid expansion requires dynamic GARDEN config (currently const — will need runtime override)

## Parallelization Strategy
- Items 1 and 2 can be developed in parallel (no shared new files)
- Item 3 depends on Item 1 partially (animations for structures) but can start early
- Item 4 depends on SaveManager schema extension (Item 3 also extends it — coordinate)

## Success Criteria
- New player completes first run without confusion
- Returning player notices and appreciates visual polish
- 10+ run veteran has expansion goals to pursue
- Completionist has 10+ achievements to chase
- All existing tests/builds pass; no performance regression

## Supersedes
Previous roadmap decision (2026-03-11: Strategic Roadmap for Post-Sprint 0 Development) — Phase 1 items are complete. This decision defines Phase 2.
