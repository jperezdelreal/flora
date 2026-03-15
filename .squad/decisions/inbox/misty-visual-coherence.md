# Decision: Unified Cozy Palette for All UI

**By:** Misty (Web UI Dev)  
**Date:** 2025-03-15  
**Issue:** #245  
**PR:** #260  
**Status:** Implemented  

## Context

Flora's UI used dark grey palettes (0x2c2c2c, 0x2a2a2a, 0x1a1a1a) that looked like dev tools, not a cozy gardening game. Toolbar, HUD, PauseMenu, and DaySummary lacked visual coherence and felt sterile. Users reported the visual style was confusing and didn't match the game's cozy theme.

## Decision

Replaced all UI components with a unified warm earthy palette inspired by seasonal tones already in the game. All colors now live as named constants in `src/config/index.ts` — zero inline hex values.

### Color Palette Design

**Buttons:**
- Normal: `BUTTON_BG` (0x5c4a3a — warm brown) with `BUTTON_BORDER` (0x8a6f4f — earthy tan)
- Hover: `BUTTON_HOVER_BG` (0x6b5b4a) with `BUTTON_HOVER_BORDER` (0xa8855f)
- Selected: `BUTTON_SELECTED_BG` (0x7a9b5c — sage green) with `BUTTON_SELECTED_BORDER` (0x9bc077)
- Locked: `BUTTON_LOCKED_BG` (0x3d342c — muted dark brown) with reduced opacity

**Panels & Overlays:**
- Main panels: `PANEL_BG` (0x2a2520 — parchment brown)
- Panel borders: `PANEL_BORDER` (0x6b5b4e — soft earthy brown)
- Overlays: `OVERLAY_DARK` (0x1a1512 — warm very dark brown at 80-85% alpha)
- Menu panels: `MENU_PANEL_BG` (0x2a2520) with `MENU_PANEL_BORDER` (0x8a6f4f)

**Text:**
- Primary: `TEXT_PRIMARY` (#f5e6d3 — cream)
- Disabled: `TEXT_DISABLED` (#8a7a6a — muted brown)
- Hints: `TEXT_HINT` (#c8b9a8 — light brown)
- Tier stars: `TEXT_TIER_STAR` (#ffc857 — warm gold)

**Special States:**
- Unlock glow: `BUTTON_UNLOCK_HIGHLIGHT` (0x7dc97f — soft green)
- Upgrade glow: `BUTTON_UPGRADE_HIGHLIGHT` (0xffc857 — warm gold)

### Visual Refinements

1. **Rounded corners** — All buttons use 8px radius for softer, friendlier feel
2. **Consistent hover states** — Warm sage green (0x7a9b5c) across all menus
3. **Text contrast** — Cream (#f5e6d3) on warm browns meets WCAG AA standards
4. **Animation colors** — Unlock/upgrade pulses use warm greens and golds, not bright blue

## Rationale

**Why warm earth tones?**  
- Matches the garden/nature theme  
- Seasonally appropriate (browns, greens, golds)  
- Feels cozy and organic, not sterile  
- Already present in seasonal palettes — this unifies the aesthetic

**Why config constants?**  
- Single source of truth for color changes  
- Easy to A/B test palette variations  
- Prevents color drift from inline hex values  
- Maintains consistency as team grows

**Why rounded corners?**  
- Softer, friendlier visual language  
- Contrasts with the sharp grid tiles (intentional hierarchy)  
- Industry standard for cozy/casual games

**Why preserve colorblind compatibility?**  
- Accessibility palettes already defined in `src/config/accessibility.ts`  
- Warm palette maintains contrast ratios needed for accessibility modes  
- Color is never the only signal (icons, text, position also convey state)

## Implementation Notes

- **HUD already cozy** — PR #256 established warm palette for HUD; no changes needed
- **ToolBar transformed** — Went from flat dark grey to warm brown with soft borders
- **PauseMenu/DaySummary unified** — Now share the same warm parchment panel style
- **17 new constants** added to `UI_COLORS` in config (PANEL_BG, MENU_ITEM_BG, OVERLAY_DARK, etc.)
- **Zero breaking changes** — All existing functionality preserved

## Follow-Up Work

- **A/B test feedback:** Validate warm palette resonates with players vs. alternatives
- **MenuScene integration:** Apply same palette to title screen, seed selection (separate issue)
- **Dynamic palette switching:** Consider seasonal palette shifts for UI (future enhancement)
- **Accessibility audit:** Verify all color combinations meet WCAG AAA for Level 1 colorblind modes

## Success Criteria

✅ All UI components use warm earthy tones  
✅ No inline hex values — all colors from config  
✅ Buttons have consistent hover/active states  
✅ Rounded corners applied to all buttons  
✅ Text contrast meets accessibility standards  
✅ TypeScript compiles without UI-related errors  
✅ Visual coherence across ToolBar, HUD, PauseMenu, DaySummary  

**Result:** Flora no longer looks like a dev tool. UI feels cozy, garden-appropriate, and visually cohesive.
