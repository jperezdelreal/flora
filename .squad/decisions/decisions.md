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

## 2026-03-14T11:08Z: Scene Transitions Architecture

**By:** Brock (Web Engine Dev)  
**Source:** PR #208, Issue #200

**Tier:** T1

**Status:** ✅ ACTIVE

### What
Four distinct scene transition types (fade, crossfade, slide, loading) replace hard cuts. Input blocked during transitions via `transitioning` flag. Easing functions pure utilities. Temporary container staging for simultaneous dual-scene rendering.

**Key Decisions:**
- Fade, crossfade, slide, loading as distinct implementations (not unified generic)
- Easing functions as stateless callbacks (linear, easeInOutCubic, easeOut, easeIn)
- Input blocking via SceneManager flag, not InputManager changes
- Temporary Container for new scene init during old scene display

**Routes:**
- Boot → Menu: loading
- Menu → SeedSelection: crossfade
- SeedSelection → Garden: fade
- Menu → Garden (continue): fade

---

## 2026-03-14T11:08Z: Plant Growth Animation Architecture

**By:** Misty (Web UI Dev)  
**Source:** PR #207, Issue #197

**Tier:** T1

**Status:** ✅ ACTIVE

### What
Procedural PixiJS Graphics rendering (8 shape types) for all 22 plants. Config-driven visuals in `plantVisuals.ts`. Keyframe interpolation for smooth growth transitions. Health-based visual degradation (wilting). Per-plant sway intensity (0.4–1.8x).

**Key Decisions:**
- Procedural Graphics (not sprite assets) — flexible, no art pipeline, 60 FPS with 64+ plants
- Config-driven visual definitions — centralized, easy iteration, future JSON modding
- Keyframe interpolation — continuous growth perception, elasticOut easing for "juicy" feel
- Health-based desaturation — visual feedback for under-watered/pest-damaged plants
- Per-plant sway intensity — tall plants 1.5–1.8x, medium 1.0x, short 0.4–0.5x

**Impact:** PlantSystem unchanged. EventBus reused `plant:grew`. AnimationSystem sufficient for tweens. Integrated with colorblind accessibility.

---

## 2026-03-14T11:08Z: Seasonal Palette System

**By:** Sabrina (Engine Design)  
**Source:** Issue #202 (Round 2)

**Tier:** T2

**Status:** 🔄 IN PROGRESS (code complete, git push retry in Round 3)

### What
Four seasonal color palettes (Spring pastels, Summer vibrant, Autumn warm, Winter muted) applied to plants, soil, sky, UI. Per-plant season color overrides. 2-second smooth lerp on season change.

**Key Decisions:**
- Four distinct palettes (not interpolated global shifts)
- Per-plant color overrides per season (customization beyond global palette)
- 2-second transition window for palette lerp

**Files:** `src/config/seasonalPalettes.ts` (NEW), plants.ts overrides, TransitionSystem lerp, GardenScene application.

**Note:** Build validated ✅, git commit/push failed, retry in Round 3.

---

## 2026-03-16T15:00Z: Flora Playability Crisis — 15 Bugs Found

**By:** Oak (Chief Architect)  
**Type:** Critical Audit Report

**Tier:** T0

**Status:** 🔴 CRITICAL — Game is unplayable

### Summary
**THE GAME IS UNPLAYABLE.** The founder is correct. There is no way for a human player to complete the core gameplay loop. The game boots, shows a menu, lets you select seeds, and drops you into a garden where you **cannot plant anything**. 15 bugs identified: 3 P0 (game-breaking), 6 P1 (major), 6 P2 (minor).

### Critical Blockers (P0)
- **BUG-001:** No Seed/Plant tool exists. `ToolType` enum missing SEED, `PlantSystem.createPlant()` never called, SeedInventory has zero click handlers. **100% of gameplay blocked.**
- **BUG-002:** Canvas blurry on all HiDPI screens. Missing `resolution: window.devicePixelRatio` and `autoDensity: true` in app init. Affects all modern displays.
- **BUG-003:** Clicking occupied tile with growing plant does nothing. Tile click handler calls `harvestPlant()` (returns false), doesn't fall through to movement. Player cannot walk to tiles with plants, cannot water them.

### Major Issues (P1)
- **BUG-004:** PauseMenu overlay hardcoded to 800×600, not full screen size
- **BUG-005:** SeedInventory panel non-interactive, no event handlers, hardcoded dimensions
- **BUG-006:** EventBus listeners in GardenScene never cleaned up (memory leak, duplicate handlers)
- **BUG-008:** Tool actions require standing on tile (unintuitive, inconsistent with harvest-by-click)
- **BUG-009:** BootScene "Press any key" text non-functional, transitions auto anyway
- **BUG-007:** Z-order issue — notifications render over pause menu

### Minor Issues (P2)
- **BUG-010:** Encyclopedia/AchievementGallery positioned off-screen on small viewports
- **BUG-011:** SeedInventory overlay doesn't block clicks (click-through to garden)
- **BUG-012:** StatusText overlaps HUD (redundant, should remove)
- **BUG-013:** DaySummary "Next Season" button resets entire run instead of advancing one day
- **BUG-014:** showActionMessage() and updateInfoText() are empty stubs
- **BUG-015:** Player starts at (4,4) regardless of grid size

### Fix Priority
1. **BUG-001** (add SEED tool) — nothing else matters without this
2. **BUG-002** (HiDPI resolution) — why "it looks bad"
3. **BUG-003** (tile interaction) — needed to walk to plants and water them

### Action
**Erika team assigned:** BUG-001, BUG-003, BUG-008, BUG-013, BUG-014, BUG-015  
**Brock team assigned:** BUG-002, BUG-009, BUG-006  
**Misty team assigned:** BUG-004, BUG-005, BUG-007, BUG-010, BUG-011, BUG-012

---

## 2026-03-16T15:00Z: Flora Gameplay Verification — Boot Fix Confirmed

**By:** Oak (Chief Architect)  
**Type:** QA Verification

**Tier:** T1

**Status:** ✅ PASSING (pre-audit baseline)

### Summary
Flora passes end-to-end gameplay validation prior to bug discovery. Boot scene fix (#279/PR #281) successfully resolved async race condition. Both test runs completed without errors.

### Results
**Run #1:** 5 days, 31.6 sec, 0 errors ✅  
**Run #2:** 6 days, 36.5 sec, 0 errors ✅

### Verified Systems
- Boot → Menu transition: **Working**
- Menu → New Run (Enter key): **Working**
- Seed Selection → Garden: **Working**
- Garden gameplay loop: **Working**
- Run completion → Menu return: **Working**

### Note
This verification was made **before discovering the 15 bugs**. The tests checked for JavaScript errors, not actual gameplay. A human playtester would have immediately found BUG-001 (can't plant anything). Recommendation: Add integration tests verifying "plant → water → harvest" workflow.

---

## 2026-03-16T19:00Z: SEED Tool Architecture

**Author:** Erika (Systems Dev)  
**Date:** 2026-03-16  
**Status:** ✅ IMPLEMENTED

### Context
BUG-001 required adding a planting mechanism. The existing tool system uses `ToolConfig.execute(tile, plant)` which only has access to tile and plant — not PlantSystem or the seed pool.

### Decision
The SEED tool is registered in the standard tool system (ToolType, ToolConfig, ProgressiveToolConfig) for toolbar display and selection, but its **execution is handled specially in GardenScene** rather than through `PlayerSystem.executeToolAction()`.

When `executeToolOnCurrentTile()` detects `ToolType.SEED`, it calls `handleSeedPlanting()` which has access to `PlantSystem.createPlant()` and `SeedSelectionSystem.getCurrentPool()`.

### Rationale
- PlantSystem.createPlant() needs the plant config ID (from seed pool), the grid coordinates, and adds the plant to both internal tracking and GardenScene's shared Map.
- This can't be done within the `(tile, plant) => ToolActionResult` signature.
- Alternative considered: passing PlantSystem into ToolConfig — rejected as it would break the data-driven tool pattern for one special case.

### Impact
- Misty (UI): SeedInventory click handlers can call `player.selectTool(ToolType.SEED)` to select the seed tool. No special wiring needed.
- Future: When we want to choose specific seed types, the `handleSeedPlanting()` method can be extended to read from a "selected seed" state rather than always using `pool.seeds[0]`.

---

## 2026-03-16T19:00Z: Rendering & Input Fixes (BUG-002, BUG-009, BUG-006)

**By:** Brock (Web Engine Dev)  
**Status:** ✅ IMPLEMENTED  
**Date:** 2026-03-16

### Changes

#### BUG-002: HiDPI Canvas Resolution (P0)
Added `resolution: window.devicePixelRatio || 1` and `autoDensity: true` to PixiJS `app.init()`. This renders at native device pixel ratio and lets PixiJS handle CSS sizing. `app.screen.width/height` continues to return CSS pixels, so no downstream positioning code was affected.

#### BUG-009: Boot Scene Input Gating (P1)
Replaced auto-transition with real user input gating. When loading bar completes, "Press any key" text pulses and the scene waits for keyboard/click/touch input before transitioning to Menu. Uses `transitioning` flag to prevent duplicate async transitions per convention from PR #281.

#### BUG-006: EventBus Listener Cleanup Pattern (P1)
Introduced `listenTo()` helper in GardenScene that wraps `eventBus.on()` and tracks a cleanup closure. All 23 EventBus subscriptions now route through this helper. `destroy()` iterates the cleanup array and calls `eventBus.off()` with the original function references.

### Convention Established
**All scenes with EventBus subscriptions should use the `listenTo()` pattern** (or equivalent cleanup tracking) to prevent listener accumulation across scene re-entries. Raw `eventBus.on()` without corresponding `off()` in `destroy()` is a memory leak.

### Files Changed
- `src/main.ts` — HiDPI resolution config
- `src/scenes/BootScene.ts` — Input-gated transition
- `src/scenes/GardenScene.ts` — EventBus cleanup infrastructure + destroy() fixes

---

## 2026-03-16T19:00Z: Overlay Layer Pattern for Z-Order Safety

**By:** Misty (Web UI Dev)  
**Status:** ✅ IMPLEMENTED
**Bugs:** BUG-004, BUG-005, BUG-007, BUG-010, BUG-011, BUG-012

### Problem
Multiple UI overlays (PauseMenu, notifications, tooltips) had z-order conflicts because addChild order in GardenScene.init() was fragile. PauseMenu overlay was hardcoded to 800×600, SeedInventory cards were non-interactive, and statusText duplicated HUD info.

### Decision: Dedicated overlayLayer Container

All full-screen modal overlays (PauseMenu, ScoreSummary, DaySummary) are now children of a single `overlayLayer` Container added at the END of GardenScene.init(). This guarantees they render above all gameplay UI regardless of future addChild ordering changes.

### Additional Decisions
- **PauseMenu/SeedInventory accept screen dimensions** in their constructors instead of using GAME.WIDTH/HEIGHT constants. This ensures overlays cover the actual canvas (which uses `resizeTo: window`).
- **All overlay backgrounds use `eventMode = 'static'`** to block click-through to garden tiles.
- **seed:selected event** added to EventBus for SeedInventory card clicks.
- **statusText removed** — HUD already displays the same day/actions/tool info.

### Consequences
✅ PauseMenu covers full screen on any resolution
✅ Seed cards are clickable with visual selection feedback
✅ Pause menu always renders above notifications/tutorials
✅ Encyclopedia/AchievementGallery won't go negative on small screens
⚠️ PauseMenu constructor signature changed — any other callers need updating

---
