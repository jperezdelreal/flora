# Performance & Accessibility Architecture

**By:** Brock (Web Engine Dev)
**Date:** 2026-03-14
**Status:** Implemented (branch `squad/116-perf-accessibility`)
**Issue:** #116

## Context

Issue #116 requires performance optimization (object pooling, FPS monitoring, bundle analysis) and accessibility (colorblind modes, keyboard navigation, screen reader support). This touches engine-level infrastructure that other domains build upon.

## Key Decisions

### 1. Generic Object Pool over PixiJS-specific pool
- `ObjectPool<T>` accepts any type via `create`/`reset`/`destroy` callbacks
- **Rationale:** ParticleSystem, AnimationSystem, and future systems all need pooling but for different object types. A generic pool is reusable across all of them without coupling to Graphics.

### 2. FPS Monitor as dev-only overlay with quality tiers
- Three tiers: `high` (60+ FPS), `medium` (30-50 FPS), `low` (<30 FPS)
- Only instantiated when `import.meta.env.DEV` is true; zero cost in production
- **Rationale:** Auto quality reduction needs sustained measurement (180 frames) to avoid reacting to brief dips. Quality callbacks let systems independently respond (reduce particles, skip animations, etc).

### 3. Config-driven colorblind palettes (not CSS filters)
- Four palettes defined as typed `ColorPalette` objects in `src/config/accessibility.ts`
- Systems query `getActivePalette()` for the current palette
- **Rationale:** CSS filters degrade all visuals uniformly. Config-driven palettes let us tune each color for optimal contrast per vision type. Palettes use the Okabe-Ito color scheme foundations.

### 4. ARIA live region for screen reader announcements
- Hidden DOM element with `role="status"` and `aria-live="polite"` (or `"assertive"` for milestones/achievements)
- `announce()` utility clears and re-sets text to force re-announcement
- **Rationale:** PixiJS Canvas is opaque to screen readers. A live region bridges this gap without requiring complex ARIA tree mirroring.

### 5. Keyboard focus management in PixiJS
- Custom focus index + rendered focus ring (Graphics stroke) rather than DOM focus
- Arrow keys, Tab, Enter/Space all work; focus wraps around
- **Rationale:** PixiJS elements aren't DOM nodes, so native focus doesn't work. A lightweight focus index + visual ring is simpler and more reliable than injecting hidden DOM proxies.

### 6. Accessibility preferences persisted via SaveManager
- Extended `SettingsSaveData` with `colorVisionMode`, `reducedMotion`, `highContrast`
- `SAVE_KEYS.SETTINGS` key in localStorage
- **Rationale:** Accessibility settings must survive page reloads. Using the existing SaveManager pattern keeps it consistent with audio/unlock/achievement persistence.

## Deferred

- **Bundle visualizer**: `rollup-plugin-visualizer` has ESM-only compatibility issues with the project's CommonJS setup. Can revisit when project migrates to ESM or use `source-map-explorer` as alternative.
- **Texture atlasing**: Requires asset pipeline changes; deferred to dedicated sprint.
- **Object pool integration into ParticleSystem**: Pool is ready; actual integration into ParticleSystem's burst/ripple/glow methods is a follow-up task.
- **Reduced motion mode**: Preference is loaded and persisted; actual animation reduction needs per-system opt-in.
- **High contrast mode**: Schema field exists; visual implementation deferred.
