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

### Phase 4 Roadmap Definition (2026-03-14)
- **Context:** Phases 1-3 fully delivered (17 items total). Flora has: 22 plants, full roguelite loop, synergies (positive + negative), 12 achievements, daily challenges, touch/mobile, accessibility, title screen, object pooling, 3 structures, grid expansion, tutorial, save system. Game is feature-complete prototype.
- **Strategic thesis:** Phase 4 must prove "I want to come back tomorrow." Replayability comes from three vectors: **variety** (runs feel different), **depth** (decisions have consequences), **identity** (Flora has a visual soul, not just primitives).
- **Codebase audit findings (gaps vs GDD):**
  - MenuScene Encyclopedia/Achievements buttons are empty placeholders (lines 566-567: `break;`)
  - No weed mechanic (GDD §5), no compost as player action, no rest mechanic (GDD §3)
  - Only 3 tools (Water, Harvest, Remove Pest) — GDD §7 promises soil tester, watering can upgrades, pest spray, trellis
  - All plants are PixiJS primitives, structures are colored containers — no visual identity
  - 12 achievements unlock cosmetic rewards but rewards never render anywhere
  - Runs stay single-season, no player season choice
  - Flora Completionist achievement references "12 plants" but 22 now exist (stale config)
  - Object pool exists but not integrated into ParticleSystem
  - Reduced motion preference loaded but not applied to animation systems
  - High contrast mode schema exists but visual implementation deferred
- **Roadmap structure:** 6 items (balanced across team):
  1. Encyclopedia & Achievements Scenes (#192, squad:misty) — Close the biggest UX gap
  2. Weed & Compost Loop (#193, squad:erika) — Core GDD mechanics, active tending
  3. Tool Progression (#194, squad:erika) — Primary empowerment vector
  4. Procedural Visuals (#196, squad:sabrina) — Visual identity, screenshot-worthy
  5. Cosmetic Rewards (#198, squad:misty) — Close progression loop
  6. Season Selection (#201, squad:erika) — Run variety and agency
- **Key architectural decisions:**
  - **WeedSystem follows existing system pattern:** EventBus subscriber, update(dt), GardenScene wiring. Weed entity with SPROUTING → ESTABLISHED → SPREADING state machine.
  - **ToolSystem as new system:** Centralizes tool effect logic currently scattered in GardenScene. Tool tiers and unlock conditions in config.
  - **PlantRenderer + TileRenderer:** Dedicated rendering systems separate from game logic. Procedural sprites cached per plant type + growth stage combo.
  - **Multi-season runs as GardenScene state extension:** Garden persists across season transitions within a run, only hazards/weather/palette change. No full scene reset.
  - **Cosmetics extend SettingsSaveData:** Equipped cosmetics stored alongside accessibility preferences.
  - **EncyclopediaScene/AchievementsScene as full scenes:** Not MenuScene substates. Registered in SceneManager, navigate via `switchTo()`.
- **Parallelization strategy:** Items 1+4 parallel (no shared files). Items 2+3 share tool config — coordinate. Item 5 depends on Item 1 for preview. Item 6 independent.
- **Deferred to Phase 5:** Second garden plot (GDD §7 Unlock C at 50 runs), rest mechanic (GDD §3), player character sprite, cloud sync, bundle optimization, reduced motion per-system opt-in, high contrast visual implementation.
- **Files involved:** roadmap.md (rewritten), 6 GitHub issues created, .squad/decisions/inbox/oak-phase4-roadmap.md (created).
- **Issue:** #161 closed.

### Sprint 2 Planning (2025-07-25)
- **Context:** Sprint 1 "Wow Factor and Deploy" fully delivered (7/7 issues closed: #197, #199, #200, #202, #203, #204, #205). Board was empty. Ralph triggered automated sprint planning ceremony.
- **Sprint 2 theme:** "Depth & Identity" — gameplay depth (weeds, tools) + visual identity (procedural rendering) + UX completion (encyclopedia/achievements scenes).
- **Scope:** 7 issues covering 4 of 6 Phase 4 roadmap items (§1-§4). §5 Cosmetic Rewards and §6 Season Selection deferred to Sprint 3.
- **Team allocation:** Misty (#215, #216 — Encyclopedia + Achievements scenes), Erika (#217, #218 — WeedSystem + ToolSystem), Sabrina (#219, #220 — PlantRenderer + TileRenderer), Brock (#221 — SpriteCache + pool integration + audio SFX).
- **Key coordination points:** Brock's SpriteCache (#221) ideally lands before Sabrina's renderers (#219, #220). Erika's WeedSystem (#217) and ToolSystem (#218) share tools.ts for Compost tool. Misty's scenes (#215, #216) are fully independent.
- **Deferred to Sprint 3:** Cosmetic Reward Application (depends on AchievementsScene #216), Season Selection & Run Variety.
- **Meta issue:** #223.
- **Files updated:** roadmap.md (§1-§4 marked as in-progress with sprint references).
