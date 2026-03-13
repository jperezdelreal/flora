# FLORA Squad Decisions Ledger

## 2026-03-12T11:12:00Z: User directive

**By:** joperezd (via Copilot)

**What:** Don't accumulate hibernated agents. If they're not needed, delete them entirely. The team can always be expanded later if needed.

**Why:** User request — captured for team memory

---

## 2025-07-14: UI Components Must Clean Up Window Listeners

**Author:** Oak  
**Context:** PR #25 review (Garden UI/HUD, Issue #9)

### Decision

Any component or scene that calls `window.addEventListener()` MUST:
1. Store the handler as a bound class field (e.g., `private boundOnKeyDown`)
2. Remove it in `destroy()` via `window.removeEventListener()`

### Rationale

GardenScene.setupKeyboardShortcuts() used an anonymous listener that can't be removed. On scene transitions, this causes listener accumulation → double-fired events. Encyclopedia.ts already follows the correct pattern — this formalizes it as a project-wide rule.

### Scope

Applies to all `src/ui/` and `src/scenes/` files. Any future `window.addEventListener` usage.

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
