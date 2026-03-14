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
