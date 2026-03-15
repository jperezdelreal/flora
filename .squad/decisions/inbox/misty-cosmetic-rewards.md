# Cosmetic Reward System — Design Decisions

**Date:** 2025-01-27
**Issue:** #198
**Author:** Misty (Web UI Dev)

## Decisions

### 1. Config-driven cosmetic definitions
All cosmetic definitions live in `src/config/cosmetics.ts` as typed readonly records. This keeps visual data centralized and makes it easy to add new skins/themes/badges without touching UI components.

### 2. HUD theme as palette object
HUD themes are full `HudThemeConfig` objects with panel bg, border, text colors, accent, progress bar, phase bar, and hint colors. The HUD reads from `this.activeTheme` rather than inline hex values, enabling runtime theme switching.

### 3. Seed skins as optional parameter
`SeedPacketDisplay` accepts an optional `SeedSkinConfig` in its constructor. When null, default rarity colors are used. This keeps the component backward-compatible.

### 4. Cosmetic persistence in SettingsSaveData
Active cosmetic selections (activeSeedSkin, activeHudTheme, activeBadges) are stored in `SettingsSaveData` alongside colorblind/accessibility settings. This ensures cosmetics persist across sessions.

### 5. Customize menu gated by unlocks
The "Customize" menu item is only enabled when `unlockedCosmetics.length > 0`. This prevents confusion for new players who haven't earned any rewards yet.

### 6. Sparkle animation for apply feedback
When a cosmetic is first applied, a 0.5s alpha oscillation effect plays on the selected row. This provides immediate, cozy visual feedback without being disruptive.
