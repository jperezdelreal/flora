# Decision: Visual Polish Architecture (Issue #88)

**By:** Sabrina (Procedural Art Director)  
**Date:** 2025-07-25  
**Status:** Implemented (PR #100)

## Context

Issue #88 required tactile animations, particle effects, and scene transitions to fulfill the GDD's cozy pillar. Needed a system architecture that supports future visual expansion without per-frame overhead concerns.

## Decisions

1. **AnimationSystem as generic tweener** — Not PixiJS-specific. Tweens any object's numeric properties via `Record<string, unknown>`. Allows reuse for UI animations, camera effects, etc.

2. **ParticleSystem owns its Container** — Self-contained render layer. Added as child of scene container so particles render above game elements. Each effect type (burst/ripple/glow) is independent and auto-cleans.

3. **Plant visuals as overlay, not integrated into GridSystem** — Plant visual containers live in `plantVisualLayer` inside the grid container. GridSystem continues rendering tile states independently. This keeps GridSystem simple and lets visual animations be purely cosmetic.

4. **Screen shake via wrapper Container** — `shakeContainer` wraps the entire scene. Simpler and cleaner than modifying camera position or stage offset.

5. **All timing in config/animations.ts** — Zero magic numbers in system code. Future tuning requires only config changes.

6. **Event-driven visual hooks** — All visual effects triggered via EventBus subscriptions, not direct system coupling. PlantSystem, SynergySystem etc. don't know about visuals.

## Deferred

- Sprite-based plant visuals (currently procedural Graphics circles) — needs art assets
- Weather particle effects (rain, snow, dust) — per GDD §5.3
- Garden expansion animation — not yet designed
- Shader-based effects (watercolor, ink wash) — my specialty, waiting on art direction approval
