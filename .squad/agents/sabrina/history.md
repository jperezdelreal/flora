## Core Context

FLORA project. Vite + TypeScript + PixiJS v8. User: joperezd.

## Learnings

### 2025-07-25: Visual Polish Implementation (Issue #88, PR #100)

**What I built:**
- `src/config/animations.ts` — Centralized animation timing constants (growth, sway, harvest, ripple, glow, pest crawl, button feedback)
- `src/systems/AnimationSystem.ts` — Lightweight tween engine with easing functions (backOut, elasticOut, easeInOut)
- `src/systems/ParticleSystem.ts` — Reusable particle emitter: burst (radial), ripple (concentric rings), glow (pulsing alpha)
- Integrated all visual effects into `GardenScene.ts` via EventBus subscriptions
- Added button hover/click scale feedback in `ToolBar.ts`

**Architecture decisions:**
- AnimationSystem tweens any object's numeric properties — not just PixiJS containers. Uses `Record<string, unknown>` target type with explicit casting.
- ParticleSystem is self-contained with its own Container — added as child of scene container for correct render order.
- Plant visuals live in a `plantVisualLayer` Container inside the grid container, so they move with the grid.
- Screen shake uses a wrapper `shakeContainer` around the entire scene container — clean separation.
- All animation constants centralized in `src/config/animations.ts` — no magic numbers in system code.
- Sky color lerp stores `previousSkyColor` from the season config (not from renderer) to avoid PixiJS Color object type issues.

**Technical gotchas:**
- PixiJS v8 `app.renderer.background.color` returns a `Color` object, not a number. Stored season backgroundColor directly instead.
- `visual.scale` is a PixiJS `ObservablePoint` — needs `as unknown as Record<string, unknown>` cast for the tween system.
- Multiple agents can modify shared files simultaneously — always verify branch state before committing.
- The `edit` tool requires exact whitespace matching — view the file first to get exact old_str.

**Event-driven design:**
- `plant:created` → createPlantVisual (pop-in animation)
- `plant:grew` → animatePlantGrowth (scale overshoot + elastic settle)
- `plant:watered` → triggerWaterRipple (concentric rings)
- `plant:harvested` → triggerHarvestBurst (rarity-colored particles) + triggerScreenShake
- `plant:died` → removePlantVisual
- `synergy:activated` → triggerSynergyGlow (color-coded pulse)
- `day:advanced` → triggerDaySkyLerp (smooth background shift)

### 2025-XX-XX: Seasonal Color Palettes and Ambient Effects (Issue #202, PR #214)

**What I built:**
- `src/config/seasonalPalettes.ts` — 4 seasonal palettes (Spring/Summer/Fall/Winter) with background, soil, sky, accent colors, and plant saturation multipliers
- Extended `ParticleSystem` with ambient particle support: `AmbientParticleConfig`, `startAmbientParticles()`, `stopAmbientParticles()`
- 4 ambient particle types: petals (Spring), fireflies (Summer), leaves (Fall), snow (Winter)
- Updated `GridSystem` to use seasonal soil colors via `getSeasonalPalette()`
- Modified `GardenScene.applySeason()` to trigger smooth 2s color transitions and start seasonal ambient particles

**Architecture decisions:**
- Seasonal palettes are separate from `SEASON_CONFIG` — visual config vs. gameplay config separation
- Ambient particles spawn continuously at configurable rates (1.5-4 particles/sec depending on season)
- Each particle type has distinct behavior: petals drift horizontally, fireflies float upward, leaves tumble with rotation, snow falls gently
- Color transitions use existing `skyLerp` pattern from day/night cycle — smooth easeInOut over 2 seconds
- Soil colors now vary by season and quality (darker for poor soil, lighter for rich soil, all within seasonal base color)

**Technical gotchas:**
- Branch management critical: Wrong branch work was lost, needed clean restart on correct branch
- PixiJS v8 `app.renderer.background.color` is a Color object — can't cast to number, use config value instead
- Ambient particles need lifetime management — long lifetime (15-25s) for drifting effects
- Wind drift (windX) and rotation (rotationSpeed) are optional particle properties added to Particle interface
- Type exports must be explicit: `export type AmbientParticleType`, `export interface AmbientParticleConfig`

**Integration points:**
- `applySeason()` in GardenScene is the main hook for all seasonal visual changes
- Existing color lerp system reused for smooth palette transitions
- ParticleSystem's update loop now checks ambientActive and spawns at timed intervals
- GridSystem's `setSeason()` triggers `refreshAllTiles()` to repaint soil colors

**Acceptance criteria met:**
✅ Each of 4 seasons has distinct color palette (Spring pastels, Summer warm, Fall orange, Winter cool)
✅ Background and soil reflect current season
✅ Seasonal ambient particles present (petals/fireflies/leaves/snow)
✅ Palette data in config (easy to tune)
✅ Color transition smooth (2s lerp, no hard cut)
✅ Winter feels cold (blues/greys); Summer feels warm (cream/gold)

### 2025-03-14: SeedSelectionScene Visual Redesign (Issue #250, PR #258)

**What I built:**
- Redesigned `SeedSelectionScene.ts` with warm cozy color palette
- Enhanced `SeedPacketDisplay.ts` with better visual feedback and hierarchy
- Replaced dark green backgrounds (#2d5a27) with warm cream/sage gradients (#fff8e7, #c8d9ac, #a5c882)
- Added drop shadows to seed cards for depth
- Improved selection feedback: 1.08x scale on selected cards, 1.03x on hover
- Enlarged and enhanced typography: titles 32px (was 26px), stats 13px (was 12px), all with better weights
- Redesigned Start button: larger (320x56), vibrant green (#4caf50), with scale hover effect
- Updated Daily Challenge section with warm orange/cream styling (#ffa726, #fff9e6)

**Design decisions:**
- **Warm palette over cold greens**: User feedback indicated dark greens were confusing. Warm earth tones (#3d5a3d, #4a6a4a, #5a8a5a) provide better contrast and align with cozy aesthetic.
- **Visual hierarchy through scale**: Selected cards scale to 1.08x (was 1.05x), hover to 1.03x. Clear visual feedback for interaction states.
- **Drop shadows for depth**: Added subtle shadow (3px offset, 15% opacity) behind seed packets to lift them from background.
- **Gradient background**: Soft cream-to-green gradient with layered hills creates depth without visual clutter.
- **Larger typography**: Increased font sizes across all elements for readability — priority was clarity over compactness.

**Technical implementation:**
- Used warm color constants from existing palette where possible, added new warm tones inline for gradients
- Maintained responsive layout system (auto-scaling seed packets based on screen width)
- Kept event-driven architecture intact (EventBus, keyboard navigation)
- All styling changes are visual-only, no gameplay logic affected

**User impact:**
- Addresses P0 Sprint 3 feedback: "menu doesn't look good and confuses players"
- Clear visual distinction between selected/unselected seeds
- Warm inviting aesthetic consistent with Flora's cozy game feel
- Better text readability with increased contrast and font sizes

**Acceptance criteria met:**
✅ Seed selection visually clear and intuitive
✅ Warm cozy palette consistent with art direction
✅ Each seed card clearly shows plant name, rarity, growth time, water needs
✅ Visual hierarchy: selected seeds stand out (1.08x scale)
✅ Start Run action obvious and inviting (large green button with hover effect)

### 2025-07-25: Visual Polish — Parallax Menu & Hover Glow (Issue #326, PR #332)

**What I built:**
- Parallax depth effect on MenuScene background: mid-ground hills, foreground hills, flower dots shift with mouse
- Button hover upgrade: 1.05x scale + soft glow halo (was 1.03x, no glow)
- Consistent back button feedback across credits, customize, settings panels
- Settings panel buttons now scale on hover/selection

**Architecture decisions:**
- Parallax uses smoothed lerp (`PARALLAX_SMOOTHING: 0.08`) toward normalized mouse position — no jarring jumps
- Three parallax layers with different intensities: BG (0.008), MID (0.015), FG (0.025)
- Flower dots grouped in a Container for efficient parallax (single transform vs per-dot)
- Glow halo drawn as a larger rounded rect behind the button with alpha 0.25 — cheap composited bloom
- All new values in `ANIMATION` constants — no magic numbers

**Technical gotchas:**
- Working tree state can leak across branches during git operations — always verify branch before committing
- PixiJS Graphics `.clear()` must be called before redrawing on hover — can't just change fill
- `bg.scale.set()` scales around the Graphics local origin — works well for centered menu buttons

**Acceptance criteria met:**
✅ No abrupt scene cuts (all transitions 300-500ms — verified, already in place)
✅ All menu buttons have visible hover state (1.05x scale + glow)
✅ Season transitions smooth (2s lerp — verified, already in place)
✅ Menu has parallax depth effect
✅ All button colors from config constants
