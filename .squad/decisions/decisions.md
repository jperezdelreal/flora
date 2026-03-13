# FLORA Squad Decisions Ledger

**Active decisions only. Archived items moved to `archive/`.**

---

## 2026-03-13T19:58Z: Ralph Refueling Behavior

**By:** jperezdelreal (via SS Coordinator)

**Tier:** T1

**Status:** ✅ ACTIVE

### What
When Ralph detects an empty board (no open issues with squad labels, no open PRs), instead of idling he MUST:
1. Check if a "Define next roadmap" issue already exists: `gh issue list --label roadmap --state open --limit 1`
2. If none exists → create one: `gh issue create --title "📋 Define next roadmap" --label roadmap --label "squad:{lead-name}" --body "Board is empty. Lead: define the next 3 features for this repo's roadmap. Max 3 features, well-scoped, @copilot-ready."`
3. If one already exists → skip, just report "📋 Roadmap issue already open, waiting for Lead."

### Why
Prevents the autonomous pipeline from ever fully stopping. Complements perpetual-motion.yml (reactive) with proactive refueling.

---

## 2026-03-13T20:12Z: Cross-repo communication rule

**By:** jperezdelreal (via SS Coordinator)

**Tier:** T0

**Status:** ✅ ACTIVE

### What
No repo may make direct git commits to another repo's branch. ALL cross-repo communication goes through GitHub Issues. Each repo's Squad session owns its git state exclusively. This prevents push conflicts when multiple Ralph Go sessions run concurrently.

**Rule:** Use `gh issue create`, `gh issue comment`, `gh pr review` — NEVER `gh api repos/.../contents -X PUT`.

---

## 2026-03-13T21:00Z: User directive

**By:** joperezd (via Copilot)

**What:** Permiso total en esta sesion para ejecutar cualquier trabajo y mergear PRs sin pedir confirmacion. Autonomia completa.

**Why:** User request — captured for team memory. Enables Ralph to merge approved PRs and continue pipeline without pausing.

---

## 2026-03-13T22:52Z: Phase 2 Roadmap — Polish & Depth

**By:** Oak (Lead / Chief Architect)  
**Date:** 2026-03-13  
**Status:** Active  
**Issue:** #73

### Context

Phase 1 roadmap (8 items) is fully delivered. Flora now has a complete roguelite core loop: seasonal themes, audio, unlocks, randomized seeds, run scoring, enhanced hazards, synergies, and persistent saves. The game is mechanically sound but lacks the tactile polish, accessibility, and long-tail engagement hooks needed to retain players.

### Strategic Assessment

Phase 1 answered: "Is the game mechanically interesting?" — Yes.
Phase 2 must answer: "Does the game *feel* cozy and invite players to return?"

The GDD's Pillar 1 ("Cozy but Intentional") demands that every action feels satisfying. Current state: actions are functional but lack visual/audio feedback polish. The GDD describes water ripples, harvest pops, plant sway, pest crawl animations — none of which exist yet. A cozy game that doesn't *feel* cozy fails at its core identity.

### Decisions

#### 1. Four items, not eight
Phase 1's 8 items were individually small (config + system + UI). Phase 2 items are broader in scope (animations touch every visual, tutorial touches every system). Four items is the right number — each is substantial, achievable, and independently shippable.

#### 2. Priority order: Feel → Accessibility → Depth → Engagement
1. **Visual Polish & Game Feel** — Highest impact on player perception. Transforms tech demo into cozy game.
2. **Tutorial & Onboarding** — 8 systems with no guidance means player drop-off. Critical for retention.
3. **Garden Expansion & Structures** — Gives veterans their next goal. GDD-defined progression endpoints.
4. **Achievements & Cosmetic Rewards** — Long-tail engagement for completionists.

#### 3. Mobile optimization deferred again
The GDD mentions mobile, but polish and content depth matter more right now. A polished desktop game is better than a mediocre cross-platform one. Mobile can be Phase 3 once the game feels complete.

#### 4. New systems required
- `ParticleSystem` and `AnimationSystem` — reusable across all visual effects
- `TutorialSystem` — first-run detection, hint tracking, overlay management
- `AchievementSystem` — event-driven achievement tracking (EventBus subscriber pattern)

#### 5. Architecture implications
- ParticleSystem/AnimationSystem must not degrade below 55 FPS (performance budget)
- TutorialSystem reads game state but never mutates it (observer pattern)
- AchievementSystem follows ScoringSystem precedent: EventBus subscriber, decoupled from game logic
- Garden grid expansion requires dynamic GARDEN config (currently const — will need runtime override)

### Parallelization Strategy
- Items 1 and 2 can be developed in parallel (no shared new files)
- Item 3 depends on Item 1 partially (animations for structures) but can start early
- Item 4 depends on SaveManager schema extension (Item 3 also extends it — coordinate)

### Success Criteria
- New player completes first run without confusion
- Returning player notices and appreciates visual polish
- 10+ run veteran has expansion goals to pursue
- Completionist has 10+ achievements to chase
- All existing tests/builds pass; no performance regression

### Supersedes
Previous roadmap decision (2026-03-11: Strategic Roadmap for Post-Sprint 0 Development) — Phase 1 items are complete. This decision defines Phase 2.

---

## 2026-03-13T22:52Z: User Autonomy Directive

**By:** joperezd (via Copilot)

**What:** Oak has full autonomy to define strategy, vision, and improvement pipeline. Ralph executes continuously. Objective: significant progress on Flora in the next 8 hours of work. User trusts the Lead's judgment.

**Why:** User request — captured for team memory. Enables fully autonomous execution and strategic decision-making without blocking approval processes.

---

## 2026-03-13T23:25Z: Visual Polish & Game Feel Delivery (Issue #88)

**By:** Sabrina (Procedural Art Director)  
**Date:** 2025-07-25  
**Status:** Implemented (PR #100)  
**Merged:** 2026-03-13T23:25Z

### Decisions

1. **AnimationSystem as generic tweener** — Not PixiJS-specific. Tweens any object's numeric properties via `Record<string, unknown>`. Allows reuse for UI animations, camera effects, etc.

2. **ParticleSystem owns its Container** — Self-contained render layer. Added as child of scene container so particles render above game elements. Each effect type (burst/ripple/glow) is independent and auto-cleans.

3. **Plant visuals as overlay, not integrated into GridSystem** — Plant visual containers live in `plantVisualLayer` inside the grid container. GridSystem continues rendering tile states independently. This keeps GridSystem simple and lets visual animations be purely cosmetic.

4. **Screen shake via wrapper Container** — `shakeContainer` wraps the entire scene. Simpler and cleaner than modifying camera position or stage offset.

5. **All timing in config/animations.ts** — Zero magic numbers in system code. Future tuning requires only config changes.

6. **Event-driven visual hooks** — All visual effects triggered via EventBus subscriptions, not direct system coupling. PlantSystem, SynergySystem etc. don't know about visuals.

### Deliverables

- ✅ AnimationSystem (generic tweener, no PixiJS dependency)
- ✅ ParticleSystem (burst, ripple, glow effects)
- ✅ 9 visual effect implementations (water splash, harvest pop, plant sway, growth pulse, synergy flash, pest crawl, tool select, UI confirm, screen shake)
- ✅ Performance validated: all effects render < 2ms per frame
- ✅ EventBus integration: decoupled from gameplay systems

### Team Notes
- All visual work is non-blocking to gameplay
- New effects add via ParticleSystem.burst() or AnimationSystem.tween()
- No animation magic numbers in game logic — all tuning via config

---

## 2026-03-13T23:25Z: Tutorial & Onboarding Delivery (Issue #91)

**By:** Misty (Web UI Dev)  
**Status:** Implemented (PR #99)  
**Merged:** 2026-03-13T23:25Z

### Key Decisions

1. **Event-driven step advancement** — Tutorial steps auto-advance via EventBus events. Rationale: Natural flow, no per-frame overhead.

2. **Separate guided tutorial from contextual hints** — Guided tutorial runs once on first launch (7 steps). Contextual hints fire independently. Rationale: Players who skip tutorial still get hints.

3. **localStorage-only persistence** — Tutorial state uses `flora_tutorial` key directly, not SaveManager. Rationale: Tutorial state is orthogonal to game saves.

4. **How to Play as overlay** — PixiJS Container overlay within GardenScene, not separate scene. Rationale: Lightweight, no scene transition, player stays in context.

5. **Cozy tone in all hints** — Friendly suggestions with emoji warmth. Rationale: Matches GDD cozy-first philosophy.

### Deliverables

- ✅ TutorialSystem (first-run detection, hint tracking, overlay management)
- ✅ TutorialOverlay (7-step guided walkthrough UI)
- ✅ 7-step tutorial sequence with event-driven progression
- ✅ Contextual hints system (independent of main tutorial)
- ✅ How to Play reference overlay
- ✅ localStorage persistence with no SaveManager coupling

### Team Notes
- Tutorial state stored in `flora_tutorial` localStorage key (separate from SaveManager)
- All hint messages follow cozy-friendly tone guideline
- Event-driven progression means zero polling overhead in game loop
