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
