# Decision: Title Screen & Main Menu Architecture

**By:** Misty (Web UI Dev)
**Date:** 2026-03-14
**Status:** Implemented (PR #144)
**Issue:** #117

## Context

Issue #117 requested a polished title screen and main menu as the player's first impression. Required: animated backdrop, game logo with bloom, studio credit, full menu system (New Run, Continue, Encyclopedia, Achievements, Settings), settings panel with volume sliders and colorblind mode, animated background with particles, and complete keyboard navigation.

## Key Decisions

1. **State Machine over Multiple Scenes**: MenuScene uses an internal state machine (`title → main → settings → credits`) rather than separate scenes for each panel. Rationale: all panels share the animated background and particle system; separate scenes would duplicate rendering and require cross-scene state for settings.

2. **Layer-Based Rendering**: Each menu state gets its own Container, toggled via `visible`. This avoids reconstructing UI on every state change and allows the particle layer to render behind all states.

3. **ParticleSystem Reuse for Fireflies**: Instead of creating a new effect system, MenuScene instantiates ParticleSystem and uses `burst()` with negative gravity and warm colors. This keeps the particle API consistent and avoids code duplication.

4. **AudioManager.getVolumes() Addition**: Settings panel needs to read current volume levels. Added a public `getVolumes()` method that returns a readonly copy of volume preferences. This is cleaner than exposing internal state and follows the existing `getMuteState()` pattern.

5. **SettingsSaveData Schema**: Created a new `SettingsSaveData` interface with `colorblindMode` as the required field and optional fields (`colorVisionMode`, `reducedMotion`, `highContrast`) for future accessibility features. This allows incremental expansion without breaking existing saves.

6. **Continue Button Grayed Logic**: Uses `saveManager.loadGarden() !== null` to determine if a save exists. This is the simplest reliable check — if garden data exists, a run was started.

7. **Keyboard Navigation Design**: Unified navigation model: Arrow Up/Down navigates items, Enter/Space activates, Esc backs out, Tab cycles. In settings, Left/Right adjusts the currently focused slider by 5% increments. Navigation skips disabled items automatically.

## Files

- **New**: `src/scenes/MenuScene.ts`
- **Modified**: `BootScene.ts`, `scenes/index.ts`, `main.ts`, `AudioManager.ts`
- **Schema**: `saveSchema.ts` (SettingsSaveData), `SaveManager.ts` (saveSettings/loadSettings)

## Deferred

- Encyclopedia and Achievements menu items are placeholders (scenes not yet registered)
- Responsive relayout on resize (currently captures dimensions at init time)
- Sound effects for menu navigation (can subscribe to UI events when audio SFX expands)
