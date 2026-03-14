# Decision: Touch Controls & Mobile Responsiveness Architecture

**By:** Brock (Web Engine Dev)
**Status:** Implemented (branch `squad/119-touch-mobile`)
**Issue:** #119

## Context

Issue #119 requires full mobile playability: touch gestures, responsive grid scaling, pinch-to-zoom, haptic feedback, orientation hints, and 44px touch targets — all without breaking existing desktop mouse/keyboard input.

## Key Decisions

### 1. PixiJS Pointer Events + Raw DOM for Pinch

- Single-pointer gestures (tap, long-press, drag) use PixiJS v8's `FederatedPointerEvent` on a Container — this automatically unifies mouse and touch
- Pinch-to-zoom requires multi-touch, which PixiJS doesn't expose natively. Raw DOM `touchstart`/`touchmove`/`touchend` on the canvas handles the two-finger case
- **Rationale:** Keeps single-pointer code inside PixiJS's event system (consistent with existing `pointerdown` usage on buttons/grid), while only reaching into DOM for the multi-touch case PixiJS can't handle

### 2. Pointer Abstraction in InputManager (not TouchController)

- `InputManager` gained a `PointerState` property via window-level `PointerEvent` listeners
- TouchController handles *gestures* (tap vs drag vs long-press classification), InputManager handles *raw pointer state* (isDown, position, isTouch flag)
- **Rationale:** Scenes/systems that need raw "is pointer down at position X" queries use InputManager. Scenes that need classified gestures use TouchController. Separation of concerns

### 3. Responsive Grid Scaling via `calculateGridScale()`

- Grid tile size and container scale are computed from viewport dimensions at init and on every resize event
- Reserves fixed pixel space for HUD (top 150px) and toolbar (bottom 120px), then fits the grid in remaining area while maintaining aspect ratio
- **Rationale:** CSS-based scaling would fight with PixiJS's own coordinate system. Computing scale in JS and applying to Container.scale gives deterministic pixel-perfect results

### 4. Orientation Hint (not Enforcement)

- Portrait on mobile shows a gentle overlay hint ("Rotate your device") that auto-dismisses after 3 seconds
- Does NOT lock orientation or block gameplay
- **Rationale:** Cozy-first philosophy — don't frustrate players. The hint is informational; the responsive layout works in portrait too, just with smaller tiles

### 5. Haptic via navigator.vibrate() (not Haptic API)

- Used `navigator.vibrate(ms)` with three preset durations (light=10ms, medium=25ms, heavy=50ms)
- Gated behind `config.hapticEnabled` flag for user preference
- **Rationale:** The experimental Haptic API has near-zero browser support. `navigator.vibrate()` works on Android Chrome and degrades silently elsewhere. Good enough for MVP

### 6. Visual Ripple Feedback

- `TouchRipple` class renders an expanding circle with fade-out at the touch point
- 350ms duration, green stroke matching Flora's palette
- **Rationale:** Mobile users need visual confirmation their tap registered, since there's no hover state. The ripple provides that without being distracting

## Deferred

- **Per-UI-component 44px enforcement:** Config and utility exist (`ensureTouchTarget()`), but retrofitting every existing button/icon to guarantee 44px minimum is a follow-up pass across all UI components
- **Drag-to-scroll garden:** Drag gesture callback is wired but GardenScene doesn't yet pan the camera on drag — garden fits viewport via responsive scaling instead
- **Responsive font scaling in all UI:** `responsiveFontSize()` utility exists but isn't yet applied to every Text instance — follow-up
- **Orientation lock API:** Could use Screen Orientation API to suggest landscape, but browser support is patchy
