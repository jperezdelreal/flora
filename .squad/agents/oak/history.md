## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### PR #25 Review — Garden UI/HUD (Issue #9)
- **UI component pattern**: All UI classes follow getContainer()/destroy() lifecycle, self-contained with PixiJS Container ownership. This is the established pattern.
- **Keyboard listeners must be stored and removed**: Encyclopedia.ts does this correctly (boundOnKeyDown pattern). GardenScene.ts line 360 does not — flagged as must-fix.
- **Hardcoded 800x600 in UI components**: DaySummary, PauseMenu, PlantInfoPanel, Encyclopedia all hardcode screen dimensions. Config has GAME.WIDTH/GAME.HEIGHT. Track as tech debt.
- **RARITY_COLORS duplicated 3x**: SeedInventory (string), DiscoveryPopup (hex number), Encyclopedia (both). Should consolidate to config/plants.ts.
- **UI barrel export**: src/ui/index.ts re-exports all UI components. New components must be added here.
- **DaySummary fade**: Uses raw requestAnimationFrame, bypassing game loop/pause. DiscoveryPopup uses update(deltaMs) pattern — prefer that.
- **Bonus scope**: PR delivered DiscoveryPopup, Encyclopedia, HazardUI beyond issue scope. Good initiative but monitor scope creep in future sprints.

### Strategic Roadmap Definition (2026-03-11)
- **Context:** Sprint 0 complete. User requested powerful strategic roadmap (not just incremental tasks). Current game playable but lacks replayability, strategic depth, progression clarity.
- **Strategic thesis:** Players return when runs feel *different* (variety), *challenging* (decision-making), *rewarding* (visible progress).
- **Roadmap structure:** 8 items ordered by strategic impact: (1) Seasonal Themes [DONE], (2) Audio, (3) Unlocks, (4) Randomized Seeds, (5) Run Scoring, (6) Enhanced Hazards, (7) Synergies, (8) Save System.
- **Key architectural decisions:**
  - **Deterministic run seeding:** All randomness tied to seed value (enables reproducibility, future daily challenge mode, sharing runs).
  - **Event-driven scoring:** ScoringSystem subscribes to EventBus events (`plant:harvested`, `hazard:overcome`, `synergy:activated`). Decoupled from individual systems.
  - **Save schema versioning:** SaveData includes version field; migration functions handle v1→v2, etc. Graceful fallback to reset on failure.
  - **Hazard system split:** Current monolithic HazardSystem will split into PestSystem + WeatherSystem for clarity.
  - **Synergy system as new layer:** SynergySystem checks adjacency graph after PlantSystem update, applies bonuses, emits events. No negative interactions in MVP.
- **Parallelization strategy:** Phase 1 (Items 2-4 parallel), Phase 2 (Items 5-7 parallel), Phase 3 (Item 8 serial, requires schemas).
- **Deferred features:** Garden expansion, advanced tools, cosmetics, mobile optimization, cloud sync — out of scope until core loop is compelling.
- **Issue triage:** #32 (Audio) → squad:brock, #33 (Unlocks) → squad:misty, #37/#38 (roadmap) → closed.
- **Files involved:** roadmap.md (updated), .squad/decisions/inbox/oak-roadmap-strategy.md (created).
- **Success criteria:** 3+ distinct runs, 2x score gap (skill expression), 40+ min sessions, no frustration feedback.

### Phase 2 Roadmap Definition (2025-07-25)
- **Context:** Phase 1 fully delivered (all 8 items complete). Flora has complete roguelite core: seasonal themes, audio, unlocks, randomized seeds, scoring, hazards, synergies, saves. Game is mechanically sound but lacks tactile polish and accessibility.
- **Strategic thesis:** Phase 1 proved "mechanically interesting." Phase 2 must prove "feels cozy and invites return." The GDD's Pillar 1 demands satisfying tactile feedback — currently absent.
- **Roadmap structure:** 4 items (broader scope than Phase 1's 8): (1) Visual Polish & Game Feel, (2) Tutorial & Onboarding, (3) Garden Expansion & Structures, (4) Achievements & Cosmetic Rewards.
- **Key architectural decisions:**
  - **ParticleSystem + AnimationSystem:** New reusable systems for all visual effects. Performance budget: no drops below 55 FPS.
  - **TutorialSystem as observer:** Reads game state but never mutates it. First-run detection via SaveManager.
  - **AchievementSystem follows ScoringSystem pattern:** EventBus subscriber, decoupled from game logic.
  - **Dynamic garden grid:** GARDEN config currently `as const` — expansion requires runtime override for grid dimensions.
- **Mobile optimization deferred again:** Polish and content depth > cross-platform reach at this stage.
- **Parallelization:** Items 1+2 parallel (no shared new files). Items 3+4 share SaveManager schema extension — coordinate.
- **Files involved:** roadmap.md (rewritten), .squad/decisions/inbox/oak-next-roadmap.md (created).
- **Issue:** #73 closed.
