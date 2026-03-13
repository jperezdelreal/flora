# FLORA Squad Decisions Ledger

## 2026-03-12T11:12:00Z: User directive

**By:** joperezd (via Copilot)

**What:** Don't accumulate hibernated agents. If they're not needed, delete them entirely. The team can always be expanded later if needed.

**Why:** User request — captured for team memory

---

## 2026-03-13: Unlock System Architecture Pattern

**Agent:** Misty (Web UI Dev)  
**Context:** Issue #33 — Unlock System & Meta-Progression UI

### Decision
Implement unlock system using localStorage persistence following the EncyclopediaSystem pattern, with milestone tracking decoupled from UI via EventBus.

### Rationale
1. **localStorage pattern**: EncyclopediaSystem.ts provided proven pattern for meta-progression persistence
2. **EventBus decoupling**: Unlock events allow UI components to subscribe independently without tight coupling
3. **Toast-style notifications**: DiscoveryPopup.ts pattern reused for consistent visual language
4. **HUD expansion**: Increased HUD height from 60px to 90px to accommodate unlock progress indicator
5. **Tool locking**: All tools start unlocked (MVP behavior), but infrastructure supports locked states for future progression

### Files Created
- `src/systems/UnlockSystem.ts` — Core unlock logic
- `src/config/unlocks.ts` — Milestone definitions
- `src/ui/UnlockNotification.ts` — Toast popup component

### Files Modified
- `src/ui/HUD.ts` — Added unlock progress bar
- `src/ui/ToolBar.ts` — Added locked/unlocked visual states with animations
- `src/systems/PlantSystem.ts` — Fixed to emit plant:matured events
- `src/core/EventBus.ts` — Added plant:matured and milestone:unlocked events

### Key Patterns
- **localStorage key**: `flora_unlock_progress` (follows `flora_*` convention)
- **Milestone types**: plants_harvested, plants_matured, plant_diversity
- **Unlock animation**: 6-pulse green highlight on newly unlocked tools
- **Progress display**: `"Next unlock: 3/5"` format with golden progress bar

### Integration Notes
- UnlockSystem ready for GardenScene integration via event subscription
- All tools default unlocked for MVP; lock behavior tested and working
- Milestone thresholds tuned for 10-run progression curve (GDD §7)

### Team Impact
Other agents integrating with unlock system should:
1. Subscribe to `milestone:unlocked` events to react to unlocks
2. Call `unlockSystem.recordHarvest()` / `recordMaturity()` / `recordDiscovery()` to update progress
3. Use `unlockSystem.getNextMilestone(type)` to display progress in UI
4. Follow the "TLDR:" comment convention for all unlock-related code

---

## 2026-03-13: Audio System Architecture (Issue #32)

**Agent:** Brock (Web Engine Dev)  
**Status:** Implemented (PR #45)

### Context
Flora needed ambient audio, seasonal music variants, and action sound effects to transform from mechanically sound to emotionally cozy and immersive.

### Decision
Implemented procedural audio system using Web Audio API with zero external audio assets.

### Architecture
- **AudioManager singleton** with routing graph: `sfxBus + ambientBus + musicBus → masterGain → compressor → destination`
- **Procedural synthesis** for all sounds:
  - Ambient: Layered oscillators (220Hz + 330Hz) + filtered noise + random bird chirps
  - SFX: Oscillators, noise buffers, bandpass/lowpass filters for plant/water/harvest/pest sounds
- **EventBus integration**: Systems emit typed events, GardenScene subscribes and triggers SFX
- **Volume control**: Per-bus gain nodes with localStorage persistence
- **User interaction unlock**: AudioContext requires user gesture before resume()

### Key Implementation Points
1. **main.ts**: Init audioManager, attach click/keydown listeners to resume AudioContext
2. **GardenScene.ts**: Subscribe to EventBus events (`plant:watered`, `pest:spawned`, etc.) and call `audioManager.playSFX()`
3. **PauseMenu.ts**: Mute toggle button updates master gain and persists state
4. **AudioManager.ts**: Already fully implemented with all SFX synthesis methods

### Rationale
- **No external assets**: Procedural audio = zero licensing/download overhead
- **Cozy aesthetic**: Lo-fi layered ambience with gentle SFX matches GDD §9 vision
- **Decoupled design**: EventBus pattern keeps audio logic separate from gameplay systems
- **Browser compliance**: Explicit resume() after user interaction satisfies autoplay policy

### Alternatives Considered
- **Audio files (MP3/WAV)**: Rejected due to licensing complexity and bundle size
- **Tone.js library**: Overkill for simple procedural synth needs
- **Direct coupling**: Rejected in favor of EventBus for maintainability

### Implications
- Future work: Seasonal ambient variants (different oscillator frequencies per season)
- Pattern established: All audio events go through EventBus, never direct calls to AudioManager from systems
- Volume preferences persist across sessions via localStorage
- AudioManager is a singleton; init() must be called before use

### Team Notes
- **For gameplay devs**: Emit typed events via `eventBus.emit()`, don't call audioManager directly
- **For audio enhancements**: Add new SFX types to `src/config/audio.ts` and AudioManager's switch statement
- **For seasonal variants**: Adjust oscillator frequencies and noise cutoffs in AUDIO.AMBIENT config per season

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

## 2026-03-13: Save System Architecture (Issue #48)

**Agent:** Brock (Web Engine Dev)  
**Status:** Implemented (PR #61)

### Context

Flora needed a persistent save system to retain player progress across sessions. Previously, Encyclopedia, Unlock, Scoring, and Audio systems each managed their own localStorage keys independently, creating fragmentation and making schema changes risky.

### Decision

Implemented a **centralized SaveManager** that coordinates all persistence operations:

1. **Single source of truth**: `SaveManager` owns the unified `SaveData` schema
2. **Versioned schema**: All saves include a version number for safe migrations
3. **Optional injection pattern**: Systems accept optional `SaveManager` in constructor, fall back to direct localStorage if not provided (backward compatible)
4. **Auto-save with dirty tracking**: SaveManager subscribes to EventBus, auto-saves every 60s when dirty
5. **Safe storage utilities**: Never-throw wrappers around localStorage with fallback values
6. **UI feedback**: `SaveIndicator` component shows save status with fade animation

### Rationale

- **Consolidation prevents conflicts**: Single save file eliminates key collisions, ensures atomic updates
- **Versioning enables evolution**: Schema changes are safe; old saves migrate automatically
- **Optional injection preserves backward compatibility**: Systems work standalone or with SaveManager
- **Auto-save reduces data loss**: Player never has to manually save; progress persists across crashes
- **Corruption handling**: Validates structure on load, repairs broken saves, never crashes

### Alternatives Considered

1. **Keep scattered localStorage keys** — Rejected: fragile, hard to version, no atomicity
2. **Require SaveManager everywhere** — Rejected: breaks existing tests, not backward compatible
3. **IndexedDB instead of localStorage** — Deferred: localStorage sufficient for MVP, IndexedDB for cloud sync later

### Consequences

#### Positive
- Unified save format across all systems
- Easy to add export/import features later
- Safe schema evolution via versioning
- Clear UI feedback on save status

#### Negative
- Slightly more complex initialization (wire SaveManager to all systems)
- Systems now have dual save paths (SaveManager vs direct localStorage)

### Implementation Notes

- SaveManager updates are batched via dirty flag + 60s timer
- Systems call `saveManager.updateX()` methods, not `saveManager.save()` directly
- Manual saves triggered at run end, not per-action
- SaveIndicator positioned bottom-right, fades after 1s display

---

## 2026-03-13T22-05-00Z: Weather System Architecture (Issue #49 Follow-up)

**Agent:** Erika (Systems Dev)  
**Status:** Implemented (PR #74)

### Context

Issue #49 required splitting weather events from HazardSystem and implementing 2-day advance warnings. Previous architecture had all hazards (pests + weather) in a single system, which violated single-responsibility principle and made weather mechanics hard to extend.

### Decision

#### 1. System Separation
- **WeatherSystem**: Manages drought, frost, heavy rain with telegraph warnings
- **HazardSystem**: Focused solely on pest spawning and damage
- Weather logic completely removed from HazardSystem (drought multipliers, frost damage, etc.)

#### 2. Telegraph Warning Pattern
- All weather events schedule warnings 2 days before activation
- `warningDay = startDay - 2` for consistent player preparation time
- WeatherSystem.onDayAdvance checks both warning triggers and event activation
- EventBus emits `weather:warning` with threat description + mitigation advice

#### 3. UI Layering Strategy
- **HazardWarning**: Full-width telegraphs with detailed threat info (2 days ahead)
- **HazardUI**: Active status banners showing current weather effects
- **HUD**: Compact text indicator for upcoming warnings (bottom of HUD panel)
- Three layers ensure visibility without clutter

#### 4. Weather Mechanics
- **Drought**: `waterNeedMultiplier: 1.5`, `soilDryingMultiplier: 2.0`
- **Frost**: Applies `damagePerDay` to plants without WINTER in availableSeasons
- **Heavy Rain**: Locks soil moisture at 100% (future implementation)
- All mechanics query WeatherSystem state rather than mutating plant/grid directly

#### 5. Event Integration
- Added events: `weather:warning`, `frost:started/ended`, `heavy_rain:started/ended`
- GardenScene subscribes to `weather:warning` and displays via HazardWarning UI
- Decoupled: systems emit events, UI reacts independently

### Rationale

1. **Single Responsibility**: Each system has one clear purpose (pests vs. weather)
2. **Telegraph Design**: GDD states "hazards are puzzles, not enemies" — warnings enable strategic planning
3. **Extensibility**: New weather types add to WeatherSystem without touching HazardSystem
4. **Testability**: Weather and pest logic can be tested independently
5. **Visual Clarity**: Three UI layers match player attention needs (long-term warnings → active threats → quick reminders)

### Alternatives Considered

1. **Keep unified HazardSystem**: Rejected — too complex, violates SRP
2. **Single UI component for all hazards**: Rejected — can't distinguish urgent vs. informational
3. **Per-frame weather checks**: Rejected — weather events are day-based, no need for frame updates

### Consequences

#### Positive
- Clean separation enables future weather types (heatwave, wind, etc.)
- Telegraph warnings align with cozy design philosophy (no surprises)
- UI layering scales to multiple simultaneous hazards

#### Negative
- Two systems to manage instead of one (slightly more cognitive overhead)
- WeatherSystem.update() is a no-op (weather is day-based) but required by System interface

### Implementation Notes

- WeatherSystem fully implemented with day-based event scheduling
- HazardWarning and HazardTooltip UI components complete with visual polish
- Integration with GardenScene via EventBus pattern (no direct coupling)
- Heavy Rain scaffold in place for future completion

### Team Notes

- **For gameplay balance**: Adjust weather event frequency and multipliers in `src/config/weather.ts`
- **For UX**: Weather warnings can be enhanced with forecast visualization in future PRs
- **For testing**: WeatherSystem can simulate seasons via `onDayAdvance()` mock

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

### Context

Issue #88 required tactile animations, particle effects, and scene transitions to fulfill the GDD's cozy pillar. Needed a system architecture that supports future visual expansion without per-frame overhead concerns.

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

### Deferred

- Sprite-based plant visuals (currently procedural Graphics circles) — needs art assets
- Weather particle effects (rain, snow, dust) — per GDD §5.3
- Garden expansion animation — not yet designed
- Shader-based effects (watercolor, ink wash) — my specialty, waiting on art direction approval

### Team Notes
- All visual work is non-blocking to gameplay
- New effects add via ParticleSystem.burst() or AnimationSystem.tween()
- No animation magic numbers in game logic — all tuning via config

---

## 2026-03-13T23:25Z: Tutorial & Onboarding Delivery (Issue #91)

**By:** Misty (Web UI Dev)  
**Date:** 2025-07-22  
**Status:** Implemented (PR #99)  
**Merged:** 2026-03-13T23:25Z

### Context

Issue #91 requested a tutorial & onboarding system to guide new players through Flora's 8+ game systems. The GDD states "No tutorial needed for MVP features" but we're past MVP, and the number of mechanics (planting, watering, harvesting, pests, synergies, weather, scoring, encyclopedia) warrants guided onboarding.

### Key Decisions

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

### Deliverables

- ✅ TutorialSystem (first-run detection, hint tracking, overlay management)
- ✅ TutorialOverlay (7-step guided walkthrough UI)
- ✅ 7-step tutorial sequence with event-driven progression
- ✅ Contextual hints system (independent of main tutorial)
- ✅ How to Play reference overlay
- ✅ localStorage persistence with no SaveManager coupling

### What's Not Included

- **Highlight/spotlight effect**: The overlay dims the screen but doesn't spotlight specific UI elements (e.g., toolbar). This could be added later with a mask.
- **Tutorial for tool selection**: The current guided steps mention tools but don't force-select them. Future: could lock toolbar to only the relevant tool during tutorial steps.
- **Audio integration**: No tutorial-specific sounds yet. Could add a soft chime for hint display.

### Team Notes
- Tutorial state stored in `flora_tutorial` localStorage key (separate from SaveManager)
- All hint messages follow cozy-friendly tone guideline
- Event-driven progression means zero polling overhead in game loop
