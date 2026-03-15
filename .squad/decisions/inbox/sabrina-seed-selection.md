# Decision: Warm Palette Standard for UI Scenes

**By:** Sabrina (Procedural Art Director)  
**Date:** 2025-03-14  
**Context:** Issue #250 (SeedSelectionScene redesign)

## Problem

User feedback indicated SeedSelectionScene was visually confusing. Dark green backgrounds (#2d5a27) and cold color palette created poor contrast and didn't convey Flora's cozy aesthetic.

## Decision

Establish warm cream/sage/earth tone palette as the standard for all non-garden UI scenes (Menu, SeedSelection, Encyclopedia, Achievements).

**Palette:**
- Primary background: `#fff8e7` (warm cream)
- Secondary hills: `#c8d9ac` (warm sage), `#a5c882` (soft green)
- Text primary: `#3d5a3d` (warm dark green)
- Text secondary: `#4a6a4a`, `#5a8a5a` (earth tones)
- Accent warm: `#ffa726` (warm orange for special elements)
- Primary action: `#4caf50` (vibrant green for CTAs)

**Dark greens retired for UI:**
- `#2d5a27` (COLORS.DARK_GREEN) → Only for GardenScene backdrop
- `#1a3a1a` and similar → Replaced with warm cream/white cards

## Rationale

1. **Contrast**: Warm cream backgrounds provide better contrast for dark green text than dark green backgrounds with light text
2. **Cozy aesthetic**: Warm tones evoke comfort and safety, core Flora pillars
3. **Hierarchy**: Light backgrounds make card-based UI pop with shadows and borders
4. **Consistency**: Aligns with seed packet "vintage paper" design already established
5. **Accessibility**: Higher contrast ratios for text readability

## Implementation

Applied to SeedSelectionScene (PR #258):
- Background gradient: cream → pale green with soft hills
- All cards: warm cream (#fff8e7) with colored borders
- Typography: earth tones (#3d5a3d, #4a6a4a) with increased sizes
- Shadows: 15% opacity for depth without harshness

## Impact

- **Other UI scenes** should adopt this palette (MenuScene, Encyclopedia, Achievements)
- **GardenScene** retains its own palette (seasonal colors, soil tones)
- **Config consolidation**: Consider adding `UI_WARM_PALETTE` to `src/config/index.ts`

## Next Steps

1. ✅ SeedSelectionScene redesigned with warm palette
2. ⬜ Audit MenuScene for consistency (already has warm styling, verify alignment)
3. ⬜ Apply to Encyclopedia and Achievements when built
4. ⬜ Add UI_WARM_PALETTE constants to config if pattern proven successful
