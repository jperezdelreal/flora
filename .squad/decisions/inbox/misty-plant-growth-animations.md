# Plant Growth Animation Architecture

**By:** Misty (Web UI Dev)  
**Date:** 2026-03-14  
**Status:** Implemented (PR #207)  
**Issue:** #197  

## Context

Issue #197 required smooth plant growth animations with distinct visual identities for all 22 plants. This is the core visual experience of Flora — players watch plants grow from seeds to mature forms over multiple game days.

## Key Decisions

### 1. **Procedural shape rendering over sprite assets**
- **Decision**: Use PixiJS Graphics API to draw plant shapes procedurally based on plant type
- **Rationale**: 
  - No art pipeline needed for MVP — designer can iterate in code
  - Flexible: colors, sizes, and shapes adjustable via config
  - Performance: Graphics objects are lightweight, 64+ plants render at 60 FPS
  - Accessibility: Color adjustments integrate seamlessly with colorblind palettes
- **Implementation**: Created 8 shape types (circle, oval, tall, wide, star, bush, flower, root) with custom draw functions

### 2. **Config-driven visual definitions**
- **Decision**: Centralize all plant appearance data in `src/config/plantVisuals.ts`
- **Rationale**:
  - Easy to add new plants without touching rendering code
  - Visual tuning (colors, sway intensity, glow) lives in one place
  - Keyframe data (scale, alpha, saturation, yOffset) per growth stage is data-driven
  - Future: Could load from JSON for modding support
- **Schema**: `PlantVisualDef` type defines plantId, keyframes, matureShape, colors, swayIntensity, glowOnMature

### 3. **Keyframe interpolation for smooth transitions**
- **Decision**: Use AnimationSystem to tween between keyframe values (scale, alpha) rather than instant stage changes
- **Rationale**:
  - Players perceive growth as continuous, not discrete jumps
  - ElasticOut easing adds "juicy" pop when plants reach new stages
  - Per-plant sway intensity multiplier personalizes idle motion
- **Implementation**: Growth stage changes trigger `animatePlantGrowth()` which tweens scale/alpha while redrawing at new size

### 4. **Health-based visual degradation (wilting)**
- **Decision**: Desaturate and dim plant colors when health drops, refresh visuals on >5% health change
- **Rationale**:
  - Visual feedback for under-watered or pest-damaged plants
  - Avoids per-frame redraw by caching last known health
  - Player can visually assess garden health at a glance
- **Implementation**: `adjustColorForHealth()` scales RGB values by health factor (0.3–1.0)

### 5. **Per-plant sway intensity**
- **Decision**: Define `swayIntensity` (0.4–1.8) per plant, multiplied by base sway amplitude
- **Rationale**:
  - Tall plants (frost_willow, sunflower, pea) sway more than low plants (carrot, radish)
  - Adds personality and realism to idle animations
  - Performance: Sine calculation is cheap, 64 plants swaying is negligible overhead
- **Values**: Tall plants 1.5–1.8x, medium 1.0x, short/roots 0.4–0.5x

## Alternative Approaches Considered

### Sprite-based animation
- **Rejected**: Would require 22 plants × 4 stages = 88+ sprite assets
- **Trade-off**: More visual fidelity but higher art cost and less flexibility
- **Future option**: Could replace procedural rendering with sprites in post-MVP polish phase

### Per-plant custom rendering code
- **Rejected**: Would scatter plant appearance logic across 22 separate functions
- **Trade-off**: Maximum control but poor maintainability
- **Decision**: Use 8 reusable shape types that cover all plants

### Real-time color interpolation during growth
- **Rejected**: Would require per-frame color lerp between stage colors
- **Trade-off**: Smoother color transitions but higher CPU cost
- **Decision**: Redraw at new color on stage change only (players don't notice)

## Impact on Other Systems

- **PlantSystem**: No changes needed — growth stage events already exist
- **EventBus**: Reused existing `plant:grew` event to trigger visual updates
- **AnimationSystem**: No changes — tween API sufficient for scale/alpha
- **Accessibility**: Integrated with existing `getActivePalette()` for colorblind-safe colors
- **Performance**: FPSMonitor shows 60 FPS stable with 64 plants (8×8 grid all mature)

## Success Criteria Met

- ✅ All 22 plants have visually distinct mature forms
- ✅ Growth transitions are smooth (elasticOut easing)
- ✅ Seed stage is minimal (0.3× scale, 0.8 alpha)
- ✅ Mature plants have gentle idle sway (sine-wave rotation)
- ✅ Wilting plants are visually desaturated (<70% health)
- ✅ Performance: 64 plants @ 60 FPS
- ✅ Plant visual data defined in config (no hardcoded rendering)

## Future Enhancements

- **Particle effects on growth stage transitions** — currently only on harvest
- **Seasonal color variations** — plants could shift hues based on season
- **Weather effects** — rain/wind could affect sway amplitude
- **Rare plant glow animation** — pulse alpha on heirloom/rare plants at mature stage
- **Sprite texture option** — load PNG sprites if available, fallback to procedural

## Files Modified

- **New**: `src/config/plantVisuals.ts` (22 plant visual definitions)
- **Modified**: `src/scenes/GardenScene.ts` (plant rendering functions)

## Related Work

- Issue #116 (Accessibility) — colorblind palette integration
- Issue #120 (Content Expansion) — 22 plants defined in `src/config/plants.ts`
- PR #143 (Performance) — ObjectPool, FPSMonitor (used to validate 60 FPS target)
