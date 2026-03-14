# Seasonal Color Palette Architecture

**Date:** 2025-XX-XX  
**Author:** Sabrina (Procedural Art Director)  
**Issue:** #202  
**PR:** #214  
**Status:** Implemented

## Context

FLORA's GDD specifies distinct visual shifts per season (Spring pastels, Summer golden, Fall oranges, Winter blues). Previously, all seasons looked the same — only the background color changed. This undermined the cozy atmosphere and seasonal identity.

## Decision

Implemented a comprehensive seasonal color palette system with:

1. **Separate Visual Config** (`src/config/seasonalPalettes.ts`)
   - 4 seasonal palettes with background, soil, sky, accent colors
   - Plant saturation multipliers per season (0.7 winter → 1.2 summer)
   - Separate from `SEASON_CONFIG` to maintain gameplay vs. visuals separation

2. **Ambient Particle System Extensions**
   - Added `AmbientParticleConfig` interface to ParticleSystem
   - 4 particle types: petals (Spring), fireflies (Summer), leaves (Fall), snow (Winter)
   - Continuous spawn at 1.5-4 particles/sec with long lifetimes (15-25s)
   - Per-type behaviors: wind drift, upward float, rotation

3. **Seasonal Soil Colors**
   - GridSystem now uses `getSeasonalPalette()` for base soil color
   - Soil quality (0-100%) modulates darkness within seasonal palette
   - Automatic tile refresh on season change

4. **Smooth Palette Transitions**
   - Reused existing `skyLerp` pattern from day/night cycle
   - 2-second easeInOut color transitions between seasons
   - No hard cuts — smooth fade maintains cozy feel

## Rationale

**Why separate palette config from SEASON_CONFIG?**
- `SEASON_CONFIG` owns gameplay mechanics (pest multipliers, hazards)
- `seasonalPalettes` owns pure visual identity
- Allows designers to tune visuals without touching game balance

**Why ambient particles instead of static filters?**
- Particles feel alive and organic (petals drift, fireflies pulse)
- Each season gets unique motion signature
- Low performance cost (~2-4 particles/sec spawn rate)

**Why 2-second transitions?**
- Matches existing day advancement animation timing
- Long enough to feel smooth, short enough to not delay gameplay
- Players notice the shift without waiting

## Consequences

**Positive:**
- Seasons now feel visually distinct (Spring soft, Summer warm, Fall cozy, Winter cold)
- Ambient particles reinforce seasonal identity without being distracting
- Color transitions smooth — no jarring palette swaps
- System is tunable via config (easy to adjust colors/spawn rates)

**Neutral:**
- Adds ~4KB to bundle size (palette config + ambient particle logic)
- Slight performance cost from ambient particles (~10-20 active at a time)

**Negative:**
- None identified. Build passed, acceptance criteria met.

## Future Work

- Could extend ambient particles with weather integration (rain droplets during heavy rain)
- Could add plant saturation multiplier application (not yet connected to plant rendering)
- Could add sky color variation based on time of day within season

## Related

- Issue #88 (Visual Polish) — established ParticleSystem foundation
- `SEASON_CONFIG` in `src/config/seasons.ts` — gameplay season mechanics
- GardenScene's `applySeason()` method — main integration hook
