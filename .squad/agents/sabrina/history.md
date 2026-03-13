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
