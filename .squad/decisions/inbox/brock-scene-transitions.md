# Scene Transitions Architecture

**By:** Brock (Web Engine Dev)  
**Date:** 2025-03-14  
**Issue:** #200  
**Status:** Implemented (Branch squad/200-scene-transitions)

## Context

FLORA is a cozy gardening roguelite. Hard scene cuts felt jarring and broke immersion. The GDD envisions gentle transitions that reinforce the relaxed, welcoming tone.

## Key Decisions

### 1. Four transition types (not a single generic transition)

Implemented `fade`, `crossfade`, `slide`, and `loading` as distinct transition methods rather than one configurable function. Each has specialized behavior that would be messy to express as flags/options.

**Rationale:** Slide needs temporary containers + position animation. Loading needs progress bar rendering. Crossfade needs simultaneous dual-container management. A unified "do everything" function would have too many conditionals and edge cases.

### 2. Easing functions as pure utility functions (not classes)

Four simple functions: `easeLinear`, `easeInOutCubic`, `easeOut`, `easeIn`. Passed as callbacks to animation methods.

**Rationale:** Easing functions are stateless pure functions. No need for classes, inheritance, or complex easing libraries. Cubic easing curves provide enough variety for the cozy aesthetic.

### 3. Input blocking via `transitioning` flag check in `update()`

SceneManager skips calling `current.update()` while `transitioning === true`. No changes to InputManager needed.

**Rationale:** Cleaner separation of concerns. InputManager doesn't need to know about transitions. Scenes simply don't receive update() calls during transitions, so they can't process input.

### 4. Temporary container staging for crossfade/slide

New scene renders into a temporary Container added to app.stage. After animation, children move to SceneManager.stage.

**Rationale:** Allows new scene to init and render while old scene is still visible. Crossfade and slide both need both scenes on screen simultaneously. Moving children afterward keeps SceneManager.stage as single source of truth.

### 5. Loading transition simulates progress with parallel init

Progress bar animates to 100% over 60% of transition duration. Scene init runs in parallel via `Promise.all()`.

**Rationale:** Actual init time varies (fast on local dev, slower on cold start). Simulated progress ensures consistent UX. If init finishes early, progress bar catches up. If init is slow, progress bar waits at 100%.

## Scene Routing

- **Boot → Menu**: `loading` (with "Preparing the garden..." message)
- **Menu → SeedSelection**: `crossfade` (smooth blend reinforces continuity)
- **SeedSelection → Garden**: `fade` (dramatic entry into gameplay)
- **Menu → Garden (Continue)**: `fade` (returning to familiar space)

## Follow-Up

- Sound effects for transitions (subscribe to transition start/end events when audio SFX expands)
- Encyclopedia panel slide-in (when Encyclopedia scene exists)
- Garden → Summary fade (when Summary scene exists)
