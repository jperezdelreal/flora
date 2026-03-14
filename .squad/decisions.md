# Decisions — FLORA

> Canonical decision ledger. Append-only.

---

## 2026-03-13T20:44Z: User directive

**By:** joperezd (via Copilot)  
**Status:** Active  

User directive: El Lead (Oak) debe priorizar la definicion de estrategia y asegurar un roadmap potente. Enfoque en vision estrategica, no solo tareas incrementales.

**Captured for:** Team memory and strategic alignment

---

## 2026-03-11: Strategic Roadmap for Post-Sprint 0 Development

**By:** Oak (Lead / Chief Architect)  
**Status:** Active  

Flora is a **cozy gardening roguelite** where every run should feel distinct, meaningful, and rewarding. Sprint 0 complete — foundation solid. Current state: playable tech demo lacking replayability, strategic depth, and progression clarity.

### Core Strategic Vision

Players will return to Flora if runs feel *different enough* to explore new strategies, *challenging enough* to require thought, and *rewarding enough* to see progress accumulate.

### Roadmap (8 Items)

1. **Audio System** — Foundation audio (cozy pillar)
2. **Unlock System** — Progression visibility  
3. **Randomized Seed Selection** — Run variety & replayability  
4. **Run Scoring & Milestones** — Goal clarity & feedback  
5. **Enhanced Hazard Mechanics** — Puzzle design, telegraphed threats  
6. **Seed Synergies & Polyculture Bonus** — Skill ceiling & mastery  
7. **Persistent Save System** — Session retention infrastructure  
8. **Advanced Features (Deferred)** — Garden expansion, mobile, cloud sync (post-roadmap)

### Key Decisions

- **Deterministic Run Seeding:** All randomness tied to seed value for reproducibility
- **Event-Driven Scoring:** EventBus integration, decoupled from individual systems
- **Parallelization:** Items 2-3-4 → Phase 1; Items 5-6-7 → Phase 2; Item 8 → Phase 3 (serial)
- **Cozy-First Philosophy:** No frustration, hazards as puzzles, failure teaches not punishes

**Success Criteria:** 3+ meaningfully different runs, players articulate goals, 2x score gap (skill expression), multi-session play, hazards feel like puzzles.

**Document Owner:** Oak | **Status:** Active — guides work until reassessed

> **Archived:** Strategic Roadmap and Synergy System decisions archived to `decisions/archive/decisions-pre-phase3.md` on 2026-03-14. Active decision ledger now focused on Phase 3+ work.

---

## 2026-03-14T00:35Z: Performance & Accessibility Architecture

**By:** Brock (Web Engine Dev)  
**Status:** Implemented (PR #143)  
**Issue:** #116  

### Context

Issue #116 requires performance optimization (object pooling, FPS monitoring, bundle analysis) and accessibility (colorblind modes, keyboard navigation, screen reader support). This touches engine-level infrastructure that other domains build upon.

### Key Decisions

1. **Generic Object Pool over PixiJS-specific pool**
   - `ObjectPool<T>` accepts any type via `create`/`reset`/`destroy` callbacks
   - **Rationale:** ParticleSystem, AnimationSystem, and future systems all need pooling but for different object types. A generic pool is reusable across all of them without coupling to Graphics.

2. **FPS Monitor as dev-only overlay with quality tiers**
   - Three tiers: `high` (60+ FPS), `medium` (30-50 FPS), `low` (<30 FPS)
   - Only instantiated when `import.meta.env.DEV` is true; zero cost in production
   - **Rationale:** Auto quality reduction needs sustained measurement (180 frames) to avoid reacting to brief dips. Quality callbacks let systems independently respond (reduce particles, skip animations, etc).

3. **Config-driven colorblind palettes (not CSS filters)**
   - Four palettes defined as typed `ColorPalette` objects in `src/config/accessibility.ts`
   - Systems query `getActivePalette()` for the current palette
   - **Rationale:** CSS filters degrade all visuals uniformly. Config-driven palettes let us tune each color for optimal contrast per vision type. Palettes use the Okabe-Ito color scheme foundations.

4. **ARIA live region for screen reader announcements**
   - Hidden DOM element with `role="status"` and `aria-live="polite"` (or `"assertive"` for milestones/achievements)
   - `announce()` utility clears and re-sets text to force re-announcement
   - **Rationale:** PixiJS Canvas is opaque to screen readers. A live region bridges this gap without requiring complex ARIA tree mirroring.

5. **Keyboard focus management in PixiJS**
   - Custom focus index + rendered focus ring (Graphics stroke) rather than DOM focus
   - Arrow keys, Tab, Enter/Space all work; focus wraps around
   - **Rationale:** PixiJS elements aren't DOM nodes, so native focus doesn't work. A lightweight focus index + visual ring is simpler and more reliable than injecting hidden DOM proxies.

6. **Accessibility preferences persisted via SaveManager**
   - Extended `SettingsSaveData` with `colorVisionMode`, `reducedMotion`, `highContrast`
   - `SAVE_KEYS.SETTINGS` key in localStorage
   - **Rationale:** Accessibility settings must survive page reloads. Using the existing SaveManager pattern keeps it consistent with audio/unlock/achievement persistence.

### Deferred

- **Bundle visualizer**: `rollup-plugin-visualizer` has ESM-only compatibility issues with the project's CommonJS setup. Can revisit when project migrates to ESM or use `source-map-explorer` as alternative.
- **Texture atlasing**: Requires asset pipeline changes; deferred to dedicated sprint.
- **Object pool integration into ParticleSystem**: Pool is ready; actual integration into ParticleSystem's burst/ripple/glow methods is a follow-up task.
- **Reduced motion mode**: Preference is loaded and persisted; actual animation reduction needs per-system opt-in.
- **High contrast mode**: Schema field exists; visual implementation deferred.

---

## 2026-03-14T00:35Z: Title Screen & Main Menu Architecture

**By:** Misty (Web UI Dev)  
**Status:** Implemented (PR #144)  
**Issue:** #117  

### Context

Issue #117 requested a polished title screen and main menu as the player's first impression. Required: animated backdrop, game logo with bloom, studio credit, full menu system (New Run, Continue, Encyclopedia, Achievements, Settings), settings panel with volume sliders and colorblind mode, animated background with particles, and complete keyboard navigation.

### Key Decisions

1. **State Machine over Multiple Scenes**: MenuScene uses an internal state machine (`title → main → settings → credits`) rather than separate scenes for each panel. Rationale: all panels share the animated background and particle system; separate scenes would duplicate rendering and require cross-scene state for settings.

2. **Layer-Based Rendering**: Each menu state gets its own Container, toggled via `visible`. This avoids reconstructing UI on every state change and allows the particle layer to render behind all states.

3. **ParticleSystem Reuse for Fireflies**: Instead of creating a new effect system, MenuScene instantiates ParticleSystem and uses `burst()` with negative gravity and warm colors. This keeps the particle API consistent and avoids code duplication.

4. **AudioManager.getVolumes() Addition**: Settings panel needs to read current volume levels. Added a public `getVolumes()` method that returns a readonly copy of volume preferences. This is cleaner than exposing internal state and follows the existing `getMuteState()` pattern.

5. **SettingsSaveData Schema**: Created a new `SettingsSaveData` interface with `colorblindMode` as the required field and optional fields (`colorVisionMode`, `reducedMotion`, `highContrast`) for future accessibility features. This allows incremental expansion without breaking existing saves.

6. **Continue Button Grayed Logic**: Uses `saveManager.loadGarden() !== null` to determine if a save exists. This is the simplest reliable check — if garden data exists, a run was started.

7. **Keyboard Navigation Design**: Unified navigation model: Arrow Up/Down navigates items, Enter/Space activates, Esc backs out, Tab cycles. In settings, Left/Right adjusts the currently focused slider by 5% increments. Navigation skips disabled items automatically.

### Files Modified

- **New**: `src/scenes/MenuScene.ts`
- **Modified**: `BootScene.ts`, `scenes/index.ts`, `main.ts`, `AudioManager.ts`
- **Schema**: `saveSchema.ts` (SettingsSaveData), `SaveManager.ts` (saveSettings/loadSettings)

### Deferred

- Encyclopedia and Achievements menu items are placeholders (scenes not yet registered)
- Responsive relayout on resize (currently captures dimensions at init time)
- Sound effects for menu navigation (can subscribe to UI events when audio SFX expands)
